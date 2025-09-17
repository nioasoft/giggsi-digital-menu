-- Quick fix for all anonymous permissions
-- Run this in Supabase SQL Editor

-- 1. Grant permissions on views
GRANT SELECT ON kitchen_orders TO anon;
GRANT SELECT ON bar_orders TO anon;

-- 2. Create RLS policies for tables
DROP POLICY IF EXISTS "Allow anonymous read access" ON order_items;
CREATE POLICY "Allow anonymous read access"
ON order_items
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Allow anonymous read orders" ON orders;
CREATE POLICY "Allow anonymous read orders"
ON orders
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Allow anonymous read tables" ON tables;
CREATE POLICY "Allow anonymous read tables"
ON tables
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Allow anonymous read waiter names" ON waiter_users;
CREATE POLICY "Allow anonymous read waiter names"
ON waiter_users
FOR SELECT
TO anon
USING (true);

-- 3. Verify the fix
SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename IN ('order_items', 'orders', 'tables', 'waiter_users')
  AND 'anon' = ANY(roles)
  AND cmd = 'SELECT'
ORDER BY tablename;