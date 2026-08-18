-- ================================================================
-- KiSti Blog — DATA WIPE & RESET SCRIPT (Clean Client Handover)
-- Run this in: Supabase Dashboard → SQL Editor
-- WARNING: This will delete all mock posts, writers, comments,
-- analytics, and uploaded storage media files!
-- (User accounts, Admin roles, and Categories will be preserved)
-- ================================================================

-- 1. Delete all posts and cascade data (translations, tags, views, comments, stats)
TRUNCATE TABLE public.comments CASCADE;
TRUNCATE TABLE public.post_stats CASCADE;
TRUNCATE TABLE public.post_views CASCADE;
TRUNCATE TABLE public.post_tags CASCADE;
TRUNCATE TABLE public.post_images CASCADE;
TRUNCATE TABLE public.post_categories CASCADE;
TRUNCATE TABLE public.post_translations CASCADE;
TRUNCATE TABLE public.posts CASCADE;

-- 2. Delete all writers
TRUNCATE TABLE public.writers CASCADE;

-- 3. Delete all uploaded images/files from storage bucket ('media')
DELETE FROM storage.objects WHERE bucket_id = 'media';

-- 4. Ensure all 8 categories exist cleanly
INSERT INTO public.categories (name_bn, name_en, slug, is_main, is_active, position) VALUES
  ('ইতিহাস',        'History',              'itihas',           true, true, 1),
  ('আইন',           'Law',                  'ain',              true, true, 2),
  ('রাষ্ট্র',        'State',                'rastro',           true, true, 3),
  ('সমকালীন ভাবনা', 'Contemporary Thought', 'somokalin-vabna',  true, true, 4),
  ('চিন্তাবিন্দু',  'Thought Points',       'chintabindu',      true, true, 5),
  ('গ্রন্থালোচনা',  'Book Reviews',         'gronthalochona',   true, true, 6),
  ('লেখকবৃন্দ',     'Writers',              'lekhokbrindo',     true, true, 7),
  ('সম্পাদকীয় কলাম', 'Editorial Column',    'sampadakiya-kolam', true, true, 8)
ON CONFLICT (slug) DO UPDATE SET
  name_bn = EXCLUDED.name_bn,
  name_en = EXCLUDED.name_en,
  is_main = EXCLUDED.is_main,
  is_active = EXCLUDED.is_active,
  position = EXCLUDED.position;

-- ================================================================
-- Done! Database and Storage media are completely clean and ready.
-- ================================================================
