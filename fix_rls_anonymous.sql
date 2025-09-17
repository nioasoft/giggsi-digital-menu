-- Fix anonymous SELECT access for order_items table
-- Run this in Supabase SQL Editor

-- 1. Create RLS policy to allow anonymous users to SELECT from order_items
DROP POLICY IF EXISTS "Allow anonymous read access" ON order_items;
CREATE POLICY "Allow anonymous read access"
ON order_items
FOR SELECT
TO anon
USING (true);

-- 2. Also allow anonymous to read from orders table
DROP POLICY IF EXISTS "Allow anonymous read orders" ON orders;
CREATE POLICY "Allow anonymous read orders"
ON orders
FOR SELECT
TO anon
USING (true);

-- 3. Verify the policies were created
SELECT
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('order_items', 'orders')
  AND 'anon' = ANY(roles)
ORDER BY tablename, cmd;