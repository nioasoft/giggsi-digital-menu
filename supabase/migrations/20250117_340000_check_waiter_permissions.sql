-- Check and fix permissions for waiter_users table

-- 1. Check if RLS is enabled
SELECT
  'RLS_STATUS' as check_type,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'waiter_users';

-- 2. Check existing policies
SELECT
  'EXISTING_POLICIES' as check_type,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'waiter_users'
ORDER BY policyname;

-- 3. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Allow anonymous inserts" ON waiter_users;
DROP POLICY IF EXISTS "Allow anonymous reads" ON waiter_users;
DROP POLICY IF EXISTS "Allow anonymous updates" ON waiter_users;

-- 4. Create comprehensive policies for waiter_users
-- Allow anyone to insert (for registration)
CREATE POLICY "Allow public insert for registration"
ON waiter_users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to read waiters (for login and admin)
CREATE POLICY "Allow public read"
ON waiter_users
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow updates for admin operations
CREATE POLICY "Allow public updates"
ON waiter_users
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow deletes for admin operations
CREATE POLICY "Allow public deletes"
ON waiter_users
FOR DELETE
TO anon, authenticated
USING (true);

-- 5. Verify the new policies
SELECT
  'NEW_POLICIES' as check_type,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'waiter_users'
ORDER BY policyname;

-- 6. Check if danielbart745@gmail.com exists
SELECT
  'CHECK_SPECIFIC_USER' as check_type,
  id,
  email,
  name,
  is_active,
  created_at
FROM waiter_users
WHERE email = 'danielbart745@gmail.com';

-- 7. If the user exists in auth but not in waiter_users, insert manually
INSERT INTO waiter_users (email, name, password_hash, is_active)
SELECT
  email,
  COALESCE(raw_user_meta_data->>'name', 'Daniel'),
  'managed_by_supabase_auth',
  false
FROM auth.users
WHERE email = 'danielbart745@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM waiter_users WHERE email = 'danielbart745@gmail.com'
  );

-- 8. Show final result
SELECT
  'FINAL_CHECK' as check_type,
  COUNT(*) as total_waiters,
  COUNT(CASE WHEN is_active THEN 1 END) as active_waiters,
  COUNT(CASE WHEN NOT is_active THEN 1 END) as pending_waiters
FROM waiter_users;