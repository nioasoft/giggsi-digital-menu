-- Add new tables to the system
-- Tables: 600-604, 700-704, 800, 804, 812-813
-- Run this in Supabase SQL Editor

-- Step 1: Check which tables already exist
SELECT 'Existing tables in requested ranges:' as info;
SELECT table_number
FROM tables
WHERE table_number IN (
  600, 601, 602, 603, 604,
  700, 701, 702, 703, 704,
  800, 804,
  812, 813
)
ORDER BY table_number;

-- Step 2: Insert new tables (will skip any that already exist)
INSERT INTO tables (table_number, status) VALUES
  -- Tables 600-604
  (600, 'available'),
  (601, 'available'),
  (602, 'available'),
  (603, 'available'),
  (604, 'available'),
  -- Tables 700-704
  (700, 'available'),
  (701, 'available'),
  (702, 'available'),
  (703, 'available'),
  (704, 'available'),
  -- Tables 800, 804
  (800, 'available'),
  (804, 'available'),
  -- Tables 812-813
  (812, 'available'),
  (813, 'available')
ON CONFLICT (table_number) DO NOTHING;

-- Step 3: Verify all new tables were added
SELECT 'Tables after insertion:' as info;
SELECT table_number, status, created_at
FROM tables
WHERE table_number IN (
  600, 601, 602, 603, 604,
  700, 701, 702, 703, 704,
  800, 804,
  812, 813
)
ORDER BY table_number;

-- Step 4: Show summary
SELECT
  'SUMMARY' as report,
  COUNT(*) as total_tables_in_ranges,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 minute' THEN 1 END) as newly_added
FROM tables
WHERE table_number IN (
  600, 601, 602, 603, 604,
  700, 701, 702, 703, 704,
  800, 804,
  812, 813
);

-- Step 5: Show all tables grouped by range for verification
SELECT
  CASE
    WHEN table_number BETWEEN 1 AND 19 THEN '1-19'
    WHEN table_number BETWEEN 100 AND 104 THEN '100-104'
    WHEN table_number BETWEEN 200 AND 204 THEN '200-204'
    WHEN table_number BETWEEN 300 AND 304 THEN '300-304'
    WHEN table_number BETWEEN 400 AND 404 THEN '400-404'
    WHEN table_number BETWEEN 500 AND 504 THEN '500-504'
    WHEN table_number BETWEEN 512 AND 513 THEN '512-513'
    WHEN table_number BETWEEN 600 AND 604 THEN '600-604'
    WHEN table_number BETWEEN 700 AND 704 THEN '700-704'
    WHEN table_number = 800 THEN '800'
    WHEN table_number = 804 THEN '804'
    WHEN table_number BETWEEN 812 AND 813 THEN '812-813'
    WHEN table_number BETWEEN 900 AND 920 THEN '900-920'
    ELSE 'Other'
  END as table_range,
  STRING_AGG(table_number::text, ', ' ORDER BY table_number) as table_numbers,
  COUNT(*) as count
FROM tables
GROUP BY
  CASE
    WHEN table_number BETWEEN 1 AND 19 THEN '1-19'
    WHEN table_number BETWEEN 100 AND 104 THEN '100-104'
    WHEN table_number BETWEEN 200 AND 204 THEN '200-204'
    WHEN table_number BETWEEN 300 AND 304 THEN '300-304'
    WHEN table_number BETWEEN 400 AND 404 THEN '400-404'
    WHEN table_number BETWEEN 500 AND 504 THEN '500-504'
    WHEN table_number BETWEEN 512 AND 513 THEN '512-513'
    WHEN table_number BETWEEN 600 AND 604 THEN '600-604'
    WHEN table_number BETWEEN 700 AND 704 THEN '700-704'
    WHEN table_number = 800 THEN '800'
    WHEN table_number = 804 THEN '804'
    WHEN table_number BETWEEN 812 AND 813 THEN '812-813'
    WHEN table_number BETWEEN 900 AND 920 THEN '900-920'
    ELSE 'Other'
  END
ORDER BY
  MIN(table_number);

-- Success message
SELECT
  'SUCCESS' as status,
  'New tables have been added' as message,
  'Tables 600-604, 700-704, 800, 804, 812-813 are now available' as details;