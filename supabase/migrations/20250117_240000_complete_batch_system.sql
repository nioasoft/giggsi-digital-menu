-- Complete batch system implementation with fresh timestamp
-- This migration adds batch_number column and recreates views

-- First, add the batch_number column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'order_items' AND column_name = 'batch_number'
    ) THEN
        ALTER TABLE order_items ADD COLUMN batch_number INTEGER DEFAULT 1;
        UPDATE order_items SET batch_number = 1 WHERE batch_number IS NULL;
        ALTER TABLE order_items ALTER COLUMN batch_number SET NOT NULL;
    END IF;
END $$;

-- Drop existing views to avoid conflicts
DROP VIEW IF EXISTS kitchen_orders;
DROP VIEW IF EXISTS bar_orders;

-- Recreate kitchen_orders view with batch support and correct filtering
CREATE OR REPLACE VIEW kitchen_orders AS
SELECT
  oi.id,
  oi.order_id,
  oi.quantity,
  oi.notes,
  oi.addons,
  oi.batch_number,
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
  AND oi.sent_to_kitchen = TRUE
  AND COALESCE(oi.kitchen_status, 'pending') IN ('pending', 'in_progress');

-- Recreate bar_orders view with batch support and correct filtering
CREATE OR REPLACE VIEW bar_orders AS
SELECT
  oi.id,
  oi.order_id,
  oi.quantity,
  oi.notes,
  oi.addons,
  oi.batch_number,
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
  AND oi.sent_to_kitchen = TRUE
  AND COALESCE(oi.bar_status, 'pending') IN ('pending', 'in_progress');

-- Grant access to views
GRANT SELECT ON kitchen_orders TO anon;
GRANT SELECT ON bar_orders TO anon;

-- Verify the migration worked
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
AND column_name = 'batch_number';