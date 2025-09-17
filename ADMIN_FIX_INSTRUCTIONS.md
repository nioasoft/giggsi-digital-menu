# הוראות לתיקון גישת האדמין

## הבעיה
האדמין שלך קיים ב-Supabase Auth אבל לא בטבלת `admin_users`, לכן אין לך הרשאות.

## הפתרון - 3 צעדים פשוטים:

### צעד 1: גלה את המייל של האדמין שלך
1. כנס ל-**Supabase Dashboard**
2. לך ל-**Authentication** > **Users**
3. מצא את המשתמש האדמין שלך
4. העתק את המייל שלו

### צעד 2: הרץ את ה-SQL
1. כנס ל-**SQL Editor** ב-Supabase
2. העתק את הקוד הבא:

```sql
-- יצירת טבלת admin_users אם לא קיימת
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- הפעלת RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- יצירת policy
DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users;
CREATE POLICY "Admins can read admin_users" ON admin_users
  FOR SELECT USING (true);

-- הוספת האדמין שלך - החלף את המייל!
INSERT INTO admin_users (email, name, role, is_active)
VALUES ('המייל_שלך@כאן.com', 'Admin', 'admin', true)
ON CONFLICT (email)
DO UPDATE SET is_active = true;
```

3. **החלף** את `'המייל_שלך@כאן.com'` במייל האמיתי שלך
4. הרץ את ה-SQL

### צעד 3: בדוק שזה עובד
1. צא מהמערכת (logout)
2. כנס שוב ל-`/admin-giggsi-2024/login`
3. השתמש באותו מייל וסיסמה

## אם עדיין לא עובד:

### בדיקה 1: וודא שהמשתמש נוסף
```sql
SELECT * FROM admin_users;
```
אמור להראות את המשתמש שלך.

### בדיקה 2: וודא שה-RLS פועל
```sql
SELECT * FROM admin_users WHERE email = 'המייל_שלך@כאן.com';
```

### אופציה נוספת - הוסף את כל המשתמשים הקיימים כאדמינים:
```sql
-- זה יהפוך את כל המשתמשים הקיימים לאדמינים
INSERT INTO admin_users (email, name, role, is_active)
SELECT email, 'Admin User', 'admin', true
FROM auth.users
ON CONFLICT (email) DO NOTHING;
```

## הערות חשובות:
- המייל בטבלת `admin_users` חייב להיות זהה למייל ב-Supabase Auth
- ודא שהמשתמש מסומן כ-`is_active = true`
- אחרי הוספת האדמין, תוכל ליצור מלצרים דרך הממשק

## יצירת מלצרים:
כשתיצור מלצר חדש דרך הממשק:
1. המערכת תיצור רשומה בטבלת `waiter_users`
2. תקבל הודעה ליצור משתמש ב-Supabase Authentication
3. לך ל-Authentication > Users > Invite User
4. הזן את המייל והסיסמה של המלצר

---
**בהצלחה!** 🚀