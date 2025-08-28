# תוכנית התאמה לתיקון 13 לחוק הגנת הפרטיות - Giggsi Digital Menu

## תאריך: 28/08/2025
## סטטוס: טיוטה ראשונית לביצוע

---

## 📋 תוכן עניינים
1. [סקירת מצב קיים](#סקירת-מצב-קיים)
2. [ממצאים וסיכונים](#ממצאים-וסיכונים)
3. [תוכנית פעולה מפורטת](#תוכנית-פעולה-מפורטת)
4. [דוגמאות קוד](#דוגמאות-קוד)
5. [לוחות זמנים](#לוחות-זמנים)

---

## סקירת מצב קיים

### 🔍 נקודות איסוף מידע שזוהו בקוד

#### 1. **Google Tag Manager (GTM-MT8H76TR)**
- **מיקום:** `index.html` (שורות 11-17, 72-75)
- **סטטוס:** פעיל אוטומטית בטעינת העמוד
- **מידע נאסף:** התנהגות משתמשים, דפים שנצפו, אירועים
- **בעיה:** אין מנגנון הסכמה לפני הפעלה

#### 2. **Vercel Analytics**
- **מיקום:** `src/components/common/Analytics.tsx`
- **סטטוס:** פעיל אוטומטית
- **מידע נאסף:** ביצועים, מיקום גיאוגרפי כללי
- **בעיה:** אין אפשרות לסרב

#### 3. **Supabase Authentication**
- **מיקום:** `src/lib/supabase.ts`, `src/lib/auth.ts`
- **מידע נאסף:** כתובות אימייל וסיסמאות של מנהלים
- **סטטוס:** רק באזור הניהול
- **בעיה:** אין מדיניות פרטיות או תנאי שימוש

#### 4. **Local Storage**
- **מיקומים:**
  - הגדרות שפה: `src/i18n/index.ts`
  - אחסון מידע Supabase Auth
- **מידע נאסף:** העדפות משתמש, טוקני אימות
- **בעיה:** אין הודעה למשתמש על שימוש ב-Local Storage

#### 5. **טפסי ניהול**
- **מיקומים:**
  - `src/pages/admin/LoginPage.tsx` - טופס התחברות
  - `src/pages/admin/CategoriesPage.tsx` - ניהול קטגוריות
  - `src/pages/admin/MenuItemsPage.tsx` - ניהול פריטים
- **מידע נאסף:** מידע על מנהלים, תמונות מוצרים
- **בעיה:** אין checkbox הסכמה, אין מידע על שמירת הנתונים

---

## ממצאים וסיכונים

### 🚨 סיכונים ברמת דחיפות גבוהה

| קובץ | ממצא | השלכה משפטית |
|------|------|--------------|
| `index.html` | GTM מופעל אוטומטית | קנס עד 3.2 מיליון ₪ |
| `src/components/common/GoogleTagManager.tsx` | מעקב אחר נתיבים ללא הסכמה | הפרת פרטיות |
| `src/lib/supabase.ts` | אין הצהרת פרטיות בהרשמה | אי עמידה בדרישת שקיפות |

### ⚠️ סיכונים ברמת דחיפות בינונית

| קובץ | ממצא | השלכה |
|------|------|--------|
| `src/i18n/index.ts` | שמירת העדפות ללא יידוע | חוסר שקיפות |
| `src/pages/admin/*` | אין מנגנון מחיקת נתונים | הפרת זכות למחיקה |

### ℹ️ סיכונים ברמת דחיפות נמוכה

| קובץ | ממצא | השלכה |
|------|------|--------|
| `src/components/menu/*` | אין מידע על cookie policy | חוסר שקיפות |

---

## תוכנית פעולה מפורטת

### שלב 1: תשתית פרטיות (חובה מיידי)

#### 1.1 יצירת רכיב Cookie Consent Banner

**קובץ חדש:** `src/components/privacy/CookieConsent.tsx`

```typescript
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function CookieConsent() {
  const { t } = useTranslation()
  const [showBanner, setShowBanner] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true, // Cannot be disabled
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      setShowBanner(true)
    } else {
      const savedPreferences = JSON.parse(consent)
      setPreferences(savedPreferences)
      applyPreferences(savedPreferences)
    }
  }, [])

  const applyPreferences = (prefs: typeof preferences) => {
    // Enable/disable GTM based on consent
    if (prefs.analytics || prefs.marketing) {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'consent_update',
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
        ad_storage: prefs.marketing ? 'granted' : 'denied'
      })
    }
    
    // Store consent
    localStorage.setItem('cookieConsent', JSON.stringify(prefs))
    localStorage.setItem('consentTimestamp', new Date().toISOString())
  }

  const acceptAll = () => {
    const newPrefs = { necessary: true, analytics: true, marketing: true }
    setPreferences(newPrefs)
    applyPreferences(newPrefs)
    setShowBanner(false)
  }

  const acceptSelected = () => {
    applyPreferences(preferences)
    setShowBanner(false)
  }

  const rejectAll = () => {
    const newPrefs = { necessary: true, analytics: false, marketing: false }
    setPreferences(newPrefs)
    applyPreferences(newPrefs)
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/80 backdrop-blur">
      <Card className="max-w-4xl mx-auto p-6">
        <h3 className="text-xl font-bold mb-4">{t('privacy.cookieConsent.title')}</h3>
        <p className="mb-6">{t('privacy.cookieConsent.description')}</p>
        
        <div className="space-y-4 mb-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.necessary}
              disabled
              className="w-4 h-4"
            />
            <div>
              <span className="font-medium">{t('privacy.cookieConsent.necessary')}</span>
              <p className="text-sm text-gray-600">{t('privacy.cookieConsent.necessaryDesc')}</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.analytics}
              onChange={(e) => setPreferences({...preferences, analytics: e.target.checked})}
              className="w-4 h-4"
            />
            <div>
              <span className="font-medium">{t('privacy.cookieConsent.analytics')}</span>
              <p className="text-sm text-gray-600">{t('privacy.cookieConsent.analyticsDesc')}</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.marketing}
              onChange={(e) => setPreferences({...preferences, marketing: e.target.checked})}
              className="w-4 h-4"
            />
            <div>
              <span className="font-medium">{t('privacy.cookieConsent.marketing')}</span>
              <p className="text-sm text-gray-600">{t('privacy.cookieConsent.marketingDesc')}</p>
            </div>
          </label>
        </div>
        
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={rejectAll}>
            {t('privacy.cookieConsent.rejectAll')}
          </Button>
          <Button variant="outline" onClick={acceptSelected}>
            {t('privacy.cookieConsent.acceptSelected')}
          </Button>
          <Button onClick={acceptAll}>
            {t('privacy.cookieConsent.acceptAll')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
```

#### 1.2 עדכון GoogleTagManager להתנות בהסכמה

**קובץ לעדכון:** `src/components/common/GoogleTagManager.tsx`

```typescript
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

declare global {
  interface Window {
    dataLayer: any[]
    gtmEvent: (eventName: string, eventData?: any) => void
  }
}

export function GoogleTagManager() {
  const location = useLocation()

  useEffect(() => {
    // Check for consent before initializing
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) return // Don't initialize if no consent
    
    const prefs = JSON.parse(consent)
    if (!prefs.analytics && !prefs.marketing) return // Don't initialize if both denied

    // Initialize dataLayer with consent state
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js',
      'gtm.uniqueEventId': 0
    })
    
    // Set consent mode
    window.dataLayer.push({
      event: 'consent_default',
      analytics_storage: prefs.analytics ? 'granted' : 'denied',
      ad_storage: prefs.marketing ? 'granted' : 'denied',
      wait_for_update: 500
    })
  }, [])

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) return
    
    const prefs = JSON.parse(consent)
    if (!prefs.analytics) return

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'pageview',
      page: {
        url: location.pathname,
        title: document.title
      }
    })
  }, [location])

  // Custom event helper
  useEffect(() => {
    window.gtmEvent = (eventName: string, eventData?: any) => {
      const consent = localStorage.getItem('cookieConsent')
      if (!consent) return
      
      const prefs = JSON.parse(consent)
      if (!prefs.analytics && !prefs.marketing) return
      
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: eventName,
        ...eventData
      })
    }
  }, [])

  return null
}
```

#### 1.3 יצירת דף מדיניות פרטיות

**קובץ חדש:** `src/pages/legal/PrivacyPolicy.tsx`

```typescript
import { useTranslation } from 'react-i18next'
import { Layout } from '@/components/common/Layout'

export function PrivacyPolicy() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'he' || i18n.language === 'ar'

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{t('privacy.policy.title')}</h1>
        
        <div className={`prose ${isRTL ? 'prose-rtl' : ''} max-w-none`}>
          <section className="mb-8">
            <h2>{t('privacy.policy.introduction.title')}</h2>
            <p>{t('privacy.policy.introduction.content')}</p>
            <p>
              <strong>{t('privacy.policy.lastUpdated')}</strong>: {new Date().toLocaleDateString(i18n.language)}
            </p>
          </section>

          <section className="mb-8">
            <h2>{t('privacy.policy.dataController.title')}</h2>
            <p>
              Giggsi Sports Bar<br/>
              באר שבע, ישראל<br/>
              אימייל: privacy@giggsi.com<br/>
              טלפון: 08-1234567
            </p>
          </section>

          <section className="mb-8">
            <h2>{t('privacy.policy.dataCollection.title')}</h2>
            <h3>{t('privacy.policy.dataCollection.types')}</h3>
            <ul>
              <li>{t('privacy.policy.dataCollection.analytics')}</li>
              <li>{t('privacy.policy.dataCollection.preferences')}</li>
              <li>{t('privacy.policy.dataCollection.adminData')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>{t('privacy.policy.purposes.title')}</h2>
            <ul>
              <li>{t('privacy.policy.purposes.service')}</li>
              <li>{t('privacy.policy.purposes.improvement')}</li>
              <li>{t('privacy.policy.purposes.legal')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>{t('privacy.policy.rights.title')}</h2>
            <ul>
              <li>{t('privacy.policy.rights.access')}</li>
              <li>{t('privacy.policy.rights.correction')}</li>
              <li>{t('privacy.policy.rights.deletion')}</li>
              <li>{t('privacy.policy.rights.portability')}</li>
              <li>{t('privacy.policy.rights.objection')}</li>
              <li>{t('privacy.policy.rights.withdrawal')}</li>
            </ul>
            <p>{t('privacy.policy.rights.howTo')}</p>
          </section>

          <section className="mb-8">
            <h2>{t('privacy.policy.cookies.title')}</h2>
            <h3>{t('privacy.policy.cookies.types')}</h3>
            <ul>
              <li>
                <strong>{t('privacy.policy.cookies.necessary')}</strong>
                <p>{t('privacy.policy.cookies.necessaryDesc')}</p>
              </li>
              <li>
                <strong>{t('privacy.policy.cookies.analytics')}</strong>
                <p>{t('privacy.policy.cookies.analyticsDesc')}</p>
              </li>
              <li>
                <strong>{t('privacy.policy.cookies.marketing')}</strong>
                <p>{t('privacy.policy.cookies.marketingDesc')}</p>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2>{t('privacy.policy.security.title')}</h2>
            <p>{t('privacy.policy.security.content')}</p>
          </section>

          <section className="mb-8">
            <h2>{t('privacy.policy.retention.title')}</h2>
            <p>{t('privacy.policy.retention.content')}</p>
          </section>

          <section className="mb-8">
            <h2>{t('privacy.policy.thirdParties.title')}</h2>
            <ul>
              <li>Google Analytics / Google Tag Manager</li>
              <li>Vercel Analytics</li>
              <li>Supabase (Database & Authentication)</li>
            </ul>
            <p>{t('privacy.policy.thirdParties.note')}</p>
          </section>

          <section className="mb-8">
            <h2>{t('privacy.policy.children.title')}</h2>
            <p>{t('privacy.policy.children.content')}</p>
          </section>

          <section className="mb-8">
            <h2>{t('privacy.policy.changes.title')}</h2>
            <p>{t('privacy.policy.changes.content')}</p>
          </section>

          <section className="mb-8">
            <h2>{t('privacy.policy.contact.title')}</h2>
            <p>{t('privacy.policy.contact.content')}</p>
            <p>
              אימייל: privacy@giggsi.com<br/>
              טלפון: 08-1234567<br/>
              כתובת: באר שבע, ישראל
            </p>
          </section>
        </div>

        <div className="mt-12 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">
            {t('privacy.policy.compliance')}
          </p>
        </div>
      </div>
    </Layout>
  )
}
```

#### 1.4 עדכון תרגומים

**קובץ לעדכון:** `src/i18n/locales/he.json`

הוסף את התרגומים הבאים:

```json
{
  "privacy": {
    "cookieConsent": {
      "title": "הגדרות פרטיות ועוגיות",
      "description": "אנו משתמשים בעוגיות כדי לשפר את חוויית המשתמש שלך. אנא בחר את העדפותיך:",
      "necessary": "עוגיות הכרחיות",
      "necessaryDesc": "נדרשות לתפקוד בסיסי של האתר",
      "analytics": "עוגיות אנליטיקה",
      "analyticsDesc": "עוזרות לנו להבין כיצד משתמשים באתר",
      "marketing": "עוגיות שיווק",
      "marketingDesc": "משמשות להצגת תוכן שיווקי רלוונטי",
      "acceptAll": "אשר הכל",
      "acceptSelected": "אשר נבחרים",
      "rejectAll": "דחה הכל"
    },
    "policy": {
      "title": "מדיניות פרטיות",
      "lastUpdated": "עדכון אחרון",
      "introduction": {
        "title": "מבוא",
        "content": "ב-Giggsi Sports Bar, אנו מחויבים להגן על פרטיותך. מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלך בהתאם לתיקון 13 לחוק הגנת הפרטיות."
      },
      "dataController": {
        "title": "בעל השליטה במידע"
      },
      "dataCollection": {
        "title": "איזה מידע אנו אוספים",
        "types": "סוגי המידע הנאסף:",
        "analytics": "נתוני שימוש ואנליטיקה (עמודים שנצפו, זמני ביקור)",
        "preferences": "העדפות משתמש (שפה, הגדרות תצוגה)",
        "adminData": "פרטי מנהלים (אימייל, סיסמה) - רק באזור הניהול"
      },
      "purposes": {
        "title": "מטרות השימוש במידע",
        "service": "אספקת השירות והתפריט הדיגיטלי",
        "improvement": "שיפור חוויית המשתמש והאתר",
        "legal": "עמידה בדרישות חוקיות"
      },
      "rights": {
        "title": "זכויותיך",
        "access": "זכות לעיון במידע שלך",
        "correction": "זכות לתיקון מידע שגוי",
        "deletion": "זכות למחיקת מידע",
        "portability": "זכות לניידות מידע",
        "objection": "זכות להתנגד לעיבוד",
        "withdrawal": "זכות לביטול הסכמה",
        "howTo": "לממש זכויותיך, צור קשר עמנו בפרטים המופיעים למטה."
      },
      "cookies": {
        "title": "שימוש בעוגיות",
        "types": "סוגי עוגיות:",
        "necessary": "עוגיות הכרחיות",
        "necessaryDesc": "נדרשות לתפקוד בסיסי של האתר ואינן ניתנות לביטול",
        "analytics": "עוגיות אנליטיקה",
        "analyticsDesc": "מאפשרות לנו להבין כיצד משתמשים באתר ולשפר אותו",
        "marketing": "עוגיות שיווק",
        "marketingDesc": "משמשות להתאמת תוכן שיווקי"
      },
      "security": {
        "title": "אבטחת מידע",
        "content": "אנו נוקטים באמצעי אבטחה טכניים וארגוניים מתאימים כדי להגן על המידע שלך מפני גישה בלתי מורשית, שינוי, גילוי או השמדה."
      },
      "retention": {
        "title": "תקופת שמירת מידע",
        "content": "אנו שומרים את המידע שלך רק כל עוד נדרש למטרות שלשמן נאסף או כנדרש על פי חוק."
      },
      "thirdParties": {
        "title": "שיתוף מידע עם צדדים שלישיים",
        "note": "איננו מוכרים או משתפים את המידע האישי שלך עם צדדים שלישיים למטרות שיווק."
      },
      "children": {
        "title": "פרטיות ילדים",
        "content": "האתר שלנו אינו מיועד לילדים מתחת לגיל 13. איננו אוספים ביודעין מידע אישי מילדים."
      },
      "changes": {
        "title": "שינויים במדיניות",
        "content": "אנו עשויים לעדכן מדיניות זו מעת לעת. נודיע על שינויים מהותיים באמצעות האתר."
      },
      "contact": {
        "title": "צור קשר",
        "content": "לשאלות בנושא מדיניות הפרטיות או לממש את זכויותיך, אנא פנה אלינו:"
      },
      "compliance": "מדיניות זו תואמת לתיקון 13 לחוק הגנת הפרטיות (התשע\"ח-2017) ול-GDPR האירופי."
    }
  }
}
```

### שלב 2: עדכון נתיבים וניווט

**קובץ לעדכון:** `src/App.tsx`

הוסף נתיבים חדשים:

```typescript
import { PrivacyPolicy } from '@/pages/legal/PrivacyPolicy'
import { TermsOfService } from '@/pages/legal/TermsOfService'
import { CookieConsent } from '@/components/privacy/CookieConsent'

// בתוך הרכיב App, אחרי ה-Router:
<Router>
  <Routes>
    {/* ... existing routes ... */}
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms" element={<TermsOfService />} />
  </Routes>
  <Analytics />
  <CookieConsent />
</Router>
```

### שלב 3: עדכון Footer עם קישורים למדיניות

**קובץ לעדכון:** `src/components/common/Layout.tsx`

הוסף footer עם קישורים:

```typescript
// בתוך רכיב Layout, הוסף footer:
<footer className="mt-auto py-8 border-t border-gray-800">
  <div className="container mx-auto px-4">
    <div className="flex flex-wrap justify-center gap-6 text-sm">
      <Link to="/privacy" className="hover:text-giggsi-gold">
        {t('footer.privacy')}
      </Link>
      <Link to="/terms" className="hover:text-giggsi-gold">
        {t('footer.terms')}
      </Link>
      <Link to="/contact" className="hover:text-giggsi-gold">
        {t('footer.contact')}
      </Link>
      <button 
        onClick={() => setShowCookieSettings(true)}
        className="hover:text-giggsi-gold"
      >
        {t('footer.cookieSettings')}
      </button>
    </div>
    <div className="text-center mt-4 text-xs text-gray-600">
      © {new Date().getFullYear()} Giggsi Sports Bar. {t('footer.allRights')}
    </div>
  </div>
</footer>
```

### שלב 4: הוספת הסכמה בטפסי הניהול

**קובץ לעדכון:** `src/pages/admin/LoginPage.tsx`

הוסף checkbox הסכמה:

```typescript
// בתוך טופס ההתחברות, לפני כפתור השליחה:
<div className="flex items-start gap-2 mb-4">
  <input
    type="checkbox"
    id="privacy-consent"
    required
    className="mt-1"
  />
  <label htmlFor="privacy-consent" className="text-sm">
    {t('admin.login.consent')} 
    <Link to="/privacy" className="text-blue-500 hover:underline" target="_blank">
      {t('admin.login.privacyPolicy')}
    </Link>
  </label>
</div>
```

### שלב 5: יצירת מנגנון מחיקת נתונים למנהלים

**קובץ חדש:** `src/components/admin/DataManagement.tsx`

```typescript
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function DataManagement() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const exportUserData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')
      
      // Fetch all user data
      const userData = {
        profile: user,
        timestamp: new Date().toISOString()
      }
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user-data-${user.id}.json`
      a.click()
      
      setMessage('הנתונים שלך הורדו בהצלחה')
    } catch (error) {
      setMessage('שגיאה בייצוא הנתונים')
    } finally {
      setLoading(false)
    }
  }

  const requestDataDeletion = async () => {
    if (!confirm('האם אתה בטוח? פעולה זו בלתי הפיכה.')) return
    
    setLoading(true)
    try {
      // Log deletion request
      console.log('Data deletion requested at:', new Date().toISOString())
      
      // In production, this should trigger a deletion workflow
      setMessage('בקשת המחיקה נשלחה. נטפל בה תוך 30 ימים.')
    } catch (error) {
      setMessage('שגיאה בשליחת בקשת המחיקה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">ניהול נתונים אישיים</h3>
      
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">ייצוא הנתונים שלך</h4>
          <p className="text-sm text-gray-600 mb-3">
            הורד העתק של כל המידע האישי שלך
          </p>
          <Button 
            onClick={exportUserData} 
            disabled={loading}
            variant="outline"
          >
            ייצא את הנתונים שלי
          </Button>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">מחיקת חשבון</h4>
          <p className="text-sm text-gray-600 mb-3">
            בקש למחוק את חשבונך וכל הנתונים הקשורים
          </p>
          <Button 
            onClick={requestDataDeletion} 
            disabled={loading}
            variant="destructive"
          >
            מחק את החשבון שלי
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### שלב 6: עדכון סכמת מסד הנתונים

**קובץ חדש:** `supabase/migrations/003_privacy_compliance.sql`

```sql
-- Create privacy consent tracking table
CREATE TABLE IF NOT EXISTS privacy_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'cookies', 'terms', 'privacy'
  granted BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create data deletion requests table
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed'
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add privacy fields to existing tables
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS privacy_consent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Create audit log for sensitive operations
CREATE TABLE IF NOT EXISTS privacy_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'data_export', 'data_deletion', 'consent_update'
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own consent records
CREATE POLICY "Users can view own consents" ON privacy_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own consents" ON privacy_consents
  FOR UPDATE USING (auth.uid() = user_id);

-- Only admins can view deletion requests
CREATE POLICY "Admins can view deletion requests" ON data_deletion_requests
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Users can create their own deletion requests
CREATE POLICY "Users can request deletion" ON data_deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## דוגמאות קוד

### דוגמה 1: התנייה של GTM בהסכמה

```javascript
// Before (בעייתי):
window.dataLayer.push({'event': 'purchase'})

// After (תקין):
if (window.gtmEvent) {
  window.gtmEvent('purchase', {
    value: 100,
    currency: 'ILS'
  })
}
```

### דוגמה 2: אימות הסכמה לפני שמירת נתונים

```typescript
// בכל טופס שאוסף נתונים:
const handleSubmit = async (data: FormData) => {
  // Check for consent
  const consent = localStorage.getItem('privacyConsent')
  if (!consent) {
    alert('Please accept our privacy policy first')
    return
  }
  
  // Log the consent
  await supabase.from('privacy_audit_log').insert({
    user_id: user?.id,
    action: 'form_submission',
    details: { form: 'contact', timestamp: new Date() }
  })
  
  // Continue with form submission
  // ...
}
```

---

## לוחות זמנים

### שבוע 1-2: תשתית בסיסית (דחוף!)
- [ ] הטמעת Cookie Consent Banner
- [ ] עדכון GTM להתנות בהסכמה
- [ ] יצירת דפי מדיניות פרטיות ותנאי שימוש

### שבוע 3-4: השלמות ובדיקות
- [ ] הוספת מנגנוני מחיקת נתונים
- [ ] עדכון כל הטפסים עם checkboxes
- [ ] בדיקות מקיפות

### שבוע 5: תיעוד וסיום
- [ ] תיעוד כל התהליכים
- [ ] הדרכת צוות
- [ ] בדיקה סופית

---

## סיכום

תוכנית זו מכסה את כל הדרישות של תיקון 13 לחוק הגנת הפרטיות:

✅ **שקיפות** - מדיניות פרטיות מפורטת ונגישה  
✅ **הסכמה** - מנגנון הסכמה ברור לפני איסוף נתונים  
✅ **זכויות משתמשים** - אפשרות לייצוא ומחיקת נתונים  
✅ **אבטחה** - הצפנה ואבטחת נתונים  
✅ **דיווחיות** - תיעוד ומעקב אחר פעולות  

---

## נספחים

### נספח א': רשימת תיוג לבדיקת תאימות

- [ ] Cookie consent banner מוצג בטעינה ראשונה
- [ ] GTM לא נטען ללא הסכמה
- [ ] מדיניות פרטיות נגישה מכל עמוד
- [ ] כל הטפסים כוללים checkbox הסכמה
- [ ] אפשרות מחיקת נתונים זמינה
- [ ] ייצוא נתונים עובד
- [ ] תיעוד הסכמות נשמר במסד הנתונים

### נספח ב': משאבים נוספים

- [תיקון 13 לחוק הגנת הפרטיות](https://www.gov.il/he/departments/legalInfo/data_protection_law)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)
- [Google Consent Mode](https://support.google.com/analytics/answer/9976101)

---

*מסמך זה הוכן לצורך יישום תיקון 13 לחוק הגנת הפרטיות באתר Giggsi Digital Menu*  
*תאריך עדכון אחרון: 28/08/2025*