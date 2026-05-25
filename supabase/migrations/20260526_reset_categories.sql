-- ================================================================
-- কিশতী — Category Reset Migration
-- Run this in Supabase SQL Editor
-- Clears old categories, inserts the 7 correct ones,
-- and remaps existing posts to the closest new category.
-- ================================================================

BEGIN;

-- Step 1: Detach all posts from old categories (post_categories junction)
DELETE FROM public.post_categories;

-- Step 2: Remove all existing categories (subcategories first via CASCADE)
DELETE FROM public.categories;

-- Step 3: Insert the 7 correct top-level categories
INSERT INTO public.categories (name_bn, name_en, is_main, position, slug) VALUES
  ('ইতিহাস',          'History',              true, 1, 'itihas'),
  ('আইন',             'Law',                  true, 2, 'ain'),
  ('রাষ্ট্র',          'State',                true, 3, 'rastro'),
  ('সমকালীন ভাবনা',   'Contemporary Thought', true, 4, 'somokalin-vabna'),
  ('চিন্তাবিন্দু',    'Thought Points',       true, 5, 'chintabindu'),
  ('গ্রন্থালোচনা',    'Book Reviews',         true, 6, 'gronthalochona'),
  ('লেখকবৃন্দ',       'Writers',              true, 7, 'lekhokbrindo');

-- Step 4: Remap posts — update category_bn/category_en on the posts table
-- based on fuzzy matching of old category names → new ones.

-- Old "ইতিহাস ও সভ্যতা" → "ইতিহাস"
UPDATE public.posts
SET category_bn = 'ইতিহাস', category_en = 'History'
WHERE category_bn ILIKE '%ইতিহাস%' OR category_bn ILIKE '%সভ্যতা%' OR category_bn ILIKE '%history%';

-- Old "শরিয়া", "ফিকহ", "আইন" → "আইন"
UPDATE public.posts
SET category_bn = 'আইন', category_en = 'Law'
WHERE category_bn ILIKE '%আইন%' OR category_bn ILIKE '%শরিয়া%' OR category_bn ILIKE '%ফিকহ%' OR category_bn ILIKE '%law%';

-- Old "রাজনৈতিক", "রাষ্ট্র" → "রাষ্ট্র"
UPDATE public.posts
SET category_bn = 'রাষ্ট্র', category_en = 'State'
WHERE category_bn ILIKE '%রাষ্ট্র%' OR category_bn ILIKE '%রাজনৈতিক%' OR category_bn ILIKE '%বাংলাদেশ%' OR category_bn ILIKE '%state%';

-- Old "তত্ত্ব", "দর্শন", "সমকালীন", "ইসলাম ও আধুনিকতা" → "সমকালীন ভাবনা"
UPDATE public.posts
SET category_bn = 'সমকালীন ভাবনা', category_en = 'Contemporary Thought'
WHERE category_bn ILIKE '%সমকালীন%' OR category_bn ILIKE '%তত্ত্ব%' OR category_bn ILIKE '%দর্শন%'
   OR category_bn ILIKE '%ইসলাম%' OR category_bn ILIKE '%আধুনিক%' OR category_bn ILIKE '%চিন্তা%';

-- Old "গ্রন্থ", "বই" → "গ্রন্থালোচনা"
UPDATE public.posts
SET category_bn = 'গ্রন্থালোচনা', category_en = 'Book Reviews'
WHERE category_bn ILIKE '%গ্রন্থ%' OR category_bn ILIKE '%বই%' OR category_bn ILIKE '%book%';

-- Remaining unmapped posts → "চিন্তাবিন্দু" (fallback)
UPDATE public.posts
SET category_bn = 'চিন্তাবিন্দু', category_en = 'Thought Points'
WHERE category_bn IS NULL
   OR category_bn NOT IN ('ইতিহাস','আইন','রাষ্ট্র','সমকালীন ভাবনা','চিন্তাবিন্দু','গ্রন্থালোচনা','লেখকবৃন্দ');

-- Step 5: Re-seed post_categories junction from posts.category_bn
INSERT INTO public.post_categories (post_id, category_id)
SELECT p.id, c.id
FROM public.posts p
JOIN public.categories c ON c.name_bn = p.category_bn
ON CONFLICT DO NOTHING;

COMMIT;

-- ================================================================
-- Verification
-- ================================================================
SELECT name_bn, slug, position FROM public.categories ORDER BY position;
SELECT category_bn, count(*) as post_count FROM public.posts GROUP BY category_bn ORDER BY category_bn;
