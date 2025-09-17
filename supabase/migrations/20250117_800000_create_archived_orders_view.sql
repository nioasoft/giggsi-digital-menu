-- Create view for archived kitchen orders to bypass RLS issues
-- This view will allow anonymous access to archived orders

-- Drop the view if it exists
DROP VIEW IF EXISTS archived_kitchen_orders CASCADE;

-- Create view for archived kitchen orders
CREATE VIEW archived_kitchen_orders AS
SELECT
  oi.id,
  oi.order_id,
  oi.quantity,
  oi.notes,
  oi.addons,
  oi.batch_number,
  oi.cooking_preference,
  'archived' as status,
  oi.created_at,
  oi.sent_to_kitchen_at,
  oi.kitchen_started_at as started_at,
  oi.kitchen_ready_at as ready_at,
  COALESCE(mi.name_he, 'פריט נמחק') as item_name,
  '' as item_name_en,
  COALESCE(t.table_number, 0) as table_number,
  wu.name as waiter_name
FROM order_items oi
LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
LEFT JOIN orders o ON oi.order_id = o.id
LEFT JOIN tables t ON o.table_id = t.id
LEFT JOIN waiter_users wu ON o.waiter_id = wu.id
WHERE oi.kitchen_status = 'archived'
  AND oi.kitchen_ready_at IS NOT NULL;

-- Grant access to anonymous users
GRANT SELECT ON archived_kitchen_orders TO anon;

-- Verify the view was created
SELECT
  'VIEW_CREATED' as status,
  'archived_kitchen_orders view created successfully' as message;