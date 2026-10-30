-- RLS, is_admin(), protection des photos référencées et bucket `photos`.

create function is_admin() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function is_admin() from public;
grant execute on function is_admin() to anon, authenticated;

-- RLS activée partout ; aucune politique pour anon ; tout est réservé à is_admin().
do $$
declare
  t text;
begin
  foreach t in array array[
    'admins', 'settings', 'prices', 'rooms', 'list_items', 'faqs', 'pages_seo',
    'photos', 'photo_slots', 'texts', 'content_snapshots'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_all', t
    );
  end loop;
end
$$;

-- Une photo listée dans rooms.photo_keys ne peut pas être supprimée
-- (les emplacements sont déjà protégés par la FK `on delete restrict`).
create function photos_block_delete_if_in_room() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.rooms where old.key = any (photo_keys)) then
    raise exception 'La photo % est utilisée par une chambre', old.key
      using errcode = '23503';
  end if;
  return old;
end;
$$;

revoke all on function photos_block_delete_if_in_room() from public;

create trigger photos_block_delete_if_in_room
  before delete on photos
  for each row execute function photos_block_delete_if_in_room();

-- Bucket public en lecture (URL publiques) ; écriture réservée aux administrateurs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy photos_bucket_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'photos' and public.is_admin())
  with check (bucket_id = 'photos' and public.is_admin());
