-- ====================================================================================
-- FULL RESET SCRIPT: RUN THIS TO CREATE EVERYTHING FROM SCRATCH
-- WARNING: THIS WILL DROP ALL EXISTING KISTI TABLES AND DATA
-- ====================================================================================

-- 1. CLEANUP (Drop existing objects if they exist to prevent conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_first_user_admin() CASCADE;
DROP FUNCTION IF EXISTS public.touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.rls_auto_enable() CASCADE;

DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.post_tags CASCADE;
DROP TABLE IF EXISTS public.post_images CASCADE;
DROP TABLE IF EXISTS public.post_translations CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.post_status CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- ====================================================================================

-- 2. ROLES & USERS
create type public.app_role as enum ('super_admin', 'admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  display_name_bn text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Security invoker role checks (safe for public schema)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql stable set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('admin','super_admin')
  )
$$;

-- Ensure RLS can use these functions by explicitly granting execute
grant execute on function public.has_role(uuid, public.app_role) to public;
grant execute on function public.is_admin(uuid) to public;

-- ====================================================================================

-- 3. POSTS & CONTENT
create type public.post_status as enum ('draft','published');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  author_id uuid not null references public.profiles(id) on delete cascade,
  cover_url text,
  category_bn text,
  category_en text,
  status post_status not null default 'draft',
  reading_minutes int default 5,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_translations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  lang text not null check (lang in ('bn','en','ar')),
  title text not null,
  excerpt text,
  body text,
  footnotes jsonb default '[]'::jsonb,
  citations jsonb default '[]'::jsonb,
  unique (post_id, lang)
);

create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  url text not null,
  caption text,
  position int default 0,
  created_at timestamptz not null default now()
);

create table public.post_tags (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  tag text not null,
  unique (post_id, tag)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;
alter table public.post_translations enable row level security;
alter table public.post_images enable row level security;
alter table public.post_tags enable row level security;
alter table public.comments enable row level security;

-- ====================================================================================

-- 4. RLS POLICIES

-- profiles
create policy "profiles readable by all" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- user_roles
create policy "anyone read roles" on public.user_roles for select using (true);
create policy "super_admin manage roles" on public.user_roles for all
  using (public.has_role(auth.uid(), 'super_admin'))
  with check (public.has_role(auth.uid(), 'super_admin'));

-- posts
create policy "published posts readable" on public.posts for select using (status = 'published' or public.is_admin(auth.uid()));
create policy "admins insert posts" on public.posts for insert with check (public.is_admin(auth.uid()));
create policy "admins update posts" on public.posts for update using (public.is_admin(auth.uid()));
create policy "admins delete posts" on public.posts for delete using (public.is_admin(auth.uid()));

-- post_translations
create policy "translations readable" on public.post_translations for select using (
  exists (select 1 from public.posts p where p.id = post_id and (p.status = 'published' or public.is_admin(auth.uid())))
);
create policy "admins manage translations" on public.post_translations for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- post_images
create policy "images readable" on public.post_images for select using (
  exists (select 1 from public.posts p where p.id = post_id and (p.status = 'published' or public.is_admin(auth.uid())))
);
create policy "admins manage images" on public.post_images for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- post_tags
create policy "tags readable" on public.post_tags for select using (true);
create policy "admins manage tags" on public.post_tags for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- comments
create policy "approved comments readable" on public.comments for select using (approved = true or public.is_admin(auth.uid()) or user_id = auth.uid());
create policy "logged in users post comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "admins moderate comments" on public.comments for update using (public.is_admin(auth.uid()));
create policy "admins or owner delete comments" on public.comments for delete using (public.is_admin(auth.uid()) or user_id = auth.uid());

-- ====================================================================================

-- 5. TRIGGERS

-- Auto-create profile and role on signup (secured with search_path = '')
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  -- assign default 'user' role; first user becomes super_admin
  if not exists (select 1 from public.user_roles where role = 'super_admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update timestamps (secured with search_path = '')
create or replace function public.touch_updated_at()
returns trigger language plpgsql security definer set search_path = '' 
as $$ begin new.updated_at = now(); return new; end; $$;

revoke execute on function public.touch_updated_at() from public, anon, authenticated;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- ====================================================================================

-- 6. INDEXES FOR PERFORMANCE

CREATE INDEX IF NOT EXISTS posts_status_published_at_idx ON posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS post_translations_post_id_idx ON post_translations(post_id);
CREATE INDEX IF NOT EXISTS post_tags_post_id_idx ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS comments_post_id_approved_idx ON comments(post_id, approved);

-- ====================================================================================

-- 7. STORAGE BUCKETS

-- Ensure media bucket exists
insert into storage.buckets (id, name, public) values ('media','media', true)
on conflict (id) do nothing;

-- Secure bucket policies (prevent full listing from public)
-- First, drop any rogue public read policies
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Media" ON storage.objects;
DROP POLICY IF EXISTS "media public read" ON storage.objects;
DROP POLICY IF EXISTS "media public read individual" ON storage.objects;

-- Recreate proper restricted policies
create policy "admins list media" on storage.objects for select
  using (bucket_id = 'media' and public.is_admin(auth.uid()));

create policy "admins upload media" on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin(auth.uid()));

create policy "admins update media" on storage.objects for update
  using (bucket_id = 'media' and public.is_admin(auth.uid()));

create policy "admins delete media" on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin(auth.uid()));
