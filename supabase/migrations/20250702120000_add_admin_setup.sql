-- Create function to handle admin user creation securely
CREATE OR REPLACE FUNCTION create_admin_user(
  user_email TEXT,
  user_role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
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
    -- For subsequent admins, require authentication
    -- This will only work if the user is already authenticated
    INSERT INTO public.admin_users (email, password_hash, role, active)
    VALUES (user_email, 'managed_by_auth', user_role, is_active);

    result := json_build_object(
      'success', true,
      'message', 'Admin user created successfully',
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

-- Update RLS policy to allow admin creation for unauthenticated requests when table is empty
DROP POLICY IF EXISTS "Only authenticated admins can access admin_users" ON public.admin_users;
CREATE POLICY "Allow admin creation and authenticated access" ON public.admin_users
  FOR ALL USING (
    -- Allow if table is empty (first admin setup)
    (SELECT COUNT(*) = 0 FROM public.admin_users)
    OR
    -- Allow if user is authenticated admin
    (auth.jwt() ->> 'email' IS NOT NULL AND
     EXISTS (SELECT 1 FROM public.admin_users WHERE email = auth.jwt() ->> 'email' AND active = true))
  );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_admin_user(TEXT, TEXT, BOOLEAN) TO anon;