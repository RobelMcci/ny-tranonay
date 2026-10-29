-- RLS, contraintes et bucket du schéma de contenu.
-- Les rôles sont simulés avec `set local role` + `request.jwt.claims` pour que auth.uid() fonctionne.
begin;

select plan(61);

-- ---------------------------------------------------------------------------
-- Données de départ (rôle postgres) : un administrateur, un client, du contenu
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

insert into prices (key, label, amount, unit) values ('reception_jour', 'Réception', 150000, 'ar');
insert into faqs (question, answer, position) values ('Q ?', 'R.', 0);

insert into photos (key, file, alt, category, width, height) values
  ('p_slot',  'image1', 'Photo utilisée par un emplacement', 'Espace', 100, 100),
  ('p_room',  'image2', 'Photo utilisée par une chambre',    'Espace', 100, 100),
  ('p_free',  'image3', 'Photo libre',                       'Espace', 100, 100);

insert into photo_slots (slot_key, photo_key) values ('home.hero', 'p_slot');
insert into rooms (id, name, price_ar, photo_keys) values ('chambre-test', 'Chambre test', 45000, array['p_room']);
insert into content_snapshots (label, payload) values ('seed', '{}'::jsonb);

-- ---------------------------------------------------------------------------
-- Structure
-- ---------------------------------------------------------------------------
select has_function('public', 'is_admin', 'is_admin() existe');
select is(
  (select prosecdef from pg_proc where proname = 'is_admin' and pronamespace = 'public'::regnamespace),
  true, 'is_admin() est security definer'
);
select is(
  (select provolatile::text from pg_proc where proname = 'is_admin' and pronamespace = 'public'::regnamespace),
  's', 'is_admin() est stable'
);
select is(
  (select count(*)::int from pg_tables t
    where t.schemaname = 'public' and not t.rowsecurity
      and t.tablename in ('admins','settings','prices','rooms','list_items','faqs','pages_seo',
                          'photos','photo_slots','texts','content_snapshots')),
  0, 'la RLS est activée sur toutes les tables'
);
select is(
  (select count(*)::int from pg_policies where schemaname = 'public'
    and ('anon' = any(roles) or 'public' = any(roles))),
  0, 'aucune politique pour anon (ni public)'
);
select is(
  (select public from storage.buckets where id = 'photos'), true, 'le bucket photos existe et est public en lecture'
);

-- ---------------------------------------------------------------------------
-- anon : ni lecture ni écriture
-- ---------------------------------------------------------------------------
set local role anon;

select throws_ok('select * from prices',            '42501', null, 'anon ne peut pas lire prices');
select throws_ok('select * from settings',          '42501', null, 'anon ne peut pas lire settings');
select throws_ok('select * from faqs',              '42501', null, 'anon ne peut pas lire faqs');
select throws_ok('select * from photos',            '42501', null, 'anon ne peut pas lire photos');
select throws_ok('select * from content_snapshots', '42501', null, 'anon ne peut pas lire content_snapshots');

select throws_ok($$insert into prices (key, label, amount, unit) values ('x', 'X', 1, 'ar')$$,
  '42501', null, 'anon ne peut pas écrire dans prices');
select throws_ok($$insert into settings (id) values (2)$$,
  '42501', null, 'anon ne peut pas écrire dans settings');
select throws_ok($$insert into faqs (question, answer) values ('q', 'a')$$,
  '42501', null, 'anon ne peut pas écrire dans faqs');
select throws_ok($$insert into photos (key, file, alt, category, width, height) values ('x', 'f', 'alt', 'c', 1, 1)$$,
  '42501', null, 'anon ne peut pas écrire dans photos');
select throws_ok($$insert into content_snapshots (payload) values ('{}'::jsonb)$$,
  '42501', null, 'anon ne peut pas écrire dans content_snapshots');

select throws_ok($$insert into storage.objects (bucket_id, name) values ('photos', 'cms/anon.jpg')$$,
  '42501', null, 'anon ne peut pas téléverser dans le bucket photos');

reset role;

-- ---------------------------------------------------------------------------
-- Utilisateur authentifié NON administrateur (futur compte client)
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'role', 'authenticated')::text, true);

select is(is_admin(), false, 'un client authentifié n''est pas administrateur');

select is((select count(*)::int from content_snapshots), 0, 'un non-admin ne lit pas content_snapshots');
select is((select count(*)::int from prices),   0, 'un non-admin ne lit pas le brouillon des tarifs');
select is((select count(*)::int from settings), 0, 'un non-admin ne lit pas le brouillon des réglages');
select is((select count(*)::int from photos),   0, 'un non-admin ne lit pas le brouillon des photos');
select is((select count(*)::int from admins),   0, 'un non-admin ne lit pas la liste des administrateurs');

select throws_ok($$insert into prices (key, label, amount, unit) values ('x', 'X', 1, 'ar')$$,
  '42501', null, 'un non-admin ne peut pas écrire dans prices');
select throws_ok($$insert into settings (id) values (2)$$,
  '42501', null, 'un non-admin ne peut pas écrire dans settings');
select throws_ok($$insert into rooms (id, name, price_ar) values ('x', 'X', 1)$$,
  '42501', null, 'un non-admin ne peut pas écrire dans rooms');
select throws_ok($$insert into list_items (list_key, label) values ('extras', 'X')$$,
  '42501', null, 'un non-admin ne peut pas écrire dans list_items');
select throws_ok($$insert into faqs (question, answer) values ('q', 'a')$$,
  '42501', null, 'un non-admin ne peut pas écrire dans faqs');
select throws_ok($$insert into pages_seo (path, title, description, priority) values ('/x', 't', 'd', 0.5)$$,
  '42501', null, 'un non-admin ne peut pas écrire dans pages_seo');
select throws_ok($$insert into photos (key, file, alt, category, width, height) values ('x', 'f', 'alt', 'c', 1, 1)$$,
  '42501', null, 'un non-admin ne peut pas écrire dans photos');
select throws_ok($$insert into photo_slots (slot_key, photo_key) values ('s', 'p_free')$$,
  '42501', null, 'un non-admin ne peut pas écrire dans photo_slots');
select throws_ok($$insert into texts (key, value) values ('k', 'v')$$,
  '42501', null, 'un non-admin ne peut pas écrire dans texts');
select throws_ok($$insert into content_snapshots (payload) values ('{}'::jsonb)$$,
  '42501', null, 'un non-admin ne peut pas écrire dans content_snapshots');
select throws_ok($$insert into admins (user_id) values ('cccccccc-cccc-cccc-cccc-cccccccccccc')$$,
  '42501', null, 'un non-admin ne peut pas s''ajouter aux administrateurs');

select is_empty($$update prices set amount = 1 returning 1$$, 'un non-admin ne peut pas modifier prices');
select is_empty($$delete from prices returning 1$$, 'un non-admin ne peut pas supprimer dans prices');
select is_empty($$delete from photos returning 1$$, 'un non-admin ne peut pas supprimer dans photos');

select throws_ok($$insert into storage.objects (bucket_id, name, owner) values ('photos', 'cms/client.jpg', 'cccccccc-cccc-cccc-cccc-cccccccccccc')$$,
  '42501', null, 'un non-admin ne peut pas téléverser dans le bucket photos');

reset role;

select is((select amount from prices where key = 'reception_jour'), 150000, 'le tarif est inchangé après les tentatives du non-admin');
select is((select count(*)::int from photos), 3, 'les photos sont intactes après les tentatives du non-admin');

-- ---------------------------------------------------------------------------
-- Administrateur
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated')::text, true);

select is(is_admin(), true, 'un administrateur est reconnu par is_admin()');

select lives_ok($$insert into prices (key, label, amount, unit) values ('plat_du_jour', 'Plat du jour', 10000, 'ar')$$,
  'un admin peut insérer dans prices');
select lives_ok($$update prices set amount = 175000 where key = 'reception_jour'$$,
  'un admin peut modifier prices');
select is((select amount from prices where key = 'reception_jour'), 175000, 'la modification du tarif est visible par l''admin');
select lives_ok($$delete from prices where key = 'plat_du_jour'$$,
  'un admin peut supprimer dans prices');
select is((select count(*)::int from prices), 1, 'la suppression du tarif est effective');

select isnt_empty('select * from content_snapshots', 'un admin lit content_snapshots');
select isnt_empty('select * from settings', 'un admin lit settings');

-- contraintes de données
select throws_ok($$insert into prices (key, label, amount, unit) values ('neg', 'N', -1, 'ar')$$,
  '23514', null, 'un montant négatif est refusé');
select throws_ok($$insert into prices (key, label, amount, unit) values ('dec', 'D', '10.5', 'ar')$$,
  '22P02', null, 'un montant décimal est refusé');
select throws_ok($$insert into prices (key, label, amount, unit) values ('unit', 'U', 1, 'euros')$$,
  '23514', null, 'une unité inconnue est refusée');
select throws_ok($$insert into photos (key, file, alt, category, width, height) values ('x', 'f', '   ', 'c', 1, 1)$$,
  '23514', null, 'un texte alternatif vide est refusé');
select throws_ok($$insert into photos (key, alt, category, width, height) values ('x', 'alt', 'c', 1, 1)$$,
  '23514', null, 'une photo sans file ni storage_path est refusée');
select throws_ok($$insert into rooms (id, name, price_ar, quantity) values ('q0', 'Q', 1, 0)$$,
  '23514', null, 'une quantité de chambres nulle est refusée');
select throws_ok($$insert into settings (
    id, name, tagline, phone, whatsapp_number, email, facebook_url, messenger_url, facebook_followers,
    street, city, postal_code, country, country_code, latitude, longitude,
    open_hour, close_hour, hours_label, room_check_in, room_check_out,
    security_summary, security_partner_name, security_partner_url
  ) values (
    2, 'T', 'T', 'T', 'T', 'T', 'T', 'T', 1, 'T', 'T', 'T', 'T', 'T', 0, 0, 8, 21, 'T', 'T', 'T', 'T', 'T', 'T'
  )$$,
  '23514', null, 'la table settings n''accepte qu''une ligne (id = 1)');

-- suppression de photos
select throws_ok($$delete from photos where key = 'p_slot'$$,
  '23503', null, 'une photo référencée par photo_slots ne peut pas être supprimée');
select throws_ok($$delete from photos where key = 'p_room'$$,
  '23503', null, 'une photo listée dans rooms.photo_keys ne peut pas être supprimée');
select lives_ok($$delete from photos where key = 'p_free'$$,
  'une photo non référencée peut être supprimée');

-- photo d'une chambre libérée : la suppression redevient possible
select lives_ok($$update rooms set photo_keys = '{}' where id = 'chambre-test'$$, 'un admin modifie photo_keys');
select lives_ok($$delete from photos where key = 'p_room'$$,
  'la photo n''est plus bloquée une fois retirée de la chambre');

-- bucket
select lives_ok($$insert into storage.objects (bucket_id, name, owner) values ('photos', 'cms/admin.jpg', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$$,
  'un admin peut téléverser dans le bucket photos');

reset role;

select * from finish();
rollback;
