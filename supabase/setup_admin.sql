-- Setup Admin User
-- =================
-- Run this in Supabase SQL Editor to create your first admin user

-- 1. First, create the admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- 2. Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for admins to read their own data
CREATE POLICY "Admins can read their own data" ON admin_users
  FOR SELECT
  USING (email = auth.jwt() ->> 'email');

-- 4. Create policy for service role to manage admins
CREATE POLICY "Service role can manage admins" ON admin_users
  FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Insert a default admin user
-- IMPORTANT: Change this email and create the user in Supabase Auth
INSERT INTO admin_users (email, name, role, is_active)
VALUES
  ('admin@giggsi.com', 'Admin', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- 6. IMPORTANT: Create the auth user manually in Supabase Dashboard
-- Go to: Authentication > Users > Invite User
-- Email: admin@giggsi.com
-- Password: Choose a strong password

-- Alternative: Create user via SQL (requires service role)
-- This won't work in the SQL editor, but documents the process:
/*
-- To create an auth user programmatically, you need to:
-- 1. Use the Supabase Dashboard to invite a user
-- 2. Or use the Management API with service role key
-- 3. Or use the supabase CLI

-- Example with Supabase CLI:
-- supabase auth admin create-user --email admin@giggsi.com --password YourStrongPassword123!
*/

-- 7. Verify the setup
SELECT * FROM admin_users;

-- Note: After running this SQL:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Invite User"
-- 3. Enter email: admin@giggsi.com
-- 4. Set a password or send invite email
-- 5. The user will be able to login to the admin panel