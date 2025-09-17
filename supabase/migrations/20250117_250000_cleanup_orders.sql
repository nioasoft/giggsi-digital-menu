-- Cleanup script: Delete all existing orders and related data
-- This will give us a clean slate to test the batch system

-- Step 1: Delete all order items (cascades will handle most relationships)
DELETE FROM order_items;

-- Step 2: Delete all orders
DELETE FROM orders;

-- Step 3: Reset table statuses to available
UPDATE tables SET
  status = 'available',
  current_order_id = NULL;

-- Step 4: Clean up any orphaned data in logs (optional)
-- DELETE FROM order_logs;

-- Verification queries to check cleanup
SELECT 'order_items_count' as table_name, COUNT(*) as count FROM order_items
UNION ALL
SELECT 'orders_count' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'occupied_tables_count' as table_name, COUNT(*) as count FROM tables WHERE status != 'available';

-- Also let's check the current view definitions to see if they're correct
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE viewname IN ('kitchen_orders', 'bar_orders');