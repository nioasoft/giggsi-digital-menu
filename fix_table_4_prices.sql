-- Fix prices for table 4 items that were added during the outage
-- Run this in Supabase SQL Editor

-- Step 1: Find and show the current state
SELECT
  t.table_number,
  o.id as order_id,
  o.subtotal,
  o.total_amount,
  COUNT(oi.id) as item_count,
  SUM(oi.total_price) as calculated_subtotal,
  COUNT(CASE WHEN oi.total_price IS NULL OR oi.total_price = 0 THEN 1 END) as items_without_price
FROM orders o
JOIN tables t ON o.table_id = t.id
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE t.table_number = 4
  AND o.status = 'open'
GROUP BY t.table_number, o.id, o.subtotal, o.total_amount;

-- Step 2: Fix items with missing prices
WITH table_order AS (
  SELECT o.id as order_id
  FROM orders o
  JOIN tables t ON o.table_id = t.id
  WHERE t.table_number = 4
    AND o.status = 'open'
  LIMIT 1
)
UPDATE order_items oi
SET
  unit_price = CASE
    WHEN oi.unit_price IS NULL OR oi.unit_price = 0
    THEN mi.price
    ELSE oi.unit_price
  END,
  total_price = CASE
    WHEN oi.total_price IS NULL OR oi.total_price = 0
    THEN mi.price * oi.quantity
    ELSE oi.total_price
  END
FROM menu_items mi, table_order
WHERE oi.menu_item_id = mi.id
  AND oi.order_id = table_order.order_id
  AND (oi.unit_price IS NULL OR oi.unit_price = 0 OR oi.total_price IS NULL OR oi.total_price = 0);

-- Step 3: Recalculate order totals
WITH order_totals AS (
  SELECT
    o.id,
    SUM(oi.total_price) as new_subtotal
  FROM orders o
  JOIN tables t ON o.table_id = t.id
  JOIN order_items oi ON oi.order_id = o.id
  WHERE t.table_number = 4
    AND o.status = 'open'
  GROUP BY o.id
)
UPDATE orders
SET
  subtotal = order_totals.new_subtotal,
  service_charge = order_totals.new_subtotal * 0.125,
  total_amount = order_totals.new_subtotal * 1.125
FROM order_totals
WHERE orders.id = order_totals.id;

-- Step 4: Show the fixed result
SELECT
  t.table_number,
  o.id as order_id,
  o.subtotal,
  o.service_charge,
  o.total_amount,
  COUNT(oi.id) as item_count,
  SUM(oi.total_price) as calculated_subtotal
FROM orders o
JOIN tables t ON o.table_id = t.id
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE t.table_number = 4
  AND o.status = 'open'
GROUP BY t.table_number, o.id, o.subtotal, o.service_charge, o.total_amount;