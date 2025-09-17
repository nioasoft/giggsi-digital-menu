-- Fix beer categories to show in bar instead of kitchen
-- Run this in Supabase SQL Editor

-- Step 1: Check current beer categories
SELECT id, name_he, name_en, station_type
FROM categories
WHERE name_he LIKE '%ביר%'
   OR name_he LIKE '%בירה%'
   OR name_he LIKE '%חבית%'
   OR name_en ILIKE '%beer%'
   OR name_en ILIKE '%draft%'
ORDER BY name_he;

-- Step 2: Update all beer categories to bar station
UPDATE categories
SET station_type = 'bar'
WHERE (name_he LIKE '%ביר%'
   OR name_he LIKE '%בירה%'
   OR name_he LIKE '%חבית%'
   OR name_en ILIKE '%beer%'
   OR name_en ILIKE '%draft%')
   AND (station_type IS NULL OR station_type != 'bar');

-- Step 3: Also update any drink categories
UPDATE categories
SET station_type = 'bar'
WHERE (name_he LIKE '%משקה%'
   OR name_he LIKE '%שתי%'
   OR name_he LIKE '%יין%'
   OR name_he LIKE '%וויסקי%'
   OR name_he LIKE '%וודקה%'
   OR name_he LIKE '%קוקטייל%'
   OR name_en ILIKE '%drink%'
   OR name_en ILIKE '%beverage%'
   OR name_en ILIKE '%wine%'
   OR name_en ILIKE '%whisky%'
   OR name_en ILIKE '%vodka%'
   OR name_en ILIKE '%cocktail%')
   AND (station_type IS NULL OR station_type != 'bar');

-- Step 4: Verify all bar categories
SELECT id, name_he, name_en, station_type
FROM categories
WHERE station_type = 'bar'
ORDER BY name_he;

-- Step 5: Verify all kitchen categories
SELECT id, name_he, name_en, station_type
FROM categories
WHERE station_type = 'kitchen' OR station_type IS NULL
ORDER BY name_he;