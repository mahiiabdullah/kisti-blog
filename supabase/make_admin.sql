DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find the user ID from auth.users by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'mdmahiabdullah09@gmail.com';

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email mdmahiabdullah09@gmail.com not found. Make sure they have signed up first.';
  END IF;

  -- Delete existing roles just in case
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Insert the super_admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'super_admin');

END $$;
