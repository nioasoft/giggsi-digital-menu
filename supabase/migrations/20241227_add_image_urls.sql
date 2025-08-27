-- Add image_urls JSONB column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '{}';

-- Add image_urls JSONB column to menu_items table
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '{}';

-- Migrate existing image_url data to new structure
UPDATE categories 
SET image_urls = jsonb_build_object('medium', image_url)
WHERE image_url IS NOT NULL AND image_urls = '{}';

UPDATE menu_items
SET image_urls = jsonb_build_object('medium', image_url)
WHERE image_url IS NOT NULL AND image_urls = '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_image_urls ON categories USING GIN (image_urls);
CREATE INDEX IF NOT EXISTS idx_menu_items_image_urls ON menu_items USING GIN (image_urls);

-- Add comments for documentation
COMMENT ON COLUMN categories.image_urls IS 'JSON object containing URLs for different image sizes: {original, small, medium, large}';
COMMENT ON COLUMN menu_items.image_urls IS 'JSON object containing URLs for different image sizes: {original, small, medium, large}';