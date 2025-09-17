-- Test manual status updates to identify why updates are failing

-- 1. Show current data with exact status values
SELECT
  'CURRENT_ORDER_ITEMS' as section,
  id,
  order_id,
  COALESCE(kitchen_status, 'NULL') as kitchen_status,
  COALESCE(bar_status, 'NULL') as bar_status,
  batch_number,
  sent_to_kitchen
FROM order_items
WHERE sent_to_kitchen = TRUE
ORDER BY created_at DESC;

-- 2. Try to manually update one item to 'archived' to test if updates work
-- First get an item ID
DO $$
DECLARE
    test_item_id uuid;
BEGIN
    -- Get the first item that should be updatable
    SELECT id INTO test_item_id
    FROM order_items
    WHERE sent_to_kitchen = TRUE
      AND COALESCE(kitchen_status, 'pending') IN ('pending', 'in_progress')
    LIMIT 1;

    IF test_item_id IS NOT NULL THEN
        -- Try to update it
        RAISE NOTICE 'Attempting to update item: %', test_item_id;

        UPDATE order_items
        SET kitchen_status = 'archived',
            kitchen_ready_at = NOW()
        WHERE id = test_item_id;

        RAISE NOTICE 'Update completed for item: %', test_item_id;

        -- Check if the update worked
        PERFORM 1 FROM order_items
        WHERE id = test_item_id AND kitchen_status = 'archived';

        IF FOUND THEN
            RAISE NOTICE 'SUCCESS: Item % now has kitchen_status = archived', test_item_id;
        ELSE
            RAISE NOTICE 'FAILED: Item % still does not have kitchen_status = archived', test_item_id;
        END IF;
    ELSE
        RAISE NOTICE 'No suitable test item found';
    END IF;
END $$;

-- 3. Check RLS policies on order_items table
SELECT
  'RLS_POLICIES' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'order_items';

-- 4. Check if RLS is enabled on the table
SELECT
  'RLS_STATUS' as section,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'order_items';

-- 5. Show the updated data after manual test
SELECT
  'AFTER_MANUAL_UPDATE' as section,
  id,
  order_id,
  COALESCE(kitchen_status, 'NULL') as kitchen_status,
  COALESCE(bar_status, 'NULL') as bar_status,
  batch_number
FROM order_items
WHERE sent_to_kitchen = TRUE
ORDER BY created_at DESC;