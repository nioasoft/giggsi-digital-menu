-- Add sent_to_kitchen columns to track when items are sent to kitchen/bar
ALTER TABLE order_items
ADD COLUMN sent_to_kitchen BOOLEAN DEFAULT FALSE,
ADD COLUMN sent_to_kitchen_at TIMESTAMP;

-- Update all existing order items to be "sent" to avoid breaking existing orders
UPDATE order_items
SET sent_to_kitchen = TRUE,
    sent_to_kitchen_at = COALESCE(created_at, NOW())
WHERE sent_to_kitchen IS NULL;

-- Drop existing views
DROP VIEW IF EXISTS kitchen_orders;
DROP VIEW IF EXISTS bar_orders;

-- Recreate kitchen_orders view to only show sent items
CREATE OR REPLACE VIEW kitchen_orders AS
SELECT
  oi.id,
  oi.order_id,
  oi.quantity,
  oi.notes,
  oi.kitchen_status as status,
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
  AND oi.sent_to_kitchen = TRUE  -- Only show sent items
  AND oi.kitchen_status IN ('pending', 'in_progress');

-- Recreate bar_orders view to only show sent items
CREATE OR REPLACE VIEW bar_orders AS
SELECT
  oi.id,
  oi.order_id,
  oi.quantity,
  oi.notes,
  oi.bar_status as status,
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
  AND oi.sent_to_kitchen = TRUE  -- Only show sent items
  AND oi.bar_status IN ('pending', 'in_progress');

-- Create index for better performance
CREATE INDEX idx_order_items_sent_to_kitchen ON order_items(sent_to_kitchen);

-- Grant access to views (re-grant after dropping/recreating)
GRANT SELECT ON kitchen_orders TO anon;
GRANT SELECT ON bar_orders TO anon;