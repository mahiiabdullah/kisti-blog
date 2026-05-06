-- Fix function_search_path_mutable
ALTER FUNCTION IF EXISTS public.handle_first_user_admin() SET search_path = '';
ALTER FUNCTION IF EXISTS public.handle_new_user() SET search_path = '';
ALTER FUNCTION IF EXISTS public.is_admin(uuid) SET search_path = '';
ALTER FUNCTION IF EXISTS public.rls_auto_enable() SET search_path = '';

-- Fix rls_policy_always_true
-- Drop rogue policies that bypass RLS
DROP POLICY IF EXISTS "Admin Trans" ON public.post_translations;
DROP POLICY IF EXISTS "Admin Posts" ON public.posts;

-- Fix public_bucket_allows_listing
-- Remove overly broad SELECT policies on storage.objects
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Media" ON storage.objects;
DROP POLICY IF EXISTS "media public read" ON storage.objects;
DROP POLICY IF EXISTS "media public read individual" ON storage.objects;

-- Allow admins to list media objects
CREATE POLICY "admins list media" ON storage.objects FOR SELECT 
USING (bucket_id = 'media' and public.is_admin(auth.uid()));

-- Fix anon_security_definer_function_executable & authenticated_security_definer_function_executable
-- Revoke execute from public, anon, authenticated for internal helper functions
REVOKE EXECUTE ON FUNCTION public.handle_first_user_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
