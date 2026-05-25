-- ================================================================
-- কিশতী — Run this ENTIRE file in Supabase SQL Editor
-- Click "RUN" (not Explain)
-- ================================================================

-- 1. Add is_featured to posts (safe if already exists)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_posts_is_featured
  ON public.posts (is_featured, published_at DESC)
  WHERE status = 'published';

-- 2. Add parent_id to comments for nested replies
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id   ON public.comments (post_id, created_at);

-- 3. site_pages table for dynamic content (About page etc.)
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

DROP POLICY IF EXISTS "Public can read site_pages"    ON public.site_pages;
DROP POLICY IF EXISTS "Admins can manage site_pages"  ON public.site_pages;

CREATE POLICY "Public can read site_pages"
  ON public.site_pages FOR SELECT USING (true);

CREATE POLICY "Admins can manage site_pages"
  ON public.site_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 4. Reset categories to the 7 correct ones
DELETE FROM public.post_categories;
DELETE FROM public.categories;

INSERT INTO public.categories (name_bn, name_en, is_main, position, slug) VALUES
  ('ইতিহাস',        'History',              true, 1, 'itihas'),
  ('আইন',           'Law',                  true, 2, 'ain'),
  ('রাষ্ট্র',        'State',                true, 3, 'rastro'),
  ('সমকালীন ভাবনা', 'Contemporary Thought', true, 4, 'somokalin-vabna'),
  ('চিন্তাবিন্দু',  'Thought Points',       true, 5, 'chintabindu'),
  ('গ্রন্থালোচনা',  'Book Reviews',         true, 6, 'gronthalochona'),
  ('লেখকবৃন্দ',     'Writers',              true, 7, 'lekhokbrindo');

-- 5. Remap existing posts to nearest new category
UPDATE public.posts SET category_bn = 'ইতিহাস',        category_en = 'History'
  WHERE category_bn ILIKE '%ইতিহাস%' OR category_bn ILIKE '%সভ্যতা%';

UPDATE public.posts SET category_bn = 'আইন',           category_en = 'Law'
  WHERE category_bn ILIKE '%আইন%' OR category_bn ILIKE '%শরিয়া%' OR category_bn ILIKE '%ফিকহ%';

UPDATE public.posts SET category_bn = 'রাষ্ট্র',        category_en = 'State'
  WHERE category_bn ILIKE '%রাষ্ট্র%' OR category_bn ILIKE '%রাজনৈতিক%' OR category_bn ILIKE '%বাংলাদেশ%';

UPDATE public.posts SET category_bn = 'সমকালীন ভাবনা', category_en = 'Contemporary Thought'
  WHERE category_bn ILIKE '%সমকালীন%' OR category_bn ILIKE '%তত্ত্ব%' OR category_bn ILIKE '%দর্শন%'
     OR category_bn ILIKE '%ইসলাম%'   OR category_bn ILIKE '%আধুনিক%';

UPDATE public.posts SET category_bn = 'গ্রন্থালোচনা',  category_en = 'Book Reviews'
  WHERE category_bn ILIKE '%গ্রন্থ%' OR category_bn ILIKE '%বই%' OR category_bn ILIKE '%book%';

-- Fallback: anything else → চিন্তাবিন্দু
UPDATE public.posts SET category_bn = 'চিন্তাবিন্দু',  category_en = 'Thought Points'
  WHERE category_bn IS NULL
     OR category_bn NOT IN (
       'ইতিহাস','আইন','রাষ্ট্র','সমকালীন ভাবনা',
       'চিন্তাবিন্দু','গ্রন্থালোচনা','লেখকবৃন্দ'
     );

-- 6. Rebuild post_categories junction
INSERT INTO public.post_categories (post_id, category_id)
  SELECT p.id, c.id
  FROM   public.posts p
  JOIN   public.categories c ON c.name_bn = p.category_bn
  ON CONFLICT DO NOTHING;
