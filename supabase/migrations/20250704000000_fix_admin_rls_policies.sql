-- =============================================================================
-- FIX ADMIN RLS POLICIES
-- This migration fixes the circular reference issue in admin_users RLS policies
-- =============================================================================

-- Drop the problematic existing policies
DROP POLICY IF EXISTS "Only authenticated admins can access admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow admin creation and authenticated access" ON public.admin_users;

-- Create new, non-circular RLS policies for admin_users

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
      AND au.id != public.admin_users.id
    )
    OR
    -- Allow self-management
    auth.jwt() ->> 'email' = email
  );

-- Policy 4: Allow service role to bypass RLS (for admin functions)
CREATE POLICY "Service role can access all admin records" ON public.admin_users
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Grant necessary permissions for the create_admin_user function
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT ON public.admin_users TO authenticated, anon;

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

-- Update the create_admin_user function to work with the new policies
CREATE OR REPLACE FUNCTION create_admin_user(
  user_email TEXT,
  user_role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  current_user_email TEXT;
BEGIN
  -- Get the current authenticated user's email
  current_user_email := auth.jwt() ->> 'email';

  -- Check if admin_users table is empty (first admin setup)
  IF NOT EXISTS (SELECT 1 FROM public.admin_users LIMIT 1) THEN
    -- Allow first admin creation without authentication
    INSERT INTO public.admin_users (email, password_hash, role, active)
    VALUES (user_email, 'managed_by_auth', user_role, is_active);

    result := json_build_object(
      'success', true,
      'message', 'First admin user created successfully',
      'user_email', user_email
    );
  ELSE
    -- For subsequent admins, require existing admin authentication
    IF current_user_email IS NULL THEN
      result := json_build_object(
        'success', false,
        'message', 'Authentication required to create admin users',
        'user_email', user_email
      );
      RETURN result;
    END IF;

    -- Check if the current user is an active admin
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE email = current_user_email AND active = true
    ) THEN
      result := json_build_object(
        'success', false,
        'message', 'Only existing admins can create new admin users',
        'user_email', user_email
      );
      RETURN result;
    END IF;

    -- Create the new admin user
    INSERT INTO public.admin_users (email, password_hash, role, active)
    VALUES (user_email, 'managed_by_auth', user_role, is_active);

    result := json_build_object(
      'success', true,
      'message', 'Admin user created successfully by ' || current_user_email,
      'user_email', user_email
    );
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM,
      'user_email', user_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update the verifyAdminStatus function to work with the new policies
-- This function checks if a user is an admin without causing circular references

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- This migration fixes the RLS policy circular reference issue that was
-- preventing admin user creation and authentication from working properly.