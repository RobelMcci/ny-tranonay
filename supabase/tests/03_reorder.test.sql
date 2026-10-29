-- Réordonnancement atomique des éléments de liste.
begin;

select plan(7);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@test.local'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'client@test.local');
insert into admins (user_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
insert into list_items (id, list_key, label, position) overriding system value values
  (9001, 'extras', 'A', 0), (9002, 'extras', 'B', 1), (9003, 'extras', 'C', 2);

select has_function('public', 'reorder_list_items', array['bigint[]'], 'reorder_list_items existe');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}', true);

select lives_ok($$select reorder_list_items(array[9003, 9001, 9002]::bigint[])$$, 'l’administrateur réordonne');
select is(
  (select string_agg(label, ',' order by position) from list_items where id in (9001, 9002, 9003)),
  'C,A,B', 'les positions suivent l’ordre donné'
);
select throws_ok(
  $$select reorder_list_items(array[9002, 424242, 9001]::bigint[])$$, 'P0002', null, 'un identifiant inconnu fait échouer'
);
select is(
  (select string_agg(label, ',' order by position) from list_items where id in (9001, 9002, 9003)),
  'C,A,B', 'rien n’est modifié après un échec'
);

select set_config('request.jwt.claims', '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}', true);
select throws_ok(
  $$select reorder_list_items(array[9001, 9002, 9003]::bigint[])$$, 'P0002', null, 'un non-administrateur ne modifie rien (RLS)'
);

set local role anon;
select throws_ok(
  $$select reorder_list_items(array[9001, 9002, 9003]::bigint[])$$, '42501', null, 'le rôle anonyme n’a pas le droit d’exécuter la fonction'
);

select * from finish();
rollback;
