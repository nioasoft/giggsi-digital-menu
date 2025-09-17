-- Fix kitchen and bar views to use station_type instead of name-based filtering
-- This ensures beers and drinks go to bar, food goes to kitchen

-- First, ensure all categories have correct station_type
-- Update beer categories to bar
UPDATE categories
SET station_type = 'bar'
WHERE (name_he LIKE '%ביר%'
   OR name_he LIKE '%בירה%'
   OR name_he LIKE '%חבית%'
   OR name_en ILIKE '%beer%'
   OR name_en ILIKE '%draft%')
   AND (station_type IS NULL OR station_type != 'bar');

-- Update drink categories to bar
UPDATE categories
SET station_type = 'bar'
WHERE (name_he LIKE '%משקה%'
   OR name_he LIKE '%שתי%'
   OR name_he LIKE '%יין%'
   OR name_he LIKE '%וויסקי%'
   OR name_he LIKE '%וודקה%'
   OR name_he LIKE '%קוקטייל%'
   OR name_en ILIKE '%drink%'
   OR name_en ILIKE '%beverage%'
   OR name_en ILIKE '%wine%'
   OR name_en ILIKE '%whisky%'
   OR name_en ILIKE '%vodka%'
   OR name_en ILIKE '%cocktail%')
   AND (station_type IS NULL OR station_type != 'bar');

-- Set default station_type to kitchen for remaining categories
UPDATE categories
SET station_type = 'kitchen'
WHERE station_type IS NULL;

-- Drop existing views
DROP VIEW IF EXISTS kitchen_orders CASCADE;
DROP VIEW IF EXISTS bar_orders CASCADE;

-- Recreate kitchen_orders view using station_type
CREATE VIEW kitchen_orders AS
SELECT DISTINCT
  oi.id,
  oi.order_id,
  oi.quantity,
  oi.notes,
  oi.addons,
  oi.sent_to_kitchen_at,
  oi.created_at,
  oi.batch_number,
  oi.cooking_preference,
  mi.name_he as item_name,
  mi.name_en as item_name_en,
  t.table_number,
  wu.name as waiter_name,
  COALESCE(oi.kitchen_status, 'pending') as status,
  oi.kitchen_started_at as started_at,
  oi.kitchen_ready_at as ready_at
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN tables t ON o.table_id = t.id
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN categories c ON mi.category_id = c.id
LEFT JOIN waiter_users wu ON o.waiter_id = wu.id
WHERE
  oi.sent_to_kitchen = true
  AND o.status = 'open'
  AND c.station_type = 'kitchen'  -- Use station_type
  AND COALESCE(oi.kitchen_status, 'pending') IN ('pending', 'in_progress');

-- Recreate bar_orders view using station_type
CREATE VIEW bar_orders AS
SELECT DISTINCT
  oi.id,
  oi.order_id,
  oi.quantity,
  oi.notes,
  oi.addons,
  oi.sent_to_kitchen_at,
  oi.created_at,
  oi.batch_number,
  oi.cooking_preference,
  mi.name_he as item_name,
  mi.name_en as item_name_en,
  t.table_number,
  wu.name as waiter_name,
  COALESCE(oi.bar_status, 'pending') as status,
  oi.bar_started_at as started_at,
  oi.bar_ready_at as ready_at
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN tables t ON o.table_id = t.id
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN categories c ON mi.category_id = c.id
LEFT JOIN waiter_users wu ON o.waiter_id = wu.id
WHERE
  oi.sent_to_kitchen = true
  AND o.status = 'open'
  AND c.station_type = 'bar'  -- Use station_type
  AND COALESCE(oi.bar_status, 'pending') IN ('pending', 'in_progress');

-- Grant permissions
GRANT SELECT ON kitchen_orders TO anon;
GRANT SELECT ON bar_orders TO anon;

-- Verify category assignments
SELECT
  'Categories by station' as report,
  station_type,
  COUNT(*) as category_count,
  STRING_AGG(name_he, ', ' ORDER BY name_he) as categories
FROM categories
GROUP BY station_type
ORDER BY station_type;

-- Success message
SELECT
  'VIEWS_FIXED' as status,
  'Kitchen and bar views now use station_type correctly' as message,
  'Beers and drinks will go to bar, food will go to kitchen' as details;