-- תיקון בעיית אישור אימייל למלצרים
-- הרץ את זה בSupabase SQL Editor

-- שלב 1: צור פונקציה לאישור אימייל של משתמש
CREATE OR REPLACE FUNCTION confirm_user_email(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- מצא את המשתמש לפי אימייל
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  -- אם המשתמש נמצא, אשר את האימייל שלו
  IF user_id IS NOT NULL THEN
    UPDATE auth.users
    SET
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW()),
      updated_at = NOW()
    WHERE id = user_id;
  END IF;
END;
$$;

-- שלב 2: תן הרשאות לפונקציה
GRANT EXECUTE ON FUNCTION confirm_user_email TO anon;
GRANT EXECUTE ON FUNCTION confirm_user_email TO authenticated;

-- שלב 3: בדוק אילו מלצרים לא מאושרים
SELECT 'מלצרים שהאימייל שלהם לא מאושר:' as info;
SELECT
  wu.name,
  wu.email,
  wu.is_active as waiter_active,
  au.email_confirmed_at,
  CASE
    WHEN au.email_confirmed_at IS NULL THEN 'לא מאושר ❌'
    ELSE 'מאושר ✅'
  END as auth_status
FROM waiter_users wu
LEFT JOIN auth.users au ON wu.email = au.email
WHERE wu.is_active = true
ORDER BY wu.name;

-- שלב 4: אשר את כל המלצרים הפעילים
DO $$
DECLARE
  waiter_record RECORD;
BEGIN
  -- עבור על כל המלצרים הפעילים
  FOR waiter_record IN
    SELECT wu.email
    FROM waiter_users wu
    LEFT JOIN auth.users au ON wu.email = au.email
    WHERE wu.is_active = true
    AND au.email_confirmed_at IS NULL
  LOOP
    -- אשר את האימייל שלהם
    PERFORM confirm_user_email(waiter_record.email);
    RAISE NOTICE 'אישרתי את: %', waiter_record.email;
  END LOOP;
END $$;

-- שלב 5: בדוק שוב את הסטטוס
SELECT 'סטטוס אחרי התיקון:' as info;
SELECT
  wu.name,
  wu.email,
  wu.is_active as waiter_active,
  au.email_confirmed_at,
  CASE
    WHEN au.email_confirmed_at IS NULL THEN 'לא מאושר ❌'
    ELSE 'מאושר ✅'
  END as auth_status
FROM waiter_users wu
LEFT JOIN auth.users au ON wu.email = au.email
WHERE wu.is_active = true
ORDER BY wu.name;

-- שלב 6: הודעת הצלחה
SELECT
  '🎉 הושלם!' as status,
  'כל המלצרים הפעילים אושרו' as message,
  'הם יכולים להתחבר למערכת עכשיו' as details;