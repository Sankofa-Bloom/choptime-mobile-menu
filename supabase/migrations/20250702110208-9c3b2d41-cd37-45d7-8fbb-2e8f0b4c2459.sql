-- Insert default admin user
INSERT INTO admin_users (email, password_hash, role, active, created_at, updated_at)
VALUES (
  'choptime237@gmail.com',
  crypt('Choptime@237Sankofa', gen_salt('bf')),
  'admin',
  true,
  now(),
  now()
);