-- Ordre des questions de la FAQ en une seule instruction (atomique).
-- `faqs.id` est « generated always » : un upsert PostgREST avec identifiant explicite est refusé,
-- d'où cette fonction (même principe que `reorder_list_items`). Elle s'exécute avec les droits de l'appelant
-- (RLS appliquée : administrateurs seulement). Si un identifiant est inconnu, en double ou invisible
-- pour l'appelant, rien n'est modifié.

create function reorder_faqs(ids bigint[]) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  updated integer;
begin
  update faqs f
     set position = o.ord - 1
    from unnest(ids) with ordinality as o(id, ord)
   where f.id = o.id;
  get diagnostics updated = row_count;
  if updated <> coalesce(cardinality(ids), 0) then
    raise exception 'reorder_faqs : question introuvable ou en double' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function reorder_faqs(bigint[]) from public, anon;
grant execute on function reorder_faqs(bigint[]) to authenticated;
