-- Ordre des pages (menu, pied de page, plan du site) : `pages_seo.position`, fixée par l'import du seed et jamais
-- modifiée depuis le tableau de bord. La priorité du plan du site ne change plus l'ordre du menu.
begin;

select plan(14);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@test.local'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'client@test.local');
insert into admins (user_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Indépendant de l'état de la base locale (tout est annulé à la fin).
delete from pages_seo;

select has_column('public', 'pages_seo', 'position', 'pages_seo.position existe');
select col_type_is('public', 'pages_seo', 'position', 'integer', 'pages_seo.position est un entier');
select col_not_null('public', 'pages_seo', 'position', 'pages_seo.position est obligatoire');
select col_default_is('public', 'pages_seo', 'position', '0', 'pages_seo.position vaut 0 par défaut');

-- Priorités volontairement dans l'ordre inverse des positions.
insert into pages_seo (path, title, description, priority, nav_label, position) values
  ('/z-premiere',  'Z',  'z',  0.1, 'Z',  0),
  ('/b-deuxieme',  'B',  'b',  0.5, 'B',  1),
  ('/a-troisieme', 'A',  'a',  1.0, null, 2),
  ('/c-egalite',   'C',  'c',  0.9, 'C',  3),
  ('/b-egalite',   'B2', 'b2', 0.2, 'B2', 3);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}', true);

select is(
  (select array(select e->>'path' from jsonb_array_elements(draft_content()->'pages') e)),
  array['/z-premiere', '/b-deuxieme', '/a-troisieme', '/b-egalite', '/c-egalite'],
  'draft_content() : pages triées par position puis chemin, pas par priorité'
);
select is(
  (select array(select k from jsonb_object_keys(draft_content()#>'{pages,0}') k order by k collate "C")),
  array['description', 'navLabel', 'path', 'priority', 'title'],
  'la position ne fait pas partie du contenu publié (contrat inchangé)'
);

-- Un administrateur qui change une priorité (écran Référencement) ne réordonne pas le menu.
update pages_seo set priority = 1.0 where path = '/c-egalite';
update pages_seo set priority = 0.0 where path = '/z-premiere';
select is(
  (select array(select e->>'path' from jsonb_array_elements(draft_content()->'pages') e)),
  array['/z-premiere', '/b-deuxieme', '/a-troisieme', '/b-egalite', '/c-egalite'],
  'changer une priorité ne change pas l’ordre des pages'
);
select is(
  (select position from pages_seo where path = '/c-egalite'),
  3,
  'la mise à jour d’une page ne touche pas à sa position'
);

reset role;

-- draft_content() garde ses propriétés de sécurité après `create or replace`.
select is(
  (select prosecdef from pg_proc where pronamespace = 'public'::regnamespace and proname = 'draft_content'),
  true,
  'draft_content() reste security definer'
);
select is(
  (select provolatile::text from pg_proc where pronamespace = 'public'::regnamespace and proname = 'draft_content'),
  's',
  'draft_content() reste stable'
);
select is(
  (select proconfig from pg_proc where pronamespace = 'public'::regnamespace and proname = 'draft_content'),
  array['search_path=public'],
  'draft_content() garde search_path = public'
);
select ok(not has_function_privilege('anon', 'public.draft_content()', 'execute'), 'anon ne peut toujours pas exécuter draft_content()');
select ok(has_function_privilege('authenticated', 'public.draft_content()', 'execute'), 'authenticated peut exécuter draft_content()');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}', true);
select throws_ok($$select draft_content()$$, '42501', 'forbidden', 'un non-administrateur est toujours refusé');
reset role;

select * from finish();
rollback;
