-- Duplicate Giggsi Wings item to create Jumbo Giggsi Wings

-- First, let's find and examine the original item
DO $$
DECLARE
    original_item RECORD;
    new_item_id UUID;
BEGIN
    -- Find the original Giggsi Wings item
    SELECT * INTO original_item
    FROM menu_items
    WHERE name_he LIKE '%גיגסי ווינגס%'
    OR name_en ILIKE '%giggsi wings%'
    LIMIT 1;

    -- If we found the item, duplicate it
    IF FOUND THEN
        -- Generate a new UUID for the duplicate
        new_item_id := gen_random_uuid();

        -- Insert the duplicate with modified name and description
        INSERT INTO menu_items (
            id,
            category_id,
            name,
            name_he,
            name_en,
            name_ar,
            name_ru,
            description,
            description_he,
            description_en,
            description_ar,
            description_ru,
            price,
            image_url,
            image_urls,
            allergens,
            is_available,
            display_order,
            created_at,
            updated_at
        )
        SELECT
            new_item_id,
            category_id,
            COALESCE('ג''מבו ' || name, 'ג''מבו גיגסי ווינגס'),
            'ג''מבו גיגסי ווינגס',
            'Jumbo Giggsi Wings',
            COALESCE('جامبو ' || name_ar, 'جامبو جيجسي وينجز'),
            COALESCE('Джамбо ' || name_ru, 'Джамбо Гигси Вингс'),
            COALESCE(description || ' - 42 יחידות', '42 יחידות'),
            COALESCE(description_he || ' - 42 יחידות', '42 יחידות'),
            COALESCE(description_en || ' - 42 units', '42 units'),
            COALESCE(description_ar || ' - 42 قطعة', '42 قطعة'),
            COALESCE(description_ru || ' - 42 штуки', '42 штуки'),
            price,
            image_url,
            image_urls,
            allergens,
            is_available,
            display_order + 1, -- Place it right after the original
            NOW(),
            NOW()
        FROM menu_items
        WHERE (name_he LIKE '%גיגסי ווינגס%' OR name_en ILIKE '%giggsi wings%')
        LIMIT 1;

        RAISE NOTICE 'Successfully created Jumbo Giggsi Wings with ID: %', new_item_id;
    ELSE
        RAISE WARNING 'Could not find original Giggsi Wings item to duplicate';
    END IF;
END $$;

-- Verify the duplication
SELECT
    id,
    name_he,
    name_en,
    description_he,
    description_en,
    price,
    is_available
FROM menu_items
WHERE name_he LIKE '%גיגסי ווינגס%'
ORDER BY created_at DESC;