-- Create order_logs table for tracking all order completions
CREATE TABLE IF NOT EXISTS order_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number INTEGER NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  waiter_id UUID REFERENCES waiter_users(id) ON DELETE SET NULL,
  waiter_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'paid', -- 'paid', 'cancelled', 'closed'
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_order_logs_created_at ON order_logs(created_at);
CREATE INDEX idx_order_logs_table_number ON order_logs(table_number);
CREATE INDEX idx_order_logs_status ON order_logs(status);

-- Enable Row Level Security
ALTER TABLE order_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admin users to view all logs
CREATE POLICY "Admin users can view all order logs" ON order_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.email()
      AND admin_users.is_active = true
    )
  );

-- Policy for waiters to view their own logs
CREATE POLICY "Waiters can view their own order logs" ON order_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = waiter_id
  );

-- Policy for system to insert logs
CREATE POLICY "System can insert order logs" ON order_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create view for order summary statistics
CREATE OR REPLACE VIEW order_logs_summary AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
  SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_revenue,
  COUNT(DISTINCT table_number) as unique_tables
FROM order_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Grant access to the view
GRANT SELECT ON order_logs_summary TO authenticated;