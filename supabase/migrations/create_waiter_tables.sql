-- Create waiter_users table for waiter authentication
CREATE TABLE IF NOT EXISTS waiter_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES admin_users(id)
);

-- Create tables table for restaurant tables
CREATE TABLE IF NOT EXISTS tables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
  current_order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES tables(id),
  waiter_id UUID NOT NULL REFERENCES waiter_users(id),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  subtotal DECIMAL(10, 2) DEFAULT 0,
  service_charge DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  paid BOOLEAN DEFAULT false,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  addons JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to tables for current_order_id
ALTER TABLE tables
ADD CONSTRAINT fk_current_order
FOREIGN KEY (current_order_id)
REFERENCES orders(id)
ON DELETE SET NULL;

-- Insert predefined tables
INSERT INTO tables (table_number, status) VALUES
-- Tables 1-19
(1, 'available'), (2, 'available'), (3, 'available'), (4, 'available'), (5, 'available'),
(6, 'available'), (7, 'available'), (8, 'available'), (9, 'available'), (10, 'available'),
(11, 'available'), (12, 'available'), (13, 'available'), (14, 'available'), (15, 'available'),
(16, 'available'), (17, 'available'), (18, 'available'), (19, 'available'),
-- Tables 100-104
(100, 'available'), (101, 'available'), (102, 'available'), (103, 'available'), (104, 'available'),
-- Tables 200-204
(200, 'available'), (201, 'available'), (202, 'available'), (203, 'available'), (204, 'available'),
-- Tables 300-304
(300, 'available'), (301, 'available'), (302, 'available'), (303, 'available'), (304, 'available'),
-- Tables 400-404
(400, 'available'), (401, 'available'), (402, 'available'), (403, 'available'), (404, 'available'),
-- Tables 500-504
(500, 'available'), (501, 'available'), (502, 'available'), (503, 'available'), (504, 'available'),
-- Tables 512-513
(512, 'available'), (513, 'available'),
-- Tables 900-920
(900, 'available'), (901, 'available'), (902, 'available'), (903, 'available'), (904, 'available'),
(905, 'available'), (906, 'available'), (907, 'available'), (908, 'available'), (909, 'available'),
(910, 'available'), (911, 'available'), (912, 'available'), (913, 'available'), (914, 'available'),
(915, 'available'), (916, 'available'), (917, 'available'), (918, 'available'), (919, 'available'),
(920, 'available')
ON CONFLICT (table_number) DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_waiter_users_email ON waiter_users(email);
CREATE INDEX idx_waiter_users_active ON waiter_users(is_active);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_number ON tables(table_number);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_waiter_id ON orders(waiter_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_waiter_users_updated_at BEFORE UPDATE ON waiter_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE waiter_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies for waiter_users
CREATE POLICY "Admin can manage waiters" ON waiter_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Waiters can view their own profile" ON waiter_users
  FOR SELECT USING (
    email = auth.jwt() ->> 'email'
  );

-- Policies for tables
CREATE POLICY "Anyone can view tables" ON tables
  FOR SELECT USING (true);

CREATE POLICY "Waiters can update tables" ON tables
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM waiter_users
      WHERE waiter_users.email = auth.jwt() ->> 'email'
      AND waiter_users.is_active = true
    )
  );

-- Policies for orders
CREATE POLICY "Waiters can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM waiter_users
      WHERE waiter_users.email = auth.jwt() ->> 'email'
      AND waiter_users.is_active = true
    )
  );

CREATE POLICY "Waiters can create orders" ON orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM waiter_users
      WHERE waiter_users.email = auth.jwt() ->> 'email'
      AND waiter_users.is_active = true
    )
  );

CREATE POLICY "Waiters can update their own orders" ON orders
  FOR UPDATE USING (
    waiter_id IN (
      SELECT id FROM waiter_users
      WHERE waiter_users.email = auth.jwt() ->> 'email'
    )
  );

-- Policies for order_items
CREATE POLICY "Waiters can view order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM waiter_users
      WHERE waiter_users.email = auth.jwt() ->> 'email'
      AND waiter_users.is_active = true
    )
  );

CREATE POLICY "Waiters can manage order items" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN waiter_users w ON o.waiter_id = w.id
      WHERE o.id = order_items.order_id
      AND w.email = auth.jwt() ->> 'email'
      AND w.is_active = true
    )
  );

-- Create view for order summary with items
CREATE VIEW order_summary AS
SELECT
  o.id,
  o.table_id,
  t.table_number,
  o.waiter_id,
  w.name as waiter_name,
  o.status,
  o.subtotal,
  o.service_charge,
  o.total_amount,
  o.paid,
  o.payment_method,
  o.notes,
  o.created_at,
  o.closed_at,
  COUNT(oi.id) as item_count
FROM orders o
JOIN tables t ON o.table_id = t.id
JOIN waiter_users w ON o.waiter_id = w.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, t.table_number, w.name;