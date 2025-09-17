-- Check and Fix Admin Access
-- ==========================

-- 1. First, let's check the structure of admin_users table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'admin_users';

-- 2. Check if table exists and what columns it has
SELECT * FROM admin_users LIMIT 1;

-- 3. Safe insert - using only the columns that exist
-- First, let's add the admin without the 'name' column
-- IMPORTANT: Replace 'your-email@example.com' with your actual admin email!

INSERT INTO admin_users (email, is_active)
VALUES ('your-email@example.com', true)
ON CONFLICT (email)
DO UPDATE SET
  is_active = true;

-- 4. Alternative: If the table structure is completely different, let's check it
-- and add columns if needed
DO $$
BEGIN
  -- Add 'name' column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'admin_users' AND column_name = 'name') THEN
    ALTER TABLE admin_users ADD COLUMN name VARCHAR(255);
  END IF;

  -- Add 'role' column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'admin_users' AND column_name = 'role') THEN
    ALTER TABLE admin_users ADD COLUMN role VARCHAR(50) DEFAULT 'admin';
  END IF;

  -- Add 'is_active' column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'admin_users' AND column_name = 'is_active') THEN
    ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Add 'last_login' column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'admin_users' AND column_name = 'last_login') THEN
    ALTER TABLE admin_users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 5. Now insert/update the admin user with all columns
-- IMPORTANT: Replace with your actual email!
INSERT INTO admin_users (email, is_active)
VALUES ('your-email@example.com', true)
ON CONFLICT (email)
DO UPDATE SET
  is_active = true;

-- 6. Update the name and role if columns exist
UPDATE admin_users
SET name = COALESCE(name, 'Admin User'),
    role = COALESCE(role, 'admin')
WHERE email = 'your-email@example.com';

-- 7. Create or replace the RLS policy
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can check admin status" ON admin_users;
CREATE POLICY "Anyone can check admin status" ON admin_users
  FOR SELECT USING (true);

-- 8. Show the result
SELECT * FROM admin_users;

-- 9. Show current user email for reference
SELECT auth.email() as current_user_email;