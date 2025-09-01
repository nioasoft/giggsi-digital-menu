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

    // Load GTM script dynamically only if consent is given
    if (!window.dataLayer) {
      window.dataLayer = []
      
      // Set consent mode first
      window.dataLayer.push({
        event: 'consent_default',
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
        ad_storage: prefs.marketing ? 'granted' : 'denied',
        wait_for_update: 500
      })

      // Load GTM script
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtm.js?id=GTM-MT8H76TR`
      
      script.onload = () => {
        window.dataLayer.push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js'
        })
      }
      
      document.head.appendChild(script)
    }
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