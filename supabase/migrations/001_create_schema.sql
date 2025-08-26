-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table for menu categories
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name_he TEXT NOT NULL,
    name_en TEXT,
    name_ar TEXT,
    name_ru TEXT,
    description_he TEXT,
    description_en TEXT,
    description_ar TEXT,
    description_ru TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Menu items table
CREATE TABLE menu_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name_he TEXT NOT NULL,
    name_en TEXT,
    name_ar TEXT,
    name_ru TEXT,
    description_he TEXT,
    description_en TEXT,
    description_ar TEXT,
    description_ru TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    allergens TEXT[] DEFAULT '{}',
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add-ons table for menu item additions
CREATE TABLE add_ons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    name_he TEXT NOT NULL,
    name_en TEXT,
    name_ar TEXT,
    name_ru TEXT,
    price DECIMAL(10, 2) DEFAULT 0,
    type TEXT CHECK (type IN ('sauce', 'side', 'topping', 'extra')),
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Restaurant info table
CREATE TABLE restaurant_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    phone TEXT,
    address TEXT,
    hours_he TEXT,
    hours_en TEXT,
    hours_ar TEXT,
    hours_ru TEXT,
    description_he TEXT,
    description_en TEXT,
    description_ar TEXT,
    description_ru TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Popups table for promotional content
CREATE TABLE popups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title_he TEXT NOT NULL,
    title_en TEXT,
    title_ar TEXT,
    title_ru TEXT,
    content_he TEXT NOT NULL,
    content_en TEXT,
    content_ar TEXT,
    content_ru TEXT,
    type TEXT CHECK (type IN ('site_wide', 'category_specific', 'banner')),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    display_from TIMESTAMP WITH TIME ZONE,
    display_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_display_order ON categories(display_order);
CREATE INDEX idx_menu_items_display_order ON menu_items(display_order);
CREATE INDEX idx_add_ons_menu_item_id ON add_ons(menu_item_id);
CREATE INDEX idx_popups_is_active ON popups(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_add_ons_updated_at BEFORE UPDATE ON add_ons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_info_updated_at BEFORE UPDATE ON restaurant_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_popups_updated_at BEFORE UPDATE ON popups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default restaurant info
INSERT INTO restaurant_info (
    name,
    description_he,
    description_en,
    description_ar,
    description_ru
) VALUES (
    'Giggsi Sports Bar',
    'בר ספורט מודרני עם 50 מסכי Ultra HD',
    'Modern sports bar with 50 Ultra HD screens',
    'بار رياضي حديث مع 50 شاشة Ultra HD',
    'Современный спорт-бар с 50 экранами Ultra HD'
);