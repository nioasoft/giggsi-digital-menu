-- Fix cooking preference categories to match actual database names

-- Update categories to require cooking preference using LIKE patterns
UPDATE categories
SET requires_cooking_preference = true
WHERE name_he LIKE '%גריל%'      -- Matches "מהגריל"
   OR name_he LIKE '%המבורגר%'   -- Matches "המבורגרים", "המבורגרים של נבחרת"
   OR name_he LIKE '%בורגר%'     -- Matches any burger variations
   OR name_he LIKE '%נבחרת%';    -- Matches premium/selection burgers

-- Verify the update
SELECT
  id,
  name_he,
  name_en,
  requires_cooking_preference
FROM categories
WHERE name_he LIKE '%גריל%'
   OR name_he LIKE '%המבורגר%'
   OR name_he LIKE '%בורגר%'
   OR name_he LIKE '%נבחרת%'
ORDER BY name_he;