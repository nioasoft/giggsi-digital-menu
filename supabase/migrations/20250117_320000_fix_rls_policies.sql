-- Fix RLS policies for order_items to allow status updates from kitchen/bar app
-- The issue is that RLS is blocking UPDATE operations on order_items table

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

-- 2. Check if there's an UPDATE policy for anonymous users
SELECT
  'UPDATE_POLICY_CHECK' as test,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'order_items'
        AND cmd = 'UPDATE'
        AND 'anon' = ANY(roles)
    )
    THEN 'UPDATE policy exists for anon'
    ELSE 'NO UPDATE policy for anon - THIS IS THE PROBLEM!'
  END as result;

-- 3. Create RLS policy to allow anonymous users to update status fields
-- This will allow the kitchen/bar app to update order statuses
CREATE POLICY IF NOT EXISTS "Allow anonymous status updates"
ON order_items
FOR UPDATE
TO anon
USING (true)  -- Allow updates on any row
WITH CHECK (true);  -- Allow any update values

-- Alternative: More restrictive policy that only allows status field updates
-- Uncomment this and comment the above if you want more security
/*
CREATE POLICY IF NOT EXISTS "Allow anonymous status updates only"
ON order_items
FOR UPDATE
TO anon
USING (true)
WITH CHECK (
  -- Only allow updates to status and timestamp fields
  NEW.id = OLD.id
  AND NEW.order_id = OLD.order_id
  AND NEW.menu_item_id = OLD.menu_item_id
  AND NEW.quantity = OLD.quantity
  AND NEW.unit_price = OLD.unit_price
  AND NEW.total_price = OLD.total_price
  AND NEW.notes = OLD.notes
  AND NEW.addons = OLD.addons
  AND NEW.created_at = OLD.created_at
  AND NEW.sent_to_kitchen = OLD.sent_to_kitchen
  AND NEW.sent_to_kitchen_at = OLD.sent_to_kitchen_at
  AND NEW.batch_number = OLD.batch_number
);
*/

-- 4. Verify the policy was created
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

-- 5. Test if updates should work now
SELECT
  'UPDATE_TEST_SETUP' as info,
  'Now test the Order Ready button - it should work!' as message;