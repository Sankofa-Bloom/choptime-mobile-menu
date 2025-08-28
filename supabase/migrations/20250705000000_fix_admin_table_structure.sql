-- =============================================================================
-- FIX ADMIN TABLE STRUCTURE
-- This migration ensures the admin_users table exists with proper structure
-- =============================================================================

-- First, check if admin_users table exists, if not create it
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

-- Drop any existing problematic policies
DROP POLICY IF EXISTS "Allow first admin creation" ON public.admin_users;
DROP POLICY IF EXISTS "Users can read their own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Service role can access all admin records" ON public.admin_users;

-- Create simple, working RLS policies
CREATE POLICY "Allow admin access for authenticated users" ON public.admin_users
  FOR ALL USING (
    auth.role() = 'authenticated'
  );

-- Allow service role full access
CREATE POLICY "Service role full access" ON public.admin_users
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- Grant necessary permissions
GRANT ALL ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;

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

-- Insert a default admin user if none exists
INSERT INTO public.admin_users (email, role, active)
SELECT 'choptym237@gmail.com', 'admin', true
WHERE NOT EXISTS (SELECT 1 FROM public.admin_users WHERE email = 'choptym237@gmail.com');

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
