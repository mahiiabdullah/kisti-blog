-- Writers Table
create table public.writers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  bengali_name text not null,
  bio text,
  nationality text,
  birth_year int,
  death_year int,
  profile_image text,
  is_visible boolean default true,
  is_featured boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Modify Posts Table
alter table public.posts 
  add column writer_id uuid references public.writers(id) on delete set null,
  add column translator_id uuid references public.writers(id) on delete set null,
  add column is_translation boolean not null default false;

-- Post Views (Raw Logs)
create table public.post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  session_id text not null,
  viewed_at timestamptz not null default now()
);

-- Post Stats (Aggregated)
create table public.post_stats (
  post_id uuid primary key references public.posts(id) on delete cascade,
  view_count bigint not null default 0,
  unique_visitors bigint not null default 0,
  last_viewed_at timestamptz not null default now()
);

-- Enable RLS
alter table public.writers enable row level security;
alter table public.post_views enable row level security;
alter table public.post_stats enable row level security;

-- Policies for Writers
create policy "writers readable by all" on public.writers for select using (true);
create policy "admins manage writers" on public.writers for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Policies for Analytics
create policy "stats readable by all" on public.post_stats for select using (true);
create policy "admins read views" on public.post_views for select using (public.is_admin(auth.uid()));

-- Trigger for Writers timestamp
create trigger writers_touch before update on public.writers
  for each row execute function public.touch_updated_at();

-- Function to safely increment views
CREATE OR REPLACE FUNCTION public.increment_post_view(p_post_id uuid, p_session_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_last_view timestamptz;
BEGIN
  SELECT viewed_at INTO v_last_view
  FROM public.post_views
  WHERE post_id = p_post_id AND session_id = p_session_id
  ORDER BY viewed_at DESC
  LIMIT 1;

  IF v_last_view IS NULL OR (now() - v_last_view) > interval '1 hour' THEN
    INSERT INTO public.post_views (post_id, session_id)
    VALUES (p_post_id, p_session_id);

    INSERT INTO public.post_stats (post_id, view_count, unique_visitors, last_viewed_at)
    VALUES (p_post_id, 1, 1, now())
    ON CONFLICT (post_id) DO UPDATE SET
      view_count = post_stats.view_count + 1,
      unique_visitors = post_stats.unique_visitors + 1,
      last_viewed_at = now();
  END IF;
END;
$$;

-- Revoke execute from public/anon/authenticated to prevent abuse.
REVOKE EXECUTE ON FUNCTION public.increment_post_view(uuid, text) FROM public, anon, authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS post_views_post_session_idx ON post_views(post_id, session_id);
