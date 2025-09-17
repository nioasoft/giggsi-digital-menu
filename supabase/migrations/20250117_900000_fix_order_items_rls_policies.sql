-- Fix RLS policies for order_items table
-- This resolves conflicts between anonymous and waiter access

-- 1. Drop all existing policies on order_items
DROP POLICY IF EXISTS "Waiters can view order items" ON order_items;
DROP POLICY IF EXISTS "Waiters can manage order items" ON order_items;
DROP POLICY IF EXISTS "Allow anonymous read access" ON order_items;
DROP POLICY IF EXISTS "Allow anonymous status updates" ON order_items;
DROP POLICY IF EXISTS "Allow anonymous read orders" ON order_items;

-- 2. Create clean, non-conflicting policies

-- Policy for SELECT - Everyone can read
CREATE POLICY "Anyone can read order items"
ON order_items
FOR SELECT
USING (true);

-- Policy for INSERT - Only authenticated waiters
CREATE POLICY "Authenticated waiters can insert"
ON order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM waiter_users
    WHERE waiter_users.email = auth.jwt() ->> 'email'
    AND waiter_users.is_active = true
  )
);

-- Policy for UPDATE - Both waiters and anonymous (for status updates)
CREATE POLICY "Anyone can update order items"
ON order_items
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Policy for DELETE - Only authenticated waiters
CREATE POLICY "Authenticated waiters can delete"
ON order_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM waiter_users
    WHERE waiter_users.email = auth.jwt() ->> 'email'
    AND waiter_users.is_active = true
  )
);

-- 3. Verify the policies
SELECT
  'order_items_policies' as table_name,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY cmd, policyname;

-- 4. Status message
SELECT
  'POLICIES_FIXED' as status,
  'RLS policies for order_items have been fixed' as message,
  'Waiters can now insert items and kitchen displays can read' as details;