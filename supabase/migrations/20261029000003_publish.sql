-- Publication du contenu : instantanés append-only, draft_content(), publish_content(),
-- restore_snapshot() et vue publique published_content.

-- ---------------------------------------------------------------------------
-- content_snapshots : lecture seule pour les admins, écriture uniquement par les fonctions ci-dessous
-- ---------------------------------------------------------------------------
drop policy content_snapshots_admin_all on content_snapshots;

create policy content_snapshots_admin_select on content_snapshots
  for select to authenticated
  using (public.is_admin());

-- Append-only : update, delete et truncate sont refusés pour tous les rôles (propriétaire compris).
-- Déclencheurs par instruction : ils s'exécutent même quand la RLS ne laisse voir aucune ligne.
create function content_snapshots_append_only() returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'content_snapshots est en ajout seul (append-only)'
    using errcode = '42501';
end;
$$;

revoke all on function content_snapshots_append_only() from public;

create trigger content_snapshots_no_update
  before update on content_snapshots
  for each statement execute function content_snapshots_append_only();
create trigger content_snapshots_no_delete
  before delete on content_snapshots
  for each statement execute function content_snapshots_append_only();
create trigger content_snapshots_no_truncate
  before truncate on content_snapshots
  for each statement execute function content_snapshots_append_only();

-- ---------------------------------------------------------------------------
-- draft_content() : objet Content construit depuis les tables (éléments visibles, triés)
-- ---------------------------------------------------------------------------
create function draft_content() returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_settings jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'name', s.name,
    'tagline', s.tagline,
    'phone', s.phone,
    'whatsappNumber', s.whatsapp_number,
    'email', s.email,
    'facebookUrl', s.facebook_url,
    'messengerUrl', s.messenger_url,
    'facebookFollowers', s.facebook_followers,
    'street', s.street,
    'city', s.city,
    'postalCode', s.postal_code,
    'country', s.country,
    'countryCode', s.country_code,
    'latitude', s.latitude,
    'longitude', s.longitude,
    'openHour', s.open_hour,
    'closeHour', s.close_hour,
    'hoursLabel', s.hours_label,
    'roomCheckIn', s.room_check_in,
    'roomCheckOut', s.room_check_out,
    'securitySummary', s.security_summary,
    'securityPartnerName', s.security_partner_name,
    'securityPartnerUrl', s.security_partner_url
  )
  into v_settings
  from public.settings s
  where s.id = 1;

  return jsonb_build_object(
    'version', null,
    'settings', v_settings,
    'prices', coalesce((
      select jsonb_agg(
        jsonb_build_object('key', p.key, 'label', p.label, 'amount', p.amount, 'unit', p.unit)
        order by p.key)
      from public.prices p
    ), '[]'::jsonb),
    'rooms', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', r.id, 'name', r.name, 'price', r.price_ar,
          'features', to_jsonb(r.features), 'photoKeys', to_jsonb(r.photo_keys),
          'quantity', r.quantity)
        order by r.position, r.id)
      from public.rooms r
      where r.visible
    ), '[]'::jsonb),
    'lists', jsonb_build_object(
      'inclus_privatisation', '[]'::jsonb,
      'inclus_reception', '[]'::jsonb,
      'extras', '[]'::jsonb,
      'activites', '[]'::jsonb,
      'pack_couple', '[]'::jsonb,
      'types_evenement', '[]'::jsonb
    ) || coalesce((
      select jsonb_object_agg(g.list_key, g.items)
      from (
        select li.list_key, jsonb_agg(li.label order by li.position, li.id) as items
        from public.list_items li
        where li.visible
        group by li.list_key
      ) g
    ), '{}'::jsonb),
    'faqs', coalesce((
      select jsonb_agg(
        jsonb_build_object('question', f.question, 'answer', f.answer)
        order by f.position, f.id)
      from public.faqs f
      where f.visible
    ), '[]'::jsonb),
    'pages', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'path', pg.path, 'title', pg.title, 'description', pg.description,
          'priority', pg.priority, 'navLabel', pg.nav_label)
        order by pg.priority desc, pg.path)
      from public.pages_seo pg
    ), '[]'::jsonb),
    'photos', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'key', ph.key, 'file', ph.file, 'storagePath', ph.storage_path, 'alt', ph.alt,
          'category', ph.category, 'width', ph.width, 'height', ph.height,
          'galleryPosition', ph.gallery_position)
        order by ph.key)
      from public.photos ph
      where ph.visible
    ), '[]'::jsonb),
    'photoSlots', coalesce((
      select jsonb_object_agg(ps.slot_key, ps.photo_key)
      from public.photo_slots ps
    ), '{}'::jsonb),
    'texts', coalesce((
      select jsonb_object_agg(t.key, t.value)
      from public.texts t
    ), '{}'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- publish_content() : nouvel instantané du brouillon courant
-- ---------------------------------------------------------------------------
create function publish_content(p_label text) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_payload := public.draft_content();

  if jsonb_typeof(v_payload -> 'settings') is distinct from 'object' then
    raise exception 'settings missing';
  end if;

  -- clock_timestamp() : created_at strictement croissant même dans une seule transaction.
  insert into public.content_snapshots (created_at, created_by, label, payload)
  values (clock_timestamp(), auth.uid(), p_label, v_payload)
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- restore_snapshot() : nouvelle ligne copiant le payload d'un ancien instantané
-- ---------------------------------------------------------------------------
create function restore_snapshot(p_id uuid) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_created_at timestamptz;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select s.payload, s.created_at
  into v_payload, v_created_at
  from public.content_snapshots s
  where s.id = p_id;

  if not found then
    raise exception 'snapshot % not found', p_id using errcode = 'P0002';
  end if;

  insert into public.content_snapshots (created_at, created_by, label, payload)
  values (
    clock_timestamp(),
    auth.uid(),
    'Retour à la version du ' || to_char(v_created_at at time zone 'Indian/Antananarivo', 'DD/MM/YYYY HH24:MI'),
    v_payload
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function draft_content() from public, anon;
revoke all on function publish_content(text) from public, anon;
revoke all on function restore_snapshot(uuid) from public, anon;
grant execute on function draft_content() to authenticated;
grant execute on function publish_content(text) to authenticated;
grant execute on function restore_snapshot(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- published_content : dernier instantané, lisible par tous (droits du propriétaire de la vue)
-- ---------------------------------------------------------------------------
create view published_content with (security_invoker = false) as
  select id, created_at, payload
  from content_snapshots
  order by created_at desc, id desc
  limit 1;

revoke all on published_content from public, anon, authenticated;
grant select on published_content to anon, authenticated;
