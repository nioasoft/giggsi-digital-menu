-- תיקון דחוף - העברת בירות וכל המשקאות לבר
-- הרץ את זה מיד בSupabase SQL Editor!

-- שלב 1: הצג את כל הקטגוריות של בירות ומשקאות
SELECT 'בדיקה ראשונית - קטגוריות בירות ומשקאות:' as info;
SELECT id, name_he, name_en, station_type
FROM categories
WHERE name_he LIKE '%ביר%'
   OR name_he LIKE '%בירה%'
   OR name_he LIKE '%בירות%'
   OR name_he LIKE '%חבית%'
   OR name_he LIKE '%משקה%'
   OR name_he LIKE '%שתי%'
   OR name_he LIKE '%יין%'
   OR name_he LIKE '%אלכוהול%'
   OR name_en ILIKE '%beer%'
   OR name_en ILIKE '%draft%'
   OR name_en ILIKE '%drink%'
   OR name_en ILIKE '%beverage%'
ORDER BY name_he;

-- שלב 2: עדכן את כל קטגוריות הבירות לבר
UPDATE categories
SET station_type = 'bar'
WHERE (name_he LIKE '%ביר%'
   OR name_he LIKE '%בירה%'
   OR name_he LIKE '%בירות%'
   OR name_he LIKE '%חבית%'
   OR name_en ILIKE '%beer%'
   OR name_en ILIKE '%draft%'
   OR name_en ILIKE '%tap%')
   AND (station_type IS NULL OR station_type != 'bar');

-- שלב 3: עדכן משקאות נוספים לבר
UPDATE categories
SET station_type = 'bar'
WHERE (name_he LIKE '%משקה%'
   OR name_he LIKE '%שתי%'
   OR name_he LIKE '%יין%'
   OR name_he LIKE '%וויסקי%'
   OR name_he LIKE '%וודקה%'
   OR name_he LIKE '%קוקטייל%'
   OR name_he LIKE '%אלכוהול%'
   OR name_he LIKE '%ליקר%'
   OR name_he LIKE '%ערק%'
   OR name_he LIKE '%ג''ין%'
   OR name_he LIKE '%רום%'
   OR name_en ILIKE '%drink%'
   OR name_en ILIKE '%beverage%'
   OR name_en ILIKE '%wine%'
   OR name_en ILIKE '%whisky%'
   OR name_en ILIKE '%vodka%'
   OR name_en ILIKE '%cocktail%'
   OR name_en ILIKE '%alcohol%'
   OR name_en ILIKE '%liquor%'
   OR name_en ILIKE '%gin%'
   OR name_en ILIKE '%rum%')
   AND (station_type IS NULL OR station_type != 'bar');

-- שלב 4: וודא שכל השאר זה מטבח
UPDATE categories
SET station_type = 'kitchen'
WHERE station_type IS NULL;

-- שלב 5: מחק את ה-Views הקיימים
DROP VIEW IF EXISTS kitchen_orders CASCADE;
DROP VIEW IF EXISTS bar_orders CASCADE;

-- שלב 6: צור מחדש את kitchen_orders עם הלוגיקה הנכונה
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
  AND c.station_type = 'kitchen'  -- רק פריטי מטבח!
  AND COALESCE(oi.kitchen_status, 'pending') IN ('pending', 'in_progress');

-- שלב 7: צור מחדש את bar_orders עם הלוגיקה הנכונה
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
  AND c.station_type = 'bar'  -- רק פריטי בר!
  AND COALESCE(oi.bar_status, 'pending') IN ('pending', 'in_progress');

-- שלב 8: תן הרשאות
GRANT SELECT ON kitchen_orders TO anon;
GRANT SELECT ON bar_orders TO anon;

-- שלב 9: בדוק את התוצאות
SELECT 'בדיקה סופית - קטגוריות לפי תחנה:' as info;
SELECT
  station_type,
  COUNT(*) as count,
  STRING_AGG(name_he, ', ' ORDER BY name_he) as categories
FROM categories
GROUP BY station_type
ORDER BY station_type;

-- שלב 10: בדוק שבירות עברו לבר
SELECT 'בדיקה - האם כל הבירות בבר?' as info;
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ מצוין! אין בירות במטבח'
    ELSE '⚠️ בעיה! עדיין יש בירות במטבח'
  END as status,
  COUNT(*) as beer_categories_in_kitchen
FROM categories
WHERE station_type = 'kitchen'
  AND (name_he LIKE '%ביר%'
    OR name_he LIKE '%בירה%'
    OR name_he LIKE '%בירות%'
    OR name_he LIKE '%חבית%'
    OR name_en ILIKE '%beer%'
    OR name_en ILIKE '%draft%');

-- שלב 11: הצג את כל קטגוריות הבר
SELECT 'כל קטגוריות הבר:' as info;
SELECT id, name_he, name_en
FROM categories
WHERE station_type = 'bar'
ORDER BY name_he;

-- הודעת הצלחה
SELECT
  '🎉 הושלם!' as status,
  'בירות וכל המשקאות הועברו לבר' as message,
  'ה-Views עודכנו להשתמש ב-station_type' as details;