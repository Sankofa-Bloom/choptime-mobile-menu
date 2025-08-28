-- Insert default admin user (only if not exists)
INSERT INTO admin_users (email, password_hash, role, active, created_at, updated_at)
SELECT
  'choptym237@gmail.com',
  crypt('Choptym@237Sankofa', gen_salt('bf')),
  'admin',
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE email = 'choptym237@gmail.com'
);