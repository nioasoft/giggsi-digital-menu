// Application configuration
export const config = {
  // Production URL - change this to your actual domain
  PRODUCTION_URL: 'https://giggsi-menu.vercel.app', // Update with your actual URL

  // Get the current site URL based on environment
  getSiteUrl: () => {
    // In production, use the production URL
    if (import.meta.env.VITE_APP_ENV === 'production') {
      return config.PRODUCTION_URL
    }

    // Check if we have a custom URL in env
    if (import.meta.env.VITE_SITE_URL) {
      return import.meta.env.VITE_SITE_URL
    }

    // In development, use current origin
    if (typeof window !== 'undefined') {
      return window.location.origin
    }

    // Fallback
    return 'http://localhost:3000'
  },

  // Get email redirect URL for auth emails
  getEmailRedirectUrl: () => {
    const baseUrl = config.getSiteUrl()
    return `${baseUrl}/waiter/login`
  }
}