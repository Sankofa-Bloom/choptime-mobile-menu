-- Create function to verify admin password
CREATE OR REPLACE FUNCTION verify_admin_password(admin_email TEXT, admin_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Get the stored password hash for the admin
  SELECT password_hash INTO stored_hash 
  FROM admin_users 
  WHERE email = admin_email AND active = true;
  
  -- If no admin found, return false
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the provided password matches the stored hash
  RETURN crypt(admin_password, stored_hash) = stored_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;