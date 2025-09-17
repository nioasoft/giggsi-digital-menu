-- Compare IDs between kitchen_orders view and actual order_items table
-- This will help us identify why the update fails

-- 1. Show what the kitchen_orders view returns
SELECT
  'KITCHEN_VIEW_DATA' as source,
  id as item_id,
  order_id,
  table_number,
  item_name,
  status,
  batch_number
FROM kitchen_orders
ORDER BY created_at DESC;

-- 2. Show what actually exists in order_items table
SELECT
  'ORDER_ITEMS_TABLE' as source,
  oi.id as item_id,
  oi.order_id,
  t.table_number,
  mi.name_he as item_name,
  COALESCE(oi.kitchen_status, 'pending') as status,
  oi.batch_number
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN categories c ON mi.category_id = c.id
JOIN orders o ON oi.order_id = o.id
JOIN tables t ON o.table_id = t.id
WHERE c.station_type = 'kitchen'
  AND o.status = 'open'
  AND oi.sent_to_kitchen = TRUE
ORDER BY oi.created_at DESC;

-- 3. Check specifically for the failing ID
SELECT
  'SPECIFIC_ID_CHECK' as test,
  'Checking ID: 4ea90379-3894-45fa-9a5b-007ad5690537' as info,
  CASE
    WHEN EXISTS (SELECT 1 FROM order_items WHERE id = '4ea90379-3894-45fa-9a5b-007ad5690537')
    THEN 'EXISTS in order_items'
    ELSE 'NOT FOUND in order_items'
  END as in_table,
  CASE
    WHEN EXISTS (SELECT 1 FROM kitchen_orders WHERE id = '4ea90379-3894-45fa-9a5b-007ad5690537')
    THEN 'EXISTS in kitchen_orders view'
    ELSE 'NOT FOUND in kitchen_orders view'
  END as in_view;

-- 4. Show IDs that are in view but NOT in table (this is the problem!)
SELECT
  'VIEW_WITHOUT_TABLE' as issue_type,
  kv.id as view_id,
  'This ID is in view but not in table!' as problem
FROM kitchen_orders kv
WHERE NOT EXISTS (
  SELECT 1 FROM order_items oi WHERE oi.id = kv.id
);

-- 5. Show IDs that are in table but NOT in view
SELECT
  'TABLE_WITHOUT_VIEW' as issue_type,
  oi.id as table_id,
  'This ID is in table but not in view!' as problem
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN categories c ON mi.category_id = c.id
JOIN orders o ON oi.order_id = o.id
WHERE c.station_type = 'kitchen'
  AND o.status = 'open'
  AND oi.sent_to_kitchen = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM kitchen_orders kv WHERE kv.id = oi.id
  );

-- 6. Count mismatches
SELECT
  'SUMMARY' as section,
  (SELECT COUNT(*) FROM kitchen_orders) as view_count,
  (SELECT COUNT(*) FROM order_items oi
   JOIN menu_items mi ON oi.menu_item_id = mi.id
   JOIN categories c ON mi.category_id = c.id
   JOIN orders o ON oi.order_id = o.id
   WHERE c.station_type = 'kitchen'
     AND o.status = 'open'
     AND oi.sent_to_kitchen = TRUE) as table_count,
  'Counts should match' as note;