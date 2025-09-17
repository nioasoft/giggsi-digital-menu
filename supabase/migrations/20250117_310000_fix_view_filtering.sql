-- Fix the kitchen_orders view filtering to include all relevant items
-- The issue is that the view shows 2 items but table has 3 items that should be visible

-- First, let's see what the current view definition is
SELECT
  'CURRENT_VIEW_DEFINITION' as info,
  definition
FROM pg_views
WHERE viewname = 'kitchen_orders';

-- Let's see what items are being filtered out
SELECT
  'ITEMS_IN_TABLE_NOT_IN_VIEW' as issue,
  oi.id,
  oi.order_id,
  COALESCE(oi.kitchen_status, 'pending') as kitchen_status,
  oi.batch_number,
  mi.name_he as item_name,
  t.table_number,
  'This item should be in view but is missing' as problem
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN categories c ON mi.category_id = c.id
JOIN orders o ON oi.order_id = o.id
JOIN tables t ON o.table_id = t.id
WHERE c.station_type = 'kitchen'
  AND o.status = 'open'
  AND oi.sent_to_kitchen = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM kitchen_orders kv WHERE kv.id = oi.id
  );

-- Drop and recreate the view with corrected filtering
DROP VIEW IF EXISTS kitchen_orders;

-- Create the corrected kitchen_orders view
-- The key is to ensure we include ALL items that should be visible
CREATE OR REPLACE VIEW kitchen_orders AS
SELECT
  oi.id,
  oi.order_id,
  oi.quantity,
  oi.notes,
  oi.addons,
  oi.batch_number,
  COALESCE(oi.kitchen_status, 'pending') as status,
  oi.created_at,
  oi.sent_to_kitchen_at,
  oi.kitchen_started_at as started_at,
  oi.kitchen_ready_at as ready_at,
  mi.name_he as item_name,
  mi.name_en as item_name_en,
  c.station_type,
  t.table_number,
  o.waiter_id,
  wu.name as waiter_name
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN categories c ON mi.category_id = c.id
JOIN orders o ON oi.order_id = o.id
JOIN tables t ON o.table_id = t.id
LEFT JOIN waiter_users wu ON o.waiter_id = wu.id
WHERE c.station_type = 'kitchen'
  AND o.status = 'open'
  AND oi.sent_to_kitchen = TRUE
  AND COALESCE(oi.kitchen_status, 'pending') != 'archived';  -- Show everything EXCEPT archived

-- Grant access
GRANT SELECT ON kitchen_orders TO anon;

-- Verify the fix worked
SELECT
  'AFTER_FIX_SUMMARY' as section,
  (SELECT COUNT(*) FROM kitchen_orders) as view_count,
  (SELECT COUNT(*) FROM order_items oi
   JOIN menu_items mi ON oi.menu_item_id = mi.id
   JOIN categories c ON mi.category_id = c.id
   JOIN orders o ON oi.order_id = o.id
   WHERE c.station_type = 'kitchen'
     AND o.status = 'open'
     AND oi.sent_to_kitchen = TRUE
     AND COALESCE(oi.kitchen_status, 'pending') != 'archived') as table_count,
  'These counts should now match' as note;

-- Show what the view returns now
SELECT
  'CORRECTED_VIEW_DATA' as source,
  id,
  order_id,
  table_number,
  item_name,
  status,
  batch_number
FROM kitchen_orders
ORDER BY created_at DESC;