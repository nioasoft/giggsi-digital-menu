-- Add cooking preferences support for grill and burger items

-- 1. Add cooking_preference to order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS cooking_preference VARCHAR(10);

-- Add check constraint for valid values
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS valid_cooking_preference;

ALTER TABLE order_items
ADD CONSTRAINT valid_cooking_preference
CHECK (cooking_preference IN ('M', 'MW', 'WD') OR cooking_preference IS NULL);

-- 2. Add requires_cooking_preference to categories
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS requires_cooking_preference BOOLEAN DEFAULT FALSE;

-- 3. Update specific categories to require cooking preference
-- Update by Hebrew names for grill, burgers, and burger selection
UPDATE categories
SET requires_cooking_preference = true
WHERE name_he IN ('הגריל', 'המבורגרים', 'נבחרת ההמבורגרים', 'גריל', 'המבורגר', 'בורגרים', 'המבורגרים של הבית');

-- 4. Drop and recreate kitchen_orders view with cooking_preference
DROP VIEW IF EXISTS kitchen_orders;
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
  oi.cooking_preference,  -- Add cooking preference
  mi.name_he as item_name,
  t.table_number,
  COALESCE(oi.kitchen_status, 'pending') as status
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN tables t ON o.table_id = t.id
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN categories c ON mi.category_id = c.id
WHERE
  oi.sent_to_kitchen = true
  AND o.status = 'open'
  -- Consider all items for kitchen (no is_kitchen_item filter)
  AND c.name_he NOT LIKE '%משקה%'  -- Exclude drinks
  AND c.name_he NOT LIKE '%שתי%'   -- Exclude beverages
  AND COALESCE(oi.kitchen_status, 'pending') IN ('pending', 'in_progress');

-- 5. Drop and recreate bar_orders view (in case any items need cooking preference)
DROP VIEW IF EXISTS bar_orders;
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
  oi.cooking_preference,  -- Add cooking preference
  mi.name_he as item_name,
  t.table_number,
  COALESCE(oi.bar_status, 'pending') as status
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN tables t ON o.table_id = t.id
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN categories c ON mi.category_id = c.id
WHERE
  oi.sent_to_kitchen = true
  AND o.status = 'open'
  -- Show drinks and beverages in bar
  AND (c.name_he LIKE '%משקה%' OR c.name_he LIKE '%שתי%')
  AND COALESCE(oi.bar_status, 'pending') IN ('pending', 'in_progress');

-- 6. Check which categories exist and their current settings
SELECT
  id,
  name_he,
  name_en,
  requires_cooking_preference
FROM categories
WHERE name_he LIKE '%גריל%'
   OR name_he LIKE '%בורגר%'
   OR name_he LIKE '%המבורגר%'
ORDER BY name_he;