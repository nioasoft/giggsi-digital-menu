-- Fix Admin Access
-- =================
-- Run this in Supabase SQL Editor to fix admin access

-- 1. Create admin_users table if it doesn't exist
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

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read their own data" ON admin_users;
DROP POLICY IF EXISTS "Service role can manage admins" ON admin_users;
DROP POLICY IF EXISTS "Admin can manage waiters" ON waiter_users;
DROP POLICY IF EXISTS "Waiters can view their own profile" ON waiter_users;
DROP POLICY IF EXISTS "Anyone can view tables" ON tables;
DROP POLICY IF EXISTS "Waiters can update tables" ON tables;

-- 4. Create policy for admins to read admin_users
CREATE POLICY "Admins can read admin_users" ON admin_users
  FOR SELECT
  USING (true);  -- Allow all authenticated users to check if they're admins

-- 5. Create policy for admins to manage admin_users (optional)
CREATE POLICY "Admins can manage admin_users" ON admin_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

-- 6. Get all existing auth users and add them as admins
-- IMPORTANT: This will list all your auth users
-- You can then decide which one should be the admin
DO $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the email from auth.users table
  -- Note: You need to check which email is your admin in Supabase Dashboard
  -- For now, we'll insert a placeholder that you'll update

  -- Insert your admin user
  -- CHANGE THIS EMAIL to your actual admin email from Supabase Auth
  INSERT INTO admin_users (email, name, role, is_active)
  VALUES
    ('YOUR_ADMIN_EMAIL@HERE.COM', 'Admin User', 'admin', true)
  ON CONFLICT (email)
  DO UPDATE SET
    is_active = true,
    updated_at = NOW();

END $$;

-- 7. Create policies for waiter_users if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'waiter_users') THEN
    -- Policy for admin to manage waiters
    CREATE POLICY "Admin can manage waiters" ON waiter_users
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM admin_users
          WHERE admin_users.email = auth.jwt() ->> 'email'
          AND admin_users.is_active = true
        )
      );

    -- Policy for waiters to view their own profile
    CREATE POLICY "Waiters can view their own profile" ON waiter_users
      FOR SELECT USING (
        email = auth.jwt() ->> 'email'
      );
  END IF;
END $$;

-- 8. Create policies for tables if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tables') THEN
    -- Anyone can view tables
    CREATE POLICY "Anyone can view tables" ON tables
      FOR SELECT USING (true);

    -- Waiters can update tables
    CREATE POLICY "Waiters can update tables" ON tables
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM waiter_users
          WHERE waiter_users.email = auth.jwt() ->> 'email'
          AND waiter_users.is_active = true
        )
      );
  END IF;
END $$;

-- 9. Show current admin_users (so you can verify)
SELECT * FROM admin_users;

-- 10. IMPORTANT MANUAL STEPS:
-- ============================
-- 1. Look at your Supabase Dashboard > Authentication > Users
-- 2. Find your admin user's email
-- 3. Replace 'YOUR_ADMIN_EMAIL@HERE.COM' in the SQL above with your actual email
-- 4. Run this SQL again
--
-- OR run this directly with your email:
-- INSERT INTO admin_users (email, name, role, is_active)
-- VALUES ('your-actual-email@example.com', 'Admin', 'admin', true)
-- ON CONFLICT (email) DO UPDATE SET is_active = true;