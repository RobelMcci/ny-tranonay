-- Schéma du contenu éditable (tableau de bord Tranonay).
-- Les colonnes de `settings` suivent une à une les clés de Content.settings (snake_case).

create table admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table settings (
  id integer primary key check (id = 1),
  name text not null,
  tagline text not null,
  phone text not null,
  whatsapp_number text not null,
  email text not null,
  facebook_url text not null,
  messenger_url text not null,
  facebook_followers integer not null check (facebook_followers >= 0),
  street text not null,
  city text not null,
  postal_code text not null,
  country text not null,
  country_code text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  open_hour integer not null check (open_hour between 0 and 24),
  close_hour integer not null check (close_hour between 0 and 24),
  hours_label text not null,
  room_check_in text not null,
  room_check_out text not null,
  security_summary text not null,
  security_partner_name text not null,
  security_partner_url text not null
);

create table prices (
  key text primary key,
  label text not null,
  amount integer not null check (amount >= 0),
  unit text not null check (unit in ('ar', 'personnes'))
);

create table rooms (
  id text primary key,
  name text not null,
  price_ar integer not null check (price_ar >= 0),
  features text[] not null default '{}',
  photo_keys text[] not null default '{}',
  quantity integer not null default 1 check (quantity >= 1),
  position integer not null default 0,
  visible boolean not null default true
);

create table list_items (
  id bigint generated always as identity primary key,
  list_key text not null,
  label text not null,
  position integer not null default 0,
  visible boolean not null default true
);

create table faqs (
  id bigint generated always as identity primary key,
  question text not null,
  answer text not null,
  position integer not null default 0,
  visible boolean not null default true
);

create table pages_seo (
  path text primary key,
  title text not null,
  description text not null,
  priority numeric(2, 1) not null check (priority between 0 and 1),
  nav_label text
);

create table photos (
  key text primary key,
  file text,
  storage_path text,
  alt text not null check (length(trim(alt)) > 0),
  category text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  gallery_position integer,
  visible boolean not null default true,
  constraint photos_source_present check (file is not null or storage_path is not null)
);

create table photo_slots (
  slot_key text primary key,
  photo_key text not null references photos (key) on delete restrict
);

create table texts (
  key text primary key,
  value text not null
);

create table content_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  label text,
  payload jsonb not null
);

create index content_snapshots_created_at_idx on content_snapshots (created_at desc);
create index photo_slots_photo_key_idx on photo_slots (photo_key);
