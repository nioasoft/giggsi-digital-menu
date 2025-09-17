-- Add Asaf as Admin
-- ==================

-- Add asaf@giggsi.co.il to admin_users table
INSERT INTO admin_users (email, is_active)
VALUES ('asaf@giggsi.co.il', true)
ON CONFLICT (email)
DO UPDATE SET is_active = true;

-- Verify it worked
SELECT * FROM admin_users WHERE email = 'asaf@giggsi.co.il';

-- Show all admins
SELECT * FROM admin_users;