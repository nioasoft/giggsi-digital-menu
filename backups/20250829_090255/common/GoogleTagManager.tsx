import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

declare global {
  interface Window {
    dataLayer: any[]
  }
}

export function GoogleTagManager() {
  const location = useLocation()

  useEffect(() => {
    // Initialize dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || []
    
    // Push page view event on route change
    window.dataLayer.push({
      event: 'pageview',
      page: {
        url: location.pathname,
        title: document.title
      }
    })
  }, [location])

  // Custom event helper that can be used throughout the app
  useEffect(() => {
    // Make gtmEvent globally available for custom tracking
    window.gtmEvent = (eventName: string, eventData?: any) => {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: eventName,
        ...eventData
      })
    }
  }, [])

  return null
}

// Type declaration for the global gtmEvent function
declare global {
  interface Window {
    gtmEvent: (eventName: string, eventData?: any) => void
  }
}