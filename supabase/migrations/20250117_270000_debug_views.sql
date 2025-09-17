-- Debug script to understand why the views are not filtering correctly

-- 1. Show current view definitions
SELECT
  'CURRENT VIEW DEFINITIONS' as section,
  '' as info,
  '' as value,
  '' as extra
UNION ALL
SELECT
  'kitchen_orders_view' as section,
  'definition' as info,
  definition as value,
  '' as extra
FROM pg_views
WHERE viewname = 'kitchen_orders'
UNION ALL
SELECT
  'bar_orders_view' as section,
  'definition' as info,
  definition as value,
  '' as extra
FROM pg_views
WHERE viewname = 'bar_orders';

-- 2. Check actual order_items table structure
SELECT
  'ORDER_ITEMS TABLE STRUCTURE' as section,
  column_name as info,
  data_type as value,
  is_nullable as extra
FROM information_schema.columns
WHERE table_name = 'order_items'
  AND column_name IN (
    'kitchen_status', 'bar_status', 'status',
    'batch_number', 'sent_to_kitchen'
  )
ORDER BY column_name;

-- 3. Show actual data in order_items to see current status values
SELECT
  'CURRENT ORDER_ITEMS DATA' as section,
  'item_id: ' || id as info,
  'kitchen_status: ' || COALESCE(kitchen_status, 'NULL') as value,
  'bar_status: ' || COALESCE(bar_status, 'NULL') || ', batch: ' || COALESCE(batch_number::text, 'NULL') as extra
FROM order_items
WHERE sent_to_kitchen = TRUE
ORDER BY created_at DESC
LIMIT 10;

-- 4. Test what kitchen_orders view actually returns
SELECT
  'KITCHEN_ORDERS VIEW RESULTS' as section,
  'item_id: ' || id as info,
  'status_from_view: ' || status as value,
  'batch: ' || batch_number || ', table: ' || table_number as extra
FROM kitchen_orders
ORDER BY created_at DESC;

-- 5. Test what bar_orders view actually returns
SELECT
  'BAR_ORDERS VIEW RESULTS' as section,
  'item_id: ' || id as info,
  'status_from_view: ' || status as value,
  'batch: ' || batch_number || ', table: ' || table_number as extra
FROM bar_orders
ORDER BY created_at DESC;

-- 6. Direct query to see what SHOULD be filtered out
SELECT
  'SHOULD_BE_FILTERED_OUT' as section,
  'kitchen_archived_count' as info,
  COUNT(*)::text as value,
  'items with kitchen_status=archived' as extra
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN categories c ON mi.category_id = c.id
JOIN orders o ON oi.order_id = o.id
WHERE c.station_type = 'kitchen'
  AND o.status = 'open'
  AND oi.sent_to_kitchen = TRUE
  AND oi.kitchen_status = 'archived'

UNION ALL

SELECT
  'SHOULD_BE_VISIBLE' as section,
  'kitchen_pending_inprogress_count' as info,
  COUNT(*)::text as value,
  'items with kitchen_status in (pending,in_progress)' as extra
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN categories c ON mi.category_id = c.id
JOIN orders o ON oi.order_id = o.id
WHERE c.station_type = 'kitchen'
  AND o.status = 'open'
  AND oi.sent_to_kitchen = TRUE
  AND COALESCE(oi.kitchen_status, 'pending') IN ('pending', 'in_progress');