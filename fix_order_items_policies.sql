-- Quick fix for order_items RLS policies
-- Run this in Supabase SQL Editor

-- 1. Drop all existing policies on order_items
DROP POLICY IF EXISTS "Waiters can view order items" ON order_items;
DROP POLICY IF EXISTS "Waiters can manage order items" ON order_items;
DROP POLICY IF EXISTS "Allow anonymous read access" ON order_items;
DROP POLICY IF EXISTS "Allow anonymous status updates" ON order_items;
DROP POLICY IF EXISTS "Allow anonymous read orders" ON order_items;

-- 2. Create clean, non-conflicting policies

-- Everyone can read
CREATE POLICY "Anyone can read order items"
ON order_items FOR SELECT
USING (true);

-- Only authenticated waiters can insert
CREATE POLICY "Authenticated waiters can insert"
ON order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM waiter_users
    WHERE waiter_users.email = auth.jwt() ->> 'email'
    AND waiter_users.is_active = true
  )
);

-- Anyone can update (for status updates)
CREATE POLICY "Anyone can update order items"
ON order_items FOR UPDATE
USING (true)
WITH CHECK (true);

-- Only authenticated waiters can delete
CREATE POLICY "Authenticated waiters can delete"
ON order_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM waiter_users
    WHERE waiter_users.email = auth.jwt() ->> 'email'
    AND waiter_users.is_active = true
  )
);

-- 3. Check the result
SELECT cmd, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'order_items'
GROUP BY cmd
ORDER BY cmd;