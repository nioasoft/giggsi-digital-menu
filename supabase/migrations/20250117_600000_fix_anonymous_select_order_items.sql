-- Fix anonymous SELECT access for order_items table
-- This allows kitchen/bar displays to read orders without authentication

-- 1. Check current RLS policies on order_items
SELECT
  'CURRENT_RLS_POLICIES' as section,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as condition
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY policyname;

-- 2. Drop existing anonymous SELECT policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous read access" ON order_items;

-- 3. Create RLS policy to allow anonymous users to SELECT from order_items
-- This will allow the kitchen/bar displays to fetch orders
CREATE POLICY "Allow anonymous read access"
ON order_items
FOR SELECT
TO anon
USING (true);  -- Allow read access to all rows

-- 4. Verify all policies after creation
SELECT
  'AFTER_POLICY_CREATION' as section,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as condition
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY cmd, policyname;

-- 5. Also ensure anonymous can read from related tables needed for the views
-- Check if anonymous can read from orders table
DROP POLICY IF EXISTS "Allow anonymous read orders" ON orders;
CREATE POLICY "Allow anonymous read orders"
ON orders
FOR SELECT
TO anon
USING (true);

-- Check if anonymous can read from tables table
DROP POLICY IF EXISTS "Allow anonymous read tables" ON tables;
-- Note: "Anyone can view tables" policy already exists and should cover this

-- Check if anonymous can read from menu_items
-- Menu items should already be publicly readable, but let's ensure it
DO $$
BEGIN
  -- Check if RLS is enabled on menu_items
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'menu_items'
    AND rowsecurity = true
  ) THEN
    -- If RLS is enabled, ensure anonymous can read
    DROP POLICY IF EXISTS "Allow anonymous read menu items" ON menu_items;
    CREATE POLICY "Allow anonymous read menu items"
    ON menu_items
    FOR SELECT
    TO anon
    USING (true);
  END IF;
END $$;

-- 6. Test message
SELECT
  'POLICY_CREATION_COMPLETE' as status,
  'Anonymous SELECT policies created successfully! Kitchen/bar displays should now work.' as message;