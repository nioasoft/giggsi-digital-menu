-- Simple Admin Fix - Just add your user
-- ======================================

-- STEP 1: Check what columns exist in admin_users
SELECT * FROM admin_users LIMIT 1;

-- STEP 2: Insert your admin (minimal version)
-- REPLACE 'your-email@example.com' with YOUR ACTUAL EMAIL from Supabase Auth!
INSERT INTO admin_users (email, is_active)
VALUES ('your-email@example.com', true)
ON CONFLICT (email)
DO UPDATE SET is_active = true;

-- STEP 3: Check it worked
SELECT * FROM admin_users WHERE email = 'your-email@example.com';

-- That's it! Now you can login to admin panel.