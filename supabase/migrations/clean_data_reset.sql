-- ====================================================================================
-- KISTI — DATA-ONLY CLEAN RESET
-- PURPOSE : Wipe ALL data from every table while keeping the full schema intact.
--           Structure (tables, types, functions, triggers, RLS policies, indexes)
--           is NOT touched.
-- SAFE TO RUN ON : Any Supabase project running the all-running-sql.sql schema.
-- HOW TO RUN : Supabase Dashboard → SQL Editor → paste & run.
-- ====================================================================================

-- PostgreSQL requires all FK-linked tables to be named in ONE TRUNCATE statement.
-- Listing them all together lets Postgres resolve the constraint graph automatically.

TRUNCATE TABLE
  public.post_views,
  public.post_stats,
  public.comments,
  public.post_tags,
  public.post_images,
  public.post_translations,
  public.post_categories,
  public.posts,
  public.writers,
  public.categories,
  public.user_roles,
  public.profiles
RESTART IDENTITY CASCADE;

-- ====================================================================================
-- RE-SEED: All 8 main categories
-- These cannot be added from the admin UI (only subcategories can), so they are
-- always restored here after every reset.
-- ====================================================================================

INSERT INTO public.categories (name_bn, name_en, slug, is_main, is_active, position) VALUES
  ('ইতিহাস',           'History',              'itihas',            true, true, 1),
  ('আইন',              'Law',                  'ain',               true, true, 2),
  ('রাষ্ট্র',           'State',                'rastro',            true, true, 3),
  ('সমকালীন ভাবনা',    'Contemporary Thought', 'somokalin-vabna',   true, true, 4),
  ('চিন্তাবিন্দু',     'Thought Points',       'chintabindu',       true, true, 5),
  ('গ্রন্থালোচনা',     'Book Reviews',         'gronthalochona',    true, true, 6),
  ('লেখকবৃন্দ',        'Writers',              'lekhokbrindo',      true, true, 7),
  ('সম্পাদকীয় কলাম',  'Editorial Column',     'sampadakiya-kolam', true, true, 8)
ON CONFLICT (slug) DO NOTHING;

-- ====================================================================================
-- RE-LINK: Restore profiles + roles for any existing auth.users accounts
-- The handle_new_user() trigger only fires on NEW signups. If auth.users accounts
-- were kept (not deleted), their profiles and roles must be re-created manually.
-- ====================================================================================

INSERT INTO public.profiles (id, display_name)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

INSERT INTO public.user_roles (user_id, role)
SELECT
  u.id,
  CASE
    WHEN u.created_at = (SELECT MIN(created_at) FROM auth.users) THEN 'super_admin'::public.app_role
    ELSE 'user'::public.app_role
  END
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id
);

-- ====================================================================================
-- DONE.
-- Tables wiped  : post_views, post_stats, comments, post_tags, post_images,
--                 post_translations, post_categories, posts, writers, categories,
--                 user_roles, profiles
-- Schema kept   : all tables, types, functions, triggers, RLS policies, indexes
-- Re-seeded     : All 8 main categories (positions 1–8)
-- Re-linked     : Existing auth.users → profiles + roles (oldest user = super_admin)
-- Auth users    : NOT deleted (handle via Supabase Authentication → Users dashboard)
-- ====================================================================================
