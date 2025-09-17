-- Add batch_number to order_items for separating multiple sends to kitchen
-- This allows multiple "batches" of items from the same order to appear as separate cards

-- Add batch_number column
ALTER TABLE order_items ADD COLUMN batch_number INTEGER DEFAULT 1;

-- Update existing items to have batch_number = 1
UPDATE order_items SET batch_number = 1 WHERE batch_number IS NULL;

-- Set NOT NULL constraint
ALTER TABLE order_items ALTER COLUMN batch_number SET NOT NULL;