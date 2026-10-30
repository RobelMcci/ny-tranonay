-- Ordre des éléments de liste en une seule instruction (atomique).
-- `list_items.id` est « generated always » : un upsert PostgREST avec identifiant explicite est refusé,
-- d'où cette fonction. Elle s'exécute avec les droits de l'appelant (RLS appliquée : administrateurs seulement).
-- Si un identifiant est inconnu, en double ou invisible pour l'appelant, rien n'est modifié.

create function reorder_list_items(ids bigint[]) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  updated integer;
begin
  update list_items li
     set position = o.ord - 1
    from unnest(ids) with ordinality as o(id, ord)
   where li.id = o.id;
  get diagnostics updated = row_count;
  if updated <> coalesce(cardinality(ids), 0) then
    raise exception 'reorder_list_items : élément introuvable ou en double' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function reorder_list_items(bigint[]) from public, anon;
grant execute on function reorder_list_items(bigint[]) to authenticated;
