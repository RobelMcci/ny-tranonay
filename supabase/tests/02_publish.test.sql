-- Fonctions de publication : draft_content, publish_content, restore_snapshot, published_content,
-- et caractère append-only de content_snapshots.
-- Les rôles sont simulés avec `set local role` + `request.jwt.claims` pour que auth.uid() fonctionne.
begin;

select plan(105);

-- Petites fonctions utilitaires (schéma temporaire) : clés triées d'un objet jsonb.
create function pg_temp.keys_of(j jsonb) returns text[]
language sql immutable as $$
  select coalesce(array_agg(k order by k collate "C"), '{}') from jsonb_object_keys(j) k;
$$;
create function pg_temp.sorted(a text[]) returns text[]
language sql immutable as $$
  select array_agg(x order by x collate "C") from unnest(a) x;
$$;

-- Contexte partagé entre les rôles (résultats mis de côté pour comparer plus tard).
create temp table ctx (k text primary key, v text, j jsonb);
grant all on ctx to public;

-- ---------------------------------------------------------------------------
-- Données de départ (rôle postgres)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@test.local'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'client@test.local');

insert into admins (user_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

insert into settings (
  id, name, tagline, phone, whatsapp_number, email, facebook_url, messenger_url, facebook_followers,
  street, city, postal_code, country, country_code, latitude, longitude,
  open_hour, close_hour, hours_label, room_check_in, room_check_out,
  security_summary, security_partner_name, security_partner_url
) values (
  1, 'Test', 'Accroche', '+261 00 000 00 00', '261000000000', 'a@test.local', 'https://fb.test', 'https://m.test', 10,
  'Rue', 'Ville', '101', 'Pays', 'MG', -18.9, 47.4,
  8, 21, 'De 8h à 21h', '10h', '10h le lendemain',
  'Gardiens', 'Partenaire', 'https://partenaire.test'
);

-- Insérés volontairement dans le désordre pour vérifier les tris.
insert into prices (key, label, amount, unit) values
  ('reception_jour',     'Réception (jour)',     150000, 'ar'),
  ('plat_du_jour',       'Plat du jour',         12000,  'ar'),
  ('reception_max_invites', 'Invités maximum',   200,    'personnes');

insert into photos (key, file, storage_path, alt, category, width, height, gallery_position, visible) values
  ('p_seed',   'image1',      null,              'Photo du seed',      'Espace', 100, 80, 0,    true),
  ('p_cms',    'cms/p_cms',   'cms/p_cms.webp',  'Photo téléversée',   'Espace', 200, 90, null, true),
  ('p_hidden', 'image3',      null,              'Photo masquée',      'Espace', 100, 100, 1,   false);

insert into photo_slots (slot_key, photo_key) values ('home.hero', 'p_cms');

insert into rooms (id, name, price_ar, features, photo_keys, quantity, position, visible) values
  ('chambre-b',      'Chambre B',      60000, array['Wi-Fi', 'Douche'], array['p_seed', 'p_cms'], 2, 2, true),
  ('chambre-a',      'Chambre A',      45000, array['Ventilateur'],     array['p_seed'],          1, 1, true),
  ('chambre-masquee','Chambre masquée',99000, '{}',                     '{}',                     1, 0, false);

insert into list_items (list_key, label, position, visible) values
  ('extras', 'Extra 2',        2, true),
  ('extras', 'Extra 1',        1, true),
  ('extras', 'Extra masqué',   0, false),
  ('activites', 'Pêche',       0, true);

insert into faqs (question, answer, position, visible) values
  ('Question 2 ?',       'Réponse 2.',  2, true),
  ('Question 1 ?',       'Réponse 1.',  1, true),
  ('Question masquée ?', 'Secrète.',    0, false);

insert into pages_seo (path, title, description, priority, nav_label) values
  ('/contact/', 'Contact',  'Page contact',  0.5, 'Contact'),
  ('/',         'Accueil',  'Page accueil',  1.0, null),
  ('/a-propos/','À propos', 'Page à propos', 0.5, 'À propos');

insert into texts (key, value) values ('home.title', 'Bienvenue {{tel}}');

-- ---------------------------------------------------------------------------
-- Structure
-- ---------------------------------------------------------------------------
select has_function('public', 'draft_content',    'draft_content() existe');
select has_function('public', 'publish_content',  array['text'], 'publish_content(text) existe');
select has_function('public', 'restore_snapshot', array['uuid'], 'restore_snapshot(uuid) existe');
select has_view('public', 'published_content', 'la vue published_content existe');

select is(
  (select count(*)::int from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname in ('draft_content', 'publish_content', 'restore_snapshot')
      and prosecdef),
  3, 'les trois fonctions sont security definer'
);
select is(
  (select count(*)::int from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname in ('draft_content', 'publish_content', 'restore_snapshot')
      and 'search_path=public' = any (proconfig)),
  3, 'les trois fonctions fixent search_path = public'
);
select ok(not has_function_privilege('anon', 'public.draft_content()', 'execute'),
  'anon ne peut pas exécuter draft_content');
select ok(not has_function_privilege('anon', 'public.publish_content(text)', 'execute'),
  'anon ne peut pas exécuter publish_content');
select ok(not has_function_privilege('anon', 'public.restore_snapshot(uuid)', 'execute'),
  'anon ne peut pas exécuter restore_snapshot');
select ok(has_function_privilege('authenticated', 'public.draft_content()', 'execute'),
  'authenticated peut exécuter draft_content');
select ok(has_function_privilege('authenticated', 'public.publish_content(text)', 'execute'),
  'authenticated peut exécuter publish_content');
select ok(has_function_privilege('authenticated', 'public.restore_snapshot(uuid)', 'execute'),
  'authenticated peut exécuter restore_snapshot');

select ok(
  coalesce((select 'security_invoker=false' = any (reloptions) or reloptions is null
              from pg_class where oid = 'public.published_content'::regclass), false),
  'published_content n''est pas security_invoker (droits du propriétaire)'
);
select ok(has_table_privilege('anon', 'public.published_content', 'select'),
  'anon peut lire published_content');
select ok(has_table_privilege('authenticated', 'public.published_content', 'select'),
  'authenticated peut lire published_content');
select ok(not has_table_privilege('anon', 'public.content_snapshots', 'select'),
  'anon n''a toujours aucun droit direct sur content_snapshots');

select is(
  (select count(*)::int from pg_trigger
    where tgrelid = 'public.content_snapshots'::regclass and not tgisinternal),
  3, 'trois déclencheurs append-only (update, delete, truncate) sur content_snapshots'
);
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'content_snapshots'),
  1, 'une seule politique sur content_snapshots'
);
select is(
  (select cmd from pg_policies where schemaname = 'public' and tablename = 'content_snapshots'),
  'SELECT', 'la politique de content_snapshots est en lecture seule'
);

-- ---------------------------------------------------------------------------
-- Aucun instantané : la vue est vide
-- ---------------------------------------------------------------------------
select is_empty('select * from published_content', 'published_content est vide sans instantané');

-- ---------------------------------------------------------------------------
-- draft_content() par un administrateur
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text, true);

select is(is_admin(), true, 'l''administrateur est reconnu');

insert into ctx select 'd', null, draft_content();

reset role;

select is(
  pg_temp.keys_of((select j from ctx where k = 'd')),
  pg_temp.sorted(array['version','settings','prices','rooms','lists','faqs','pages','photos','photoSlots','texts']),
  'draft_content() expose exactement les clés du contrat'
);
select is(jsonb_typeof((select j->'version' from ctx where k = 'd')), 'null', 'version vaut null');

-- settings
select is(
  pg_temp.keys_of((select j->'settings' from ctx where k = 'd')),
  pg_temp.sorted(array['name','tagline','phone','whatsappNumber','email','facebookUrl','messengerUrl',
    'facebookFollowers','street','city','postalCode','country','countryCode','latitude','longitude',
    'openHour','closeHour','hoursLabel','roomCheckIn','roomCheckOut',
    'securitySummary','securityPartnerName','securityPartnerUrl']),
  'settings expose exactement les clés du contrat (camelCase)'
);
select is((select j#>>'{settings,name}' from ctx where k = 'd'), 'Test', 'settings.name');
select is((select j#>>'{settings,whatsappNumber}' from ctx where k = 'd'), '261000000000', 'settings.whatsappNumber');
select is(jsonb_typeof((select j#>'{settings,facebookFollowers}' from ctx where k = 'd')), 'number', 'facebookFollowers est un nombre');
select is((select (j#>>'{settings,latitude}')::numeric from ctx where k = 'd'), -18.9, 'settings.latitude');
select is((select (j#>>'{settings,openHour}')::int from ctx where k = 'd'), 8, 'settings.openHour');
select is((select j#>>'{settings,securityPartnerUrl}' from ctx where k = 'd'), 'https://partenaire.test', 'settings.securityPartnerUrl');

-- prix : triés par clé, forme {key,label,amount,unit}
select is(
  (select array(select e->>'key' from jsonb_array_elements(j->'prices') e) from ctx where k = 'd'),
  array['plat_du_jour', 'reception_jour', 'reception_max_invites'],
  'prices est trié par clé'
);
select is(
  pg_temp.keys_of((select j#>'{prices,0}' from ctx where k = 'd')),
  pg_temp.sorted(array['key','label','amount','unit']),
  'prices[0] a les clés key, label, amount, unit'
);
select is(jsonb_typeof((select j#>'{prices,0,amount}' from ctx where k = 'd')), 'number', 'prices[0].amount est un nombre');
select is((select j#>>'{prices,2,unit}' from ctx where k = 'd'), 'personnes', 'prices[2].unit');

-- chambres : visibles, triées par position
select is(
  (select array(select e->>'id' from jsonb_array_elements(j->'rooms') e) from ctx where k = 'd'),
  array['chambre-a', 'chambre-b'],
  'rooms ne contient que les chambres visibles, triées par position'
);
select is(
  pg_temp.keys_of((select j#>'{rooms,0}' from ctx where k = 'd')),
  pg_temp.sorted(array['id','name','price','features','photoKeys','quantity']),
  'rooms[0] a les clés id, name, price, features, photoKeys, quantity'
);
select is(jsonb_typeof((select j#>'{rooms,0,photoKeys}' from ctx where k = 'd')), 'array', 'rooms[0].photoKeys est un tableau');
select is(jsonb_typeof((select j#>'{rooms,0,features}' from ctx where k = 'd')), 'array', 'rooms[0].features est un tableau');
select is((select (j#>>'{rooms,1,price}')::int from ctx where k = 'd'), 60000, 'rooms[1].price vient de price_ar');
select is((select j#>'{rooms,1,photoKeys}' from ctx where k = 'd'), '["p_seed","p_cms"]'::jsonb, 'rooms[1].photoKeys conserve l''ordre');
select is((select (j#>>'{rooms,1,quantity}')::int from ctx where k = 'd'), 2, 'rooms[1].quantity');

-- listes : six clés toujours présentes, visibles, triées
select is(
  pg_temp.keys_of((select j->'lists' from ctx where k = 'd')),
  pg_temp.sorted(array['inclus_privatisation','inclus_reception','extras','activites','pack_couple','types_evenement']),
  'lists contient toujours les six clés'
);
select is((select j#>'{lists,extras}' from ctx where k = 'd'), '["Extra 1","Extra 2"]'::jsonb, 'lists.extras : visibles, triés par position');
select is((select j#>'{lists,activites}' from ctx where k = 'd'), '["Pêche"]'::jsonb, 'lists.activites');
select is((select j#>'{lists,inclus_privatisation}' from ctx where k = 'd'), '[]'::jsonb, 'une liste sans ligne est un tableau vide');
select is((select j#>'{lists,types_evenement}' from ctx where k = 'd'), '[]'::jsonb, 'types_evenement vide par défaut');

-- FAQ
select is(
  (select j->'faqs' from ctx where k = 'd'),
  '[{"question":"Question 1 ?","answer":"Réponse 1."},{"question":"Question 2 ?","answer":"Réponse 2."}]'::jsonb,
  'faqs : une FAQ masquée est absente, tri par position, clés question/answer'
);

-- pages
select is(
  (select array(select e->>'path' from jsonb_array_elements(j->'pages') e) from ctx where k = 'd'),
  array['/', '/a-propos/', '/contact/'],
  'pages : position (0 pour toutes ici) puis chemin'
);
select is(
  pg_temp.keys_of((select j#>'{pages,0}' from ctx where k = 'd')),
  pg_temp.sorted(array['path','title','description','priority','navLabel']),
  'pages[0] a les clés path, title, description, priority, navLabel'
);
select is(jsonb_typeof((select j#>'{pages,0,navLabel}' from ctx where k = 'd')), 'null', 'navLabel vaut null quand nav_label est nul');
select is((select j#>>'{pages,1,navLabel}' from ctx where k = 'd'), 'À propos', 'navLabel reprend nav_label');
select is((select (j#>>'{pages,0,priority}')::numeric from ctx where k = 'd'), 1.0, 'pages[0].priority est numérique');

-- photos
select is(
  (select array(select e->>'key' from jsonb_array_elements(j->'photos') e) from ctx where k = 'd'),
  array['p_cms', 'p_seed'],
  'photos ne contient que les photos visibles'
);
select is(
  pg_temp.keys_of((select j#>'{photos,0}' from ctx where k = 'd')),
  pg_temp.sorted(array['key','file','storagePath','alt','category','width','height','galleryPosition']),
  'photos[0] a exactement les clés du contrat'
);
select is((select j#>>'{photos,0,storagePath}' from ctx where k = 'd'), 'cms/p_cms.webp', 'photos[0].storagePath');
select is((select j#>>'{photos,0,file}' from ctx where k = 'd'), 'cms/p_cms', 'photos[0].file');
select is(jsonb_typeof((select j#>'{photos,0,galleryPosition}' from ctx where k = 'd')), 'null', 'galleryPosition nul hors galerie');
select is(jsonb_typeof((select j#>'{photos,1,storagePath}' from ctx where k = 'd')), 'null', 'storagePath nul pour une photo du seed');
select is((select (j#>>'{photos,1,galleryPosition}')::int from ctx where k = 'd'), 0, 'photos[1].galleryPosition');
select is((select (j#>>'{photos,1,width}')::int from ctx where k = 'd'), 100, 'photos[1].width est un nombre');

-- emplacements et textes
select is((select j->'photoSlots' from ctx where k = 'd'), '{"home.hero":"p_cms"}'::jsonb, 'photoSlots : clé -> photo');
select is((select j->'texts' from ctx where k = 'd'), '{"home.title":"Bienvenue {{tel}}"}'::jsonb, 'texts : clé -> valeur');

-- ---------------------------------------------------------------------------
-- publish_content : première publication
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text, true);

insert into ctx select 'id1', publish_content('t')::text, null;
select isnt((select v from ctx where k = 'id1'), null, 'publish_content retourne un uuid');
select is((select count(*)::int from content_snapshots), 1, 'une ligne dans content_snapshots');
select is((select label from content_snapshots), 't', 'l''étiquette est enregistrée');
select is((select created_by from content_snapshots), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'created_by = auth.uid()');
select is((select payload from content_snapshots), (select j from ctx where k = 'd'), 'le payload est draft_content()');
select is((select id::text from content_snapshots), (select v from ctx where k = 'id1'), 'l''id retourné est celui de la ligne');

reset role;

-- anon lit la dernière publication, sans droit direct sur la table
set local role anon;
select is((select id::text from published_content), (select v from ctx where k = 'id1'), 'anon lit l''id publié');
select is((select payload from published_content), (select j from ctx where k = 'd'), 'anon lit le payload publié');
select throws_ok('select * from content_snapshots', '42501', null, 'anon ne lit toujours pas content_snapshots');
select throws_ok('select draft_content()', '42501', null, 'anon ne peut pas appeler draft_content');
select throws_ok($$select publish_content('x')$$, '42501', null, 'anon ne peut pas appeler publish_content');
select throws_ok($$select restore_snapshot('00000000-0000-0000-0000-000000000000')$$, '42501', null, 'anon ne peut pas appeler restore_snapshot');
reset role;

-- ---------------------------------------------------------------------------
-- Deuxième publication : la vue renvoie la plus récente
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text, true);

update prices set amount = 160000 where key = 'reception_jour';
insert into ctx select 'id2', publish_content('t2')::text, null;
select is((select count(*)::int from content_snapshots), 2, 'deux lignes après deux publications');
reset role;

set local role anon;
select is((select id::text from published_content), (select v from ctx where k = 'id2'), 'published_content renvoie la seconde publication');
select is((select (payload#>>'{prices,1,amount}')::int from published_content), 160000, 'le payload reflète la modification');
reset role;

-- ---------------------------------------------------------------------------
-- restore_snapshot : nouvelle ligne copiant la première
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text, true);

insert into ctx select 'id3', restore_snapshot((select v::uuid from ctx where k = 'id1'))::text, null;
select is((select count(*)::int from content_snapshots), 3, 'restore_snapshot crée une 3e ligne (aucune ligne remplacée)');
select isnt((select v from ctx where k = 'id3'), (select v from ctx where k = 'id1'), 'la restauration a un nouvel id');
select is(
  (select payload from content_snapshots where id = (select v::uuid from ctx where k = 'id3')),
  (select payload from content_snapshots where id = (select v::uuid from ctx where k = 'id1')),
  'le payload restauré égale celui de la première version'
);
select matches(
  (select label from content_snapshots where id = (select v::uuid from ctx where k = 'id3')),
  '^Retour à la version du ',
  'l''étiquette de restauration est « Retour à la version du … »'
);
select is(
  (select created_by from content_snapshots where id = (select v::uuid from ctx where k = 'id3')),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'created_by de la restauration = auth.uid()'
);
select is(
  (select payload from content_snapshots where id = (select v::uuid from ctx where k = 'id1')) is not null
    and (select count(*) from content_snapshots where id = (select v::uuid from ctx where k = 'id1')) = 1,
  true, 'la première version existe toujours'
);
select throws_ok(
  $$select restore_snapshot('00000000-0000-0000-0000-000000000000')$$,
  'P0002', null, 'restore_snapshot refuse un id inexistant'
);
reset role;

set local role anon;
select is((select id::text from published_content), (select v from ctx where k = 'id3'), 'la version restaurée devient la version publiée');
select is((select payload from published_content), (select j from ctx where k = 'd'), 'et son payload est celui de la première');
reset role;

-- ---------------------------------------------------------------------------
-- Utilisateur authentifié non administrateur
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'role', 'authenticated')::text, true);

select throws_ok('select draft_content()', '42501', 'forbidden', 'un non-admin ne peut pas appeler draft_content');
select throws_ok($$select publish_content('x')$$, '42501', 'forbidden', 'un non-admin ne peut pas appeler publish_content');
select throws_ok(
  format('select restore_snapshot(%L)', (select v from ctx where k = 'id1')),
  '42501', 'forbidden', 'un non-admin ne peut pas appeler restore_snapshot'
);
select is((select count(*)::int from content_snapshots), 0, 'un non-admin ne lit pas l''historique');
select is((select count(*)::int from published_content), 1, 'un non-admin lit la version publiée (publique)');
reset role;

select is((select count(*)::int from content_snapshots), 3, 'aucune ligne ajoutée par un non-admin');

-- ---------------------------------------------------------------------------
-- content_snapshots est append-only, même pour un administrateur
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text, true);

select throws_ok($$insert into content_snapshots (payload) values ('{}'::jsonb)$$,
  '42501', null, 'un admin ne peut pas insérer directement dans content_snapshots');
select throws_ok($$update content_snapshots set label = 'x'$$,
  '42501', 'content_snapshots est en ajout seul (append-only)', 'un admin ne peut pas modifier content_snapshots');
select throws_ok($$delete from content_snapshots$$,
  '42501', 'content_snapshots est en ajout seul (append-only)', 'un admin ne peut pas supprimer dans content_snapshots');
select throws_ok($$delete from content_snapshots where id = '00000000-0000-0000-0000-000000000000'$$,
  '42501', 'content_snapshots est en ajout seul (append-only)', 'même une suppression sans ligne concernée est refusée');
select throws_ok($$truncate content_snapshots$$,
  '42501', 'content_snapshots est en ajout seul (append-only)', 'un admin ne peut pas vider content_snapshots');
select is((select count(*)::int from content_snapshots), 3, 'toujours 3 instantanés');
reset role;

-- Le propriétaire de la table n'échappe pas non plus au déclencheur.
select throws_ok($$update content_snapshots set label = 'x'$$,
  '42501', 'content_snapshots est en ajout seul (append-only)', 'le propriétaire ne peut pas modifier content_snapshots');
select throws_ok($$delete from content_snapshots$$,
  '42501', 'content_snapshots est en ajout seul (append-only)', 'le propriétaire ne peut pas supprimer dans content_snapshots');
select throws_ok($$truncate content_snapshots$$,
  '42501', 'content_snapshots est en ajout seul (append-only)', 'le propriétaire ne peut pas vider content_snapshots');
select is((select label from content_snapshots where id = (select v::uuid from ctx where k = 'id1')), 't', 'étiquette inchangée');

-- ---------------------------------------------------------------------------
-- Réglages absents : la publication échoue clairement
-- ---------------------------------------------------------------------------
delete from settings;

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text, true);

select is(jsonb_typeof(draft_content()->'settings'), 'null', 'draft_content().settings vaut null sans réglages');
select throws_ok($$select publish_content('x')$$, 'P0001', 'settings missing', 'publish_content refuse sans réglages');
reset role;

select is((select count(*)::int from content_snapshots), 3, 'aucun instantané créé quand les réglages manquent');

select * from finish();
rollback;
