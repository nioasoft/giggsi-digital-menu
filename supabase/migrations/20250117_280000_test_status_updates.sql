-- Test script to check if status updates actually work and identify the real issue

-- 1. First, check if kitchen_status and bar_status columns actually exist
SELECT
  'COLUMN_CHECK' as test_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
  AND column_name IN ('kitchen_status', 'bar_status', 'status')
ORDER BY column_name;

-- 2. Show current order_items data with ALL status-related fields
SELECT
  'CURRENT_DATA' as test_type,
  id,
  COALESCE(kitchen_status, 'NULL') as kitchen_status,
  COALESCE(bar_status, 'NULL') as bar_status,
  sent_to_kitchen,
  batch_number
FROM order_items
WHERE sent_to_kitchen = TRUE
ORDER BY created_at DESC
LIMIT 5;

-- 3. Try to manually update one item to test if updates work
-- First, let's get an item ID to test with
SELECT
  'TEST_ITEM_FOR_UPDATE' as test_type,
  id,
  COALESCE(kitchen_status, 'NULL') as current_kitchen_status,
  order_id,
  quantity
FROM order_items
WHERE sent_to_kitchen = TRUE
  AND COALESCE(kitchen_status, 'pending') IN ('pending', 'in_progress')
LIMIT 1;

-- 4. Let's also check the table structure to see what columns are missing
SELECT
  'ALL_COLUMNS' as test_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
ORDER BY ordinal_position;