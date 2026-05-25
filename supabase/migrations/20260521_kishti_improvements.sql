-- ================================================================
-- কিশতী (KiSti) — Database Migration
-- Run this SQL in your Supabase SQL Editor
-- ================================================================

-- 1. Add is_featured column to posts table
-- This allows admin to mark a post as the featured article on the homepage.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Create index for efficient featured post lookups
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON public.posts (is_featured, published_at DESC)
  WHERE status = 'published';

-- ================================================================

-- 2. Create site_pages table for dynamic content (About page, etc.)
CREATE TABLE IF NOT EXISTS public.site_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title_bn text,
  title_en text,
  body_bn text,
  body_en text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public can read site_pages"
  ON public.site_pages
  FOR SELECT USING (true);

-- Admin can write (requires user_roles table with is_admin logic)
CREATE POLICY "Admins can manage site_pages"
  ON public.site_pages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ================================================================

-- 3. Add parent_id to comments table for nested replies
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments (post_id, created_at);

-- ================================================================
-- NOTES:
-- - is_featured: set via admin post editor (checkbox "প্রধান লেখা হিসেবে প্রদর্শন করুন")
-- - site_pages: the 'about' slug is used by app/about/page.tsx
--   Create the initial record via the Admin > About page editor
-- - parent_id on comments: allows nested replies; the UI handles threading
-- ================================================================
