-- Insert default admin user
INSERT INTO admin_users (email, password_hash, role, active, created_at, updated_at)
VALUES (
  'choptym237@gmail.com',
  crypt('Choptym@237Sankofa', gen_salt('bf')),
  'admin',
  true,
  now(),
  now()
);