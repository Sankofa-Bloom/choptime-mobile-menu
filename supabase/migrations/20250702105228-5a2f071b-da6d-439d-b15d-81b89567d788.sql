-- Create the admin user in Supabase Auth
-- This will allow the admin to sign in using the existing email/password
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
  'choptime237@gmail.com',
  crypt('Choptime@237Sankofa', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('Choptime@237Sankofa', gen_salt('bf')),
  updated_at = now();