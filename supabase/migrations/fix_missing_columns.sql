-- ====================================================================================
-- KISTI — Fix missing columns after full DB reset
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe: uses IF NOT EXISTS / IF EXISTS so it can be run multiple times
-- ====================================================================================

-- 1. posts.is_featured — used on homepage to pin featured articles
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_posts_is_featured
  ON public.posts (is_featured, published_at DESC)
  WHERE status = 'published';

-- 2. posts.translation_type — label for translated posts (অনুবাদ, ভাষান্তর, etc.)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS translation_type text DEFAULT NULL;

-- 3. posts.has_drop_cap — toggle decorative drop cap on article body
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS has_drop_cap boolean DEFAULT true;

-- 4. writers.is_featured — used on writers page to highlight featured writers
ALTER TABLE public.writers
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- 5. comments.parent_id — nested replies support
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id   ON public.comments (post_id, created_at);

-- 6. site_pages table — for dynamic content (About page, etc.)
CREATE TABLE IF NOT EXISTS public.site_pages (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug       text UNIQUE NOT NULL,
  title_bn   text,
  title_en   text,
  body_bn    text,
  body_en    text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site_pages"   ON public.site_pages;
DROP POLICY IF EXISTS "Admins can manage site_pages" ON public.site_pages;

CREATE POLICY "Public can read site_pages"
  ON public.site_pages FOR SELECT USING (true);

CREATE POLICY "Admins can manage site_pages"
  ON public.site_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- ====================================================================================
-- DONE. Run this once after every full reset (all-running-sql.sql).
-- ====================================================================================
