-- ====================================================================================
-- KISTI — RE-LINK EXISTING AUTH USERS AFTER DATA RESET
-- Run this AFTER clean_data_reset.sql if you kept your auth.users accounts.
-- This re-creates the missing profiles + roles for all existing auth users.
-- ====================================================================================

-- Re-create a profile row for every existing auth user that has no profile yet.
INSERT INTO public.profiles (id, display_name)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Assign 'super_admin' to the FIRST (oldest) user, 'user' role to everyone else.
-- If there is only one user, they get super_admin.
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
-- DONE. Verify with:
--   SELECT p.id, p.display_name, r.role FROM public.profiles p
--   JOIN public.user_roles r ON r.user_id = p.id;
-- ====================================================================================
