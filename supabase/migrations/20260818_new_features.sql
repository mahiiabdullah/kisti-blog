-- ================================================================
-- KiSti Blog — Incremental Migration
-- Date: 2026-08-18
-- Run this in: Supabase Dashboard → SQL Editor
-- ADDITIONS ONLY. Safe to run on existing live database.
-- ================================================================


-- ================================================================
-- 1. posts: Add translation_type column
--    Stores the adaptation label instead of a plain boolean.
--    Values: অনুবাদ | ভাষান্তর | রূপান্তর | সংক্ষিপ্ত পাঠ | অভিযোজন | পুনর্লিখন | NULL (original)
-- ================================================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS translation_type text DEFAULT NULL;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS has_drop_cap boolean DEFAULT true;

-- Backfill: existing is_translation=true rows get type 'অনুবাদ'
UPDATE public.posts
  SET translation_type = 'অনুবাদ'
  WHERE is_translation = true
    AND translation_type IS NULL;


-- ================================================================
-- 2. categories: Insert new main category "সম্পাদকীয় কলাম"
--    Position 8 (after the existing 7 categories)
--    Safe: skips if slug already exists
-- ================================================================

INSERT INTO public.categories (name_bn, name_en, slug, is_main, is_active, position)
SELECT
  'সম্পাদকীয় কলাম',
  'Editorial Column',
  'sampadakiya-kolam',
  true,
  true,
  8
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE slug = 'sampadakiya-kolam'
);


-- ================================================================
-- 3. storage: Allow authenticated users to upload their own avatar
--    Current policy only allows admins to upload to media bucket.
--    Adding separate policy for avatars/ prefix used by profile page.
-- ================================================================

DROP POLICY IF EXISTS "users upload own avatar" ON storage.objects;
CREATE POLICY "users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'avatars'
  );

DROP POLICY IF EXISTS "users update own avatar" ON storage.objects;
CREATE POLICY "users update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'avatars'
  );

DROP POLICY IF EXISTS "public read avatars" ON storage.objects;
CREATE POLICY "public read avatars"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'avatars'
  );


-- ================================================================
-- Done!
-- Changes:
--   posts.translation_type  TEXT     adaptation type label
--   posts.has_drop_cap      BOOLEAN  drop cap toggle option
--   categories              INSERT   সম্পাদকীয় কলাম  (position 8)
--   storage policies        CREATED  avatar upload/read for users
-- ================================================================
