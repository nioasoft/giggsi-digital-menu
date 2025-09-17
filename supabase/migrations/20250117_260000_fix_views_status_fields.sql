-- Fix the views to use the correct status fields
-- The issue is that we're updating kitchen_status/bar_status but the views might be checking different fields

-- First, let's see what the current view definitions are
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE viewname IN ('kitchen_orders', 'bar_orders');

-- Drop the existing views
DROP VIEW IF EXISTS kitchen_orders;
DROP VIEW IF EXISTS bar_orders;

-- Recreate kitchen_orders view with CORRECT status field
CREATE OR REPLACE VIEW kitchen_orders AS
SELECT
  oi.id,
  oi.order_id,
  oi.quantity,
  oi.notes,
  oi.addons,
  oi.batch_number,
  COALESCE(oi.kitchen_status, 'pending') as status,  -- Use kitchen_status, not a generic status
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
  AND COALESCE(oi.kitchen_status, 'pending') IN ('pending', 'in_progress');  -- Only pending and in_progress, NOT archived

-- Recreate bar_orders view with CORRECT status field
CREATE OR REPLACE VIEW bar_orders AS
SELECT
  oi.id,
  oi.order_id,
  oi.quantity,
  oi.notes,
  oi.addons,
  oi.batch_number,
  COALESCE(oi.bar_status, 'pending') as status,  -- Use bar_status, not a generic status
  oi.created_at,
  oi.sent_to_kitchen_at,
  oi.bar_started_at as started_at,
  oi.bar_ready_at as ready_at,
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
WHERE c.station_type = 'bar'
  AND o.status = 'open'
  AND oi.sent_to_kitchen = TRUE
  AND COALESCE(oi.bar_status, 'pending') IN ('pending', 'in_progress');  -- Only pending and in_progress, NOT archived

-- Grant access to views
GRANT SELECT ON kitchen_orders TO anon;
GRANT SELECT ON bar_orders TO anon;

-- Test query to verify the filtering works
SELECT
  'kitchen_view_test' as test_name,
  COUNT(*) as total_items,
  COUNT(CASE WHEN COALESCE(kitchen_status, 'pending') = 'archived' THEN 1 END) as archived_items,
  COUNT(CASE WHEN COALESCE(kitchen_status, 'pending') IN ('pending', 'in_progress') THEN 1 END) as visible_items
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN categories c ON mi.category_id = c.id
WHERE c.station_type = 'kitchen'
  AND oi.sent_to_kitchen = TRUE

UNION ALL

SELECT
  'bar_view_test' as test_name,
  COUNT(*) as total_items,
  COUNT(CASE WHEN COALESCE(bar_status, 'pending') = 'archived' THEN 1 END) as archived_items,
  COUNT(CASE WHEN COALESCE(bar_status, 'pending') IN ('pending', 'in_progress') THEN 1 END) as visible_items
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN categories c ON mi.category_id = c.id
WHERE c.station_type = 'bar'
  AND oi.sent_to_kitchen = TRUE;