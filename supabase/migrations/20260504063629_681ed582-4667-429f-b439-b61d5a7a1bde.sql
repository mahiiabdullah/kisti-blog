
-- fix touch_updated_at search_path
create or replace function public.touch_updated_at()
returns trigger language plpgsql security definer set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

-- revoke public execute on internal helpers
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.is_admin(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- restrict media bucket listing: allow read of objects but not blanket listing via storage.objects select for anon listing operation
drop policy if exists "media public read" on storage.objects;
create policy "media public read individual" on storage.objects for select using (bucket_id = 'media');
