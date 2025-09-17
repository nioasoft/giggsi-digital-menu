-- Fix kitchen/bar views to properly route beers and drinks to bar
-- Run this IMMEDIATELY in Supabase SQL Editor

-- Step 1: First, show current beer categories
SELECT id, name_he, name_en, station_type
FROM categories
WHERE name_he LIKE '%ביר%'
   OR name_he LIKE '%בירה%'
   OR name_he LIKE '%חבית%'
   OR name_en ILIKE '%beer%'
   OR name_en ILIKE '%draft%'
ORDER BY name_he;

-- Step 2: Update ALL beer-related categories to bar
UPDATE categories
SET station_type = 'bar'
WHERE (name_he LIKE '%ביר%'
   OR name_he LIKE '%בירה%'
   OR name_he LIKE '%חבית%'
   OR name_en ILIKE '%beer%'
   OR name_en ILIKE '%draft%'
   OR name_en ILIKE '%tap%')
   AND (station_type IS NULL OR station_type != 'bar');

-- Step 3: Update drink categories to bar
UPDATE categories
SET station_type = 'bar'
WHERE (name_he LIKE '%משקה%'
   OR name_he LIKE '%שתי%'
   OR name_he LIKE '%יין%'
   OR name_he LIKE '%וויסקי%'
   OR name_he LIKE '%וודקה%'
   OR name_he LIKE '%קוקטייל%'
   OR name_he LIKE '%אלכוהול%'
   OR name_en ILIKE '%drink%'
   OR name_en ILIKE '%beverage%'
   OR name_en ILIKE '%wine%'
   OR name_en ILIKE '%whisky%'
   OR name_en ILIKE '%vodka%'
   OR name_en ILIKE '%cocktail%'
   OR name_en ILIKE '%alcohol%')
   AND (station_type IS NULL OR station_type != 'bar');

-- Step 4: Set remaining NULL station_types to kitchen (default for food)
UPDATE categories
SET station_type = 'kitchen'
WHERE station_type IS NULL;

-- Step 5: Drop and recreate kitchen_orders view
DROP VIEW IF EXISTS kitchen_orders CASCADE;
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
WHERE oi.sent_to_kitchen = true
  AND o.status = 'open'
  AND c.station_type = 'kitchen'
  AND COALESCE(oi.kitchen_status, 'pending') IN ('pending', 'in_progress');

-- Step 6: Drop and recreate bar_orders view
DROP VIEW IF EXISTS bar_orders CASCADE;
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
WHERE oi.sent_to_kitchen = true
  AND o.status = 'open'
  AND c.station_type = 'bar'
  AND COALESCE(oi.bar_status, 'pending') IN ('pending', 'in_progress');

-- Step 7: Grant permissions
GRANT SELECT ON kitchen_orders TO anon;
GRANT SELECT ON bar_orders TO anon;

-- Step 8: Verify the results
SELECT
  'Beer Categories' as check_type,
  station_type,
  COUNT(*) as count,
  STRING_AGG(name_he, ', ' ORDER BY name_he) as categories
FROM categories
WHERE name_he LIKE '%ביר%'
   OR name_he LIKE '%חבית%'
   OR name_en ILIKE '%beer%'
   OR name_en ILIKE '%draft%'
GROUP BY station_type

UNION ALL

SELECT
  'All Categories' as check_type,
  station_type,
  COUNT(*) as count,
  STRING_AGG(name_he, ', ' ORDER BY name_he) as categories
FROM categories
GROUP BY station_type
ORDER BY check_type, station_type;

-- Step 9: Show success message
SELECT
  'SUCCESS' as status,
  'Beer categories moved to bar station' as message,
  'Kitchen and bar views are now using station_type correctly' as details;