import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import { GoogleTagManager } from './GoogleTagManager'

export function Analytics() {
  return (
    <>
      <VercelAnalytics />
      <GoogleTagManager />
    </>
  )
}