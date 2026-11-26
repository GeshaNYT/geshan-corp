-- Geshan Corporation — схема базы данных Supabase.
-- Как применить: Supabase → SQL Editor → New query → вставить весь файл → Run.
-- Скрипт можно запускать повторно: он ничего не удаляет.

-- ───────────── Профили и роли ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Профиль создаётся автоматически при регистрации
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = public.my_role());
drop policy if exists "profiles admin all" on public.profiles;
create policy "profiles admin all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- ───────────── Дерево разделов и проектов ─────────────
create table if not exists public.nodes (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.nodes (id) on delete cascade,
  kind text not null default 'project' check (kind in ('section', 'project')),
  slug text not null unique,
  title text not null,
  tagline text not null default '',
  description text not null default '',
  icon text not null default 'Package',
  cover_url text not null default '',
  status text not null default 'released' check (status in ('released', 'wip', 'frozen', 'soon', 'internal')),
  platforms text[] not null default '{}',
  links jsonb not null default '[]',
  gallery text[] not null default '{}',
  featured boolean not null default false,
  hidden boolean not null default false,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nodes_parent_idx on public.nodes (parent_id, sort);
alter table public.nodes enable row level security;

drop policy if exists "nodes public read" on public.nodes;
create policy "nodes public read" on public.nodes for select using (hidden = false or public.is_admin());
drop policy if exists "nodes admin write" on public.nodes;
create policy "nodes admin write" on public.nodes for all using (public.is_admin()) with check (public.is_admin());

-- ───────────── Файлы проектов ─────────────
create table if not exists public.node_files (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.nodes (id) on delete cascade,
  label text not null default '',
  version text not null default '',
  platform text not null default '',
  url text not null,
  storage_path text,
  size bigint,
  downloads integer not null default 0,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists node_files_node_idx on public.node_files (node_id, sort);
alter table public.node_files enable row level security;

drop policy if exists "files public read" on public.node_files;
create policy "files public read" on public.node_files for select using (true);
drop policy if exists "files admin write" on public.node_files;
create policy "files admin write" on public.node_files for all using (public.is_admin()) with check (public.is_admin());

-- Счётчик скачиваний (может вызывать любой посетитель)
create or replace function public.count_download(file_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.node_files set downloads = downloads + 1 where id = file_id;
$$;
grant execute on function public.count_download(uuid) to anon, authenticated;

-- ───────────── Хранилище файлов ─────────────
insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do nothing;

-- Бакет публичный: файлы скачиваются по прямой ссылке, а просматривать список файлов может только админ
drop policy if exists "resources public read" on storage.objects;
drop policy if exists "resources admin read" on storage.objects;
create policy "resources admin read" on storage.objects for select using (bucket_id = 'resources' and public.is_admin());
drop policy if exists "resources admin write" on storage.objects;
create policy "resources admin write" on storage.objects for insert with check (bucket_id = 'resources' and public.is_admin());
drop policy if exists "resources admin update" on storage.objects;
create policy "resources admin update" on storage.objects for update using (bucket_id = 'resources' and public.is_admin());
drop policy if exists "resources admin delete" on storage.objects;
create policy "resources admin delete" on storage.objects for delete using (bucket_id = 'resources' and public.is_admin());

-- ───────────── Сделать себя админом ─────────────
-- 1) Зарегистрируйся на сайте. 2) Выполни строку ниже, подставив свою почту:
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'ТВОЯ@ПОЧТА');

-- ───────────── Статистика сайта ─────────────
create table if not exists public.visits (
  visitor_id text not null check (char_length(visitor_id) between 8 and 64),
  day date not null default (now() at time zone 'Europe/Moscow')::date,
  primary key (visitor_id, day)
);
alter table public.visits enable row level security;

create table if not exists public.link_clicks (
  node_id uuid not null references public.nodes (id) on delete cascade,
  link_id text not null check (char_length(link_id) <= 64),
  clicks integer not null default 0,
  primary key (node_id, link_id)
);
alter table public.link_clicks enable row level security;
drop policy if exists "link clicks public read" on public.link_clicks;
create policy "link clicks public read" on public.link_clicks for select using (true);

create or replace function public.track_visit(vid text)
returns void language sql security definer set search_path = public as $$
  insert into public.visits (visitor_id) values (left(vid, 64)) on conflict do nothing;
$$;

create or replace function public.count_link(nid uuid, lid text)
returns void language sql security definer set search_path = public as $$
  insert into public.link_clicks (node_id, link_id, clicks)
  select nid, left(lid, 64), 1 where exists (select 1 from public.nodes where id = nid)
  on conflict (node_id, link_id) do update set clicks = public.link_clicks.clicks + 1;
$$;

create or replace function public.site_stats()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'users', (select count(*) from public.profiles),
    'visitors_total', (select count(distinct visitor_id) from public.visits),
    'visitors_today', (select count(*) from public.visits where day = (now() at time zone 'Europe/Moscow')::date),
    'downloads', (select coalesce(sum(downloads), 0) from public.node_files)
                 + (select coalesce(sum(clicks), 0) from public.link_clicks)
  );
$$;

grant execute on function public.track_visit(text) to anon, authenticated;
grant execute on function public.count_link(uuid, text) to anon, authenticated;
grant execute on function public.site_stats() to anon, authenticated;

-- ───────────── Каналы, настройки, профиль ─────────────
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  handle text not null default '',
  url text not null,
  description text not null default '',
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists channels_url_unique on public.channels (lower(rtrim(url, '/')));
alter table public.channels enable row level security;
drop policy if exists "channels public read" on public.channels;
create policy "channels public read" on public.channels for select using (true);
drop policy if exists "channels admin write" on public.channels;
create policy "channels admin write" on public.channels for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default 'null',
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "settings public read" on public.site_settings;
create policy "settings public read" on public.site_settings for select using (true);
drop policy if exists "settings admin write" on public.site_settings;
create policy "settings admin write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles drop constraint if exists profiles_bio_len;
alter table public.profiles add constraint profiles_bio_len check (char_length(bio) <= 300);
alter table public.profiles drop constraint if exists profiles_username_len;
alter table public.profiles add constraint profiles_username_len check (username is null or char_length(username) between 2 and 32);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;
drop policy if exists "avatars own insert" on storage.objects;
create policy "avatars own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars own update" on storage.objects;
create policy "avatars own update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars own delete" on storage.objects;
create policy "avatars own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars own read" on storage.objects;
create policy "avatars own read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
alter table public.channels add column if not exists featured boolean not null default true;
alter table public.nodes add column if not exists badge text not null default '';

-- ───────────── История версий ─────────────
create table if not exists public.node_versions (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.nodes (id) on delete cascade,
  version text not null check (char_length(version) between 1 and 40),
  released_at date,
  url text not null default '',
  notes text not null default '' check (char_length(notes) <= 2000),
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists node_versions_node_idx on public.node_versions (node_id, sort);
alter table public.node_versions enable row level security;
drop policy if exists "versions public read" on public.node_versions;
create policy "versions public read" on public.node_versions for select using (true);
drop policy if exists "versions admin write" on public.node_versions;
create policy "versions admin write" on public.node_versions for all using (public.is_admin()) with check (public.is_admin());
alter table public.node_versions add column if not exists released_ts timestamptz;
alter table public.node_versions add column if not exists download_url text not null default '';
