-- Ordre stable des pages (menu, pied de page, plan du site) : `pages_seo.position`.
-- Avant cette migration, draft_content() triait les pages par priorité décroissante puis chemin : l'ordre du menu public
-- changeait à la première publication (seed ≠ base) et à chaque modification d'une priorité. La position est fixée par
-- l'import du seed (scripts/lib/seed-rows.mjs : indice dans `content.seed.json`) et n'est jamais modifiée par le tableau
-- de bord (l'écran Référencement ne met à jour que titre, description, priorité et libellé du menu).

alter table pages_seo add column position integer not null default 0;

-- Lignes déjà présentes (base importée avant cette migration) : ordre du seed pour les 8 pages connues ; une page
-- inconnue passe après, triée par chemin. Sans effet sur une base vide.
update pages_seo set position = case path
  when '/' then 0
  when '/salle-reception-evenements' then 1
  when '/privatisation-piscine' then 2
  when '/chambres' then 3
  when '/tarifs-devis' then 4
  when '/contact' then 5
  when '/mentions-legales' then 6
  when '/confidentialite' then 7
  else 8
end;

-- ---------------------------------------------------------------------------
-- draft_content() : identique à 20261029000003_publish.sql, sauf le tri des pages (position, puis chemin).
-- `create or replace` conserve le propriétaire et les droits (execute : authenticated seulement).
-- ---------------------------------------------------------------------------
create or replace function draft_content() returns jsonb
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
        order by pg.position, pg.path)
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
