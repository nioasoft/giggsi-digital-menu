-- Fix RLS policy creation with correct PostgreSQL syntax
-- PostgreSQL doesn't support IF NOT EXISTS with CREATE POLICY

-- 1. Check current RLS policies on order_items
SELECT
  'CURRENT_RLS_POLICIES' as section,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY policyname;

-- 2. Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous status updates" ON order_items;

-- 3. Create RLS policy to allow anonymous users to update status fields
-- This will allow the kitchen/bar app to update order statuses
CREATE POLICY "Allow anonymous status updates"
ON order_items
FOR UPDATE
TO anon
USING (true)  -- Allow updates on any row
WITH CHECK (true);  -- Allow any update values

-- 4. Verify the policy was created successfully
SELECT
  'AFTER_POLICY_CREATION' as section,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'order_items'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- 5. Test message
SELECT
  'POLICY_CREATION_COMPLETE' as status,
  'RLS policy created successfully! Test Order Ready button now.' as message;