-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE popups ENABLE ROW LEVEL SECURITY;

-- Categories policies
-- Public read access
CREATE POLICY "Categories are viewable by everyone" 
ON categories FOR SELECT 
USING (is_active = true);

-- Admin write access
CREATE POLICY "Categories are insertable by authenticated users" 
ON categories FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Categories are updatable by authenticated users" 
ON categories FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Categories are deletable by authenticated users" 
ON categories FOR DELETE 
TO authenticated
USING (true);

-- Menu items policies
-- Public read access
CREATE POLICY "Menu items are viewable by everyone" 
ON menu_items FOR SELECT 
USING (is_available = true);

-- Admin write access
CREATE POLICY "Menu items are insertable by authenticated users" 
ON menu_items FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Menu items are updatable by authenticated users" 
ON menu_items FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Menu items are deletable by authenticated users" 
ON menu_items FOR DELETE 
TO authenticated
USING (true);

-- Add-ons policies
-- Public read access
CREATE POLICY "Add-ons are viewable by everyone" 
ON add_ons FOR SELECT 
USING (is_available = true);

-- Admin write access
CREATE POLICY "Add-ons are insertable by authenticated users" 
ON add_ons FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Add-ons are updatable by authenticated users" 
ON add_ons FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Add-ons are deletable by authenticated users" 
ON add_ons FOR DELETE 
TO authenticated
USING (true);

-- Restaurant info policies
-- Public read access
CREATE POLICY "Restaurant info is viewable by everyone" 
ON restaurant_info FOR SELECT 
USING (true);

-- Admin write access
CREATE POLICY "Restaurant info is updatable by authenticated users" 
ON restaurant_info FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Popups policies
-- Public read access for active popups
CREATE POLICY "Active popups are viewable by everyone" 
ON popups FOR SELECT 
USING (
    is_active = true 
    AND (display_from IS NULL OR display_from <= NOW())
    AND (display_until IS NULL OR display_until >= NOW())
);

-- Admin full access
CREATE POLICY "Popups are manageable by authenticated users" 
ON popups FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('menu-images', 'menu-images', true),
    ('category-images', 'category-images', true),
    ('restaurant', 'restaurant', true);

-- Storage policies
CREATE POLICY "Images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('menu-images', 'category-images', 'restaurant'));

CREATE POLICY "Authenticated users can upload images" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id IN ('menu-images', 'category-images', 'restaurant'));

CREATE POLICY "Authenticated users can update images" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id IN ('menu-images', 'category-images', 'restaurant'))
WITH CHECK (bucket_id IN ('menu-images', 'category-images', 'restaurant'));

CREATE POLICY "Authenticated users can delete images" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id IN ('menu-images', 'category-images', 'restaurant'));