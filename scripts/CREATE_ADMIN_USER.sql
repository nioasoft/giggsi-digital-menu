-- =====================================================
-- INSTRUCTIONS TO CREATE ADMIN USER IN SUPABASE
-- =====================================================
-- 
-- Since we need service-level access to create auth users,
-- please follow these steps:
--
-- 1. Go to your Supabase Dashboard:
--    https://supabase.com/dashboard/project/bsivfdyxjdmosxlbouue
--
-- 2. Click on "SQL Editor" in the left sidebar
--
-- 3. Click "New Query"
--
-- 4. Copy and paste this entire SQL script
--
-- 5. Click "Run" to execute
--
-- =====================================================

-- First, ensure the admin_users table has the correct email
DELETE FROM admin_users WHERE email = 'admin@giggsi.com';

INSERT INTO admin_users (email, is_active, created_at)
VALUES ('asaf@giggsi.co.il', true, NOW())
ON CONFLICT (email) 
DO UPDATE SET 
  is_active = true,
  last_login = NULL;

-- Display success message
SELECT 
  '✅ Admin user record created!' as status,
  'asaf@giggsi.co.il' as admin_email,
  'Now create the auth user in Authentication > Users tab' as next_step;

-- =====================================================
-- NEXT STEPS:
-- =====================================================
-- 
-- After running this SQL:
-- 
-- 1. Go to "Authentication" in the left sidebar
-- 2. Click on "Users" tab
-- 3. Click "Add user" → "Create new user"
-- 4. Enter:
--    Email: asaf@giggsi.co.il
--    Password: Aa589525!
-- 5. Check "Auto Confirm User"
-- 6. Click "Create user"
--
-- Then you can login at:
-- http://localhost:5173/admin-giggsi-2024/login
--
-- =====================================================