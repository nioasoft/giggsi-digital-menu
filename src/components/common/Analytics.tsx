import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import { GoogleTagManager } from './GoogleTagManager'
import { useEffect, useState } from 'react'

export function Analytics() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)

  useEffect(() => {
    // Check for consent
    const consent = localStorage.getItem('cookieConsent')
    if (consent) {
      const prefs = JSON.parse(consent)
      setAnalyticsEnabled(prefs.analytics || false)
    }
  }, [])

  return (
    <>
      {analyticsEnabled && <VercelAnalytics />}
      <GoogleTagManager />
    </>
  )
}