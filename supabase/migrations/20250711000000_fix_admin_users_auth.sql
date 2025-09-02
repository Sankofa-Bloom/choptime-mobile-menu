-- =============================================================================
-- FIX ADMIN_USERS AUTHENTICATION STRUCTURE
-- This migration ensures admin_users table has correct structure without auth_id
-- =============================================================================

-- First, ensure admin_users table has the correct structure
-- Remove auth_id column if it exists (it shouldn't exist)
ALTER TABLE public.admin_users DROP COLUMN IF EXISTS auth_id;

-- Ensure the table has the correct structure
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT DEFAULT 'managed_by_auth',
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add any missing columns
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT 'managed_by_auth',
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure the table has RLS enabled
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow first admin creation" ON public.admin_users;
DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Service role can access all admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Allow admin creation and authenticated access" ON public.admin_users;
DROP POLICY IF EXISTS "Allow admin access for authenticated users" ON public.admin_users;
DROP POLICY IF EXISTS "Service role full access" ON public.admin_users;

-- Create simple, working RLS policies
-- Policy 1: Allow anyone to INSERT when the table is empty (first admin setup)
CREATE POLICY "Allow first admin creation" ON public.admin_users
  FOR INSERT WITH CHECK (
    (SELECT COUNT(*) = 0 FROM public.admin_users)
  );

-- Policy 2: Allow authenticated users to read their own admin record
CREATE POLICY "Users can read their own admin record" ON public.admin_users
  FOR SELECT USING (
    auth.jwt() ->> 'email' = email
  );

-- Policy 3: Allow existing admins to manage other admin records
CREATE POLICY "Admins can manage admin records" ON public.admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.email = auth.jwt() ->> 'email'
      AND au.active = true
    )
  );

-- Policy 4: Allow service role full access
CREATE POLICY "Service role full access" ON public.admin_users
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- Grant necessary permissions
GRANT ALL ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
GRANT SELECT, INSERT ON public.admin_users TO anon;

-- Create a simple function to check admin status
CREATE OR REPLACE FUNCTION check_admin_status(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify admin status (bypasses RLS)
CREATE OR REPLACE FUNCTION verify_admin_status(check_email TEXT)
RETURNS JSON AS $$
DECLARE
  admin_record RECORD;
  result JSON;
BEGIN
  -- Try to find the admin record
  SELECT * INTO admin_record
  FROM public.admin_users
  WHERE email = check_email AND active = true;

  IF FOUND THEN
    result := json_build_object(
      'is_admin', true,
      'admin_id', admin_record.id,
      'role', admin_record.role,
      'email', admin_record.email,
      'created_at', admin_record.created_at
    );
  ELSE
    result := json_build_object(
      'is_admin', false,
      'email', check_email
    );
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'is_admin', false,
      'error', SQLERRM,
      'email', check_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert a default admin user if none exists
INSERT INTO public.admin_users (email, role, active)
SELECT 'choptym237@gmail.com', 'admin', true
WHERE NOT EXISTS (SELECT 1 FROM public.admin_users WHERE email = 'choptym237@gmail.com');

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
