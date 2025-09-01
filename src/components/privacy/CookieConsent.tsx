import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Settings, Check } from 'lucide-react'

export function CookieConsent() {
  const { t, ready, i18n } = useTranslation()
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true, // Cannot be disabled
    analytics: false,
    marketing: false
  })

  // Direct text function as fallback
  const getText = (key: string): string => {
    const texts: Record<string, Record<string, string>> = {
      he: {
        title: 'הגדרות פרטיות ועוגיות',
        description: 'אנו משתמשים בעוגיות לשיפור החוויה שלך',
        necessary: 'עוגיות הכרחיות',
        analytics: 'עוגיות אנליטיקה',
        marketing: 'עוגיות שיווק',
        acceptAll: 'אשר הכל',
        acceptSelected: 'אשר נבחרים',
        rejectAll: 'דחה הכל',
        settings: 'הגדרות'
      },
      en: {
        title: 'Privacy & Cookie Settings',
        description: 'We use cookies to improve your experience',
        necessary: 'Necessary Cookies',
        analytics: 'Analytics Cookies',
        marketing: 'Marketing Cookies',
        acceptAll: 'Accept All',
        acceptSelected: 'Accept Selected',
        rejectAll: 'Reject All',
        settings: 'Settings'
      },
      ar: {
        title: 'إعدادات الخصوصية وملفات تعريف الارتباط',
        description: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك',
        necessary: 'ملفات تعريف الارتباط الضرورية',
        analytics: 'ملفات تعريف الارتباط التحليلية',
        marketing: 'ملفات تعريف الارتباط التسويقية',
        acceptAll: 'قبول الكل',
        acceptSelected: 'قبول المحدد',
        rejectAll: 'رفض الكل',
        settings: 'الإعدادات'
      },
      ru: {
        title: 'Настройки конфиденциальности и cookie',
        description: 'Мы используем cookie для улучшения вашего опыта',
        necessary: 'Необходимые cookie',
        analytics: 'Аналитические cookie',
        marketing: 'Маркетинговые cookie',
        acceptAll: 'Принять все',
        acceptSelected: 'Принять выбранные',
        rejectAll: 'Отклонить все',
        settings: 'Настройки'
      }
    }
    
    const lang = i18n.language || 'he'
    const langTexts = texts[lang] || texts.he
    return langTexts[key] || texts.he[key] || key
  }

  useEffect(() => {
    // Only check for consent after i18n is ready
    if (!ready) return
    
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      setShowBanner(true)
    } else {
      const savedPreferences = JSON.parse(consent)
      setPreferences(savedPreferences)
      applyPreferences(savedPreferences)
    }
  }, [ready])

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
    // Reload to apply analytics
    window.location.reload()
  }

  const acceptSelected = () => {
    applyPreferences(preferences)
    setShowBanner(false)
    // Reload to apply analytics if enabled
    if (preferences.analytics || preferences.marketing) {
      window.location.reload()
    }
  }

  const rejectAll = () => {
    const newPrefs = { necessary: true, analytics: false, marketing: false }
    setPreferences(newPrefs)
    applyPreferences(newPrefs)
    setShowBanner(false)
  }

  if (!showBanner || !ready) return null

  // Determine position based on language direction
  const isRTL = i18n.language === 'he' || i18n.language === 'ar'
  const positionClass = isRTL ? 'left-4' : 'right-4'

  return (
    <div className={`fixed bottom-4 ${positionClass} z-50 animate-slide-up`}>
      <Card className="max-w-sm p-4 shadow-2xl bg-background/95 backdrop-blur border-border">
        <div className="space-y-3">
          {/* Header */}
          <div>
            <h3 className="text-sm font-semibold">
              {getText('title')}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {getText('description')}
            </p>
          </div>

          {/* Quick Action Buttons */}
          {!showDetails && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowDetails(true)}
                className="text-xs h-8"
              >
                <Settings className="w-3 h-3 mr-1" />
                {getText('settings')}
              </Button>
              <Button 
                size="sm" 
                onClick={acceptAll}
                className="text-xs h-8 flex-1 bg-giggsi-gold hover:bg-giggsi-gold/90 text-black"
              >
                <Check className="w-3 h-3 mr-1" />
                {getText('acceptAll')}
              </Button>
            </div>
          )}

          {/* Detailed Settings */}
          {showDetails && (
            <>
              <div className="space-y-2 pt-2 border-t">
                {/* Necessary Cookies */}
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={preferences.necessary}
                    disabled
                    className="w-3 h-3 rounded"
                  />
                  <span className="font-medium">
                    {getText('necessary')}
                  </span>
                </label>
                
                {/* Analytics Cookies */}
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({...preferences, analytics: e.target.checked})}
                    className="w-3 h-3 rounded"
                  />
                  <span>
                    {getText('analytics')}
                  </span>
                </label>
                
                {/* Marketing Cookies */}
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({...preferences, marketing: e.target.checked})}
                    className="w-3 h-3 rounded"
                  />
                  <span>
                    {getText('marketing')}
                  </span>
                </label>
              </div>

              {/* Action Buttons for Details View */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={rejectAll}
                  className="text-xs h-8"
                >
                  {getText('rejectAll')}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={acceptSelected}
                  className="text-xs h-8 flex-1"
                >
                  {getText('acceptSelected')}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

// Type declaration for the global dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}