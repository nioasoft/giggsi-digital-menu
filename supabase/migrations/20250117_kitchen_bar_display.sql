-- Add station type to categories to determine kitchen vs bar
ALTER TABLE categories
ADD COLUMN station_type VARCHAR(20) DEFAULT 'kitchen';

-- Update existing categories based on their type
UPDATE categories
SET station_type = CASE
  -- Bar categories
  WHEN name_he IN ('שתייה קלה', 'בירות מהחבית', 'שייקים', 'בירות בבקבוק', 'קוקטיילים', 'יין', 'מבעבעים') THEN 'bar'
  WHEN name_en IN ('Soft Drinks', 'Draft Beer', 'Shakes', 'Bottled Beer', 'Cocktails', 'Wine', 'Sparkling') THEN 'bar'
  -- Everything else goes to kitchen
  ELSE 'kitchen'
END;

-- Add display status columns to order_items
ALTER TABLE order_items
ADD COLUMN kitchen_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN bar_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN kitchen_started_at TIMESTAMP,
ADD COLUMN kitchen_ready_at TIMESTAMP,
ADD COLUMN bar_started_at TIMESTAMP,
ADD COLUMN bar_ready_at TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX idx_order_items_kitchen_status ON order_items(kitchen_status);
CREATE INDEX idx_order_items_bar_status ON order_items(bar_status);
CREATE INDEX idx_categories_station_type ON categories(station_type);

-- Create a view for kitchen orders
CREATE OR REPLACE VIEW kitchen_orders AS
SELECT
  oi.id,
  oi.order_id,
  oi.quantity,
  oi.notes,
  oi.kitchen_status as status,
  oi.created_at,
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
  AND oi.kitchen_status IN ('pending', 'in_progress');

-- Create a view for bar orders
CREATE OR REPLACE VIEW bar_orders AS
SELECT
  oi.id,
  oi.order_id,
  oi.quantity,
  oi.notes,
  oi.bar_status as status,
  oi.created_at,
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
  AND oi.bar_status IN ('pending', 'in_progress');

-- Enable RLS for the views
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policy for kitchen/bar displays to read orders
CREATE POLICY "Kitchen and bar displays can read all orders" ON order_items
  FOR SELECT
  TO anon
  USING (true);

-- Grant access to views
GRANT SELECT ON kitchen_orders TO anon;
GRANT SELECT ON bar_orders TO anon;