import React, { useEffect } from 'react'

interface DisplayLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export const DisplayLayout: React.FC<DisplayLayoutProps> = ({ children, title, subtitle }) => {
  useEffect(() => {
    // Force landscape orientation
    const lockOrientation = async () => {
      try {
        // Try modern API first
        if ('orientation' in screen && 'lock' in (screen.orientation as any)) {
          await (screen.orientation as any).lock('landscape')
        }
      } catch (err) {
        // Fallback or not supported
        console.log('Orientation lock not supported')
      }
    }

    lockOrientation()

    // Add class to body for landscape-only CSS
    document.body.classList.add('landscape-only')

    return () => {
      document.body.classList.remove('landscape-only')
      // Unlock orientation on unmount
      if ('orientation' in screen && 'unlock' in (screen.orientation as any)) {
        (screen.orientation as any).unlock()
      }
    }
  }, [])

  return (
    <div
      className="min-h-screen bg-gray-900 text-white overflow-hidden"
      dir="rtl"
    >
      {/* Landscape enforcement message */}
      <div className="portrait-only fixed inset-0 bg-gray-900 flex items-center justify-center z-50 text-center p-8">
        <div>
          <svg className="w-24 h-24 mx-auto mb-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">סובב את המכשיר</h2>
          <p className="text-gray-400">אנא סובב את המכשיר למצב אופקי</p>
        </div>
      </div>

      {/* Main content */}
      <div className="landscape-content">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-2">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-giggsi-gold">{title}</h1>
              {subtitle && (
                <p className="text-xs text-gray-400">{subtitle}</p>
              )}
            </div>
            <div className="text-sm text-gray-400">
              {new Date().toLocaleTimeString('he-IL', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 h-[calc(100vh-3.5rem)] overflow-auto">
          {children}
        </main>
      </div>

      {/* Landscape-only styles */}
      <style>{`
        @media (orientation: portrait) {
          .landscape-content {
            display: none;
          }
          .portrait-only {
            display: flex !important;
          }
        }

        @media (orientation: landscape) {
          .portrait-only {
            display: none !important;
          }
          .landscape-content {
            display: block;
          }
        }

        /* Force full screen on tablets */
        @media screen and (min-width: 768px) {
          .landscape-content {
            height: 100vh;
            width: 100vw;
          }
        }
      `}</style>
    </div>
  )
}