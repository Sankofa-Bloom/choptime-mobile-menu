-- Create the admin user in Supabase Auth
-- This will allow the admin to sign in using the existing email/password
-- Only create if user doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'choptym237@gmail.com') THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      'choptym237@gmail.com',
      crypt('Choptym@237Sankofa', gen_salt('bf')),
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  END IF;
END $$;