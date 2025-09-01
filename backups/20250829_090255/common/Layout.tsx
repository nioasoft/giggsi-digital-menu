import React from 'react'
import { useTranslation } from 'react-i18next'
import { getDirection } from '@/lib/utils'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Loader2 } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation()
  const direction = getDirection(i18n.language)

  React.useEffect(() => {
    document.documentElement.dir = direction
    document.documentElement.lang = i18n.language
  }, [direction, i18n.language])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <LanguageSwitcher />
          
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-giggsi-gold">
              {t('restaurant.name')}
            </h1>
            <img
              src="/logo_giggsi.png"
              alt={t('restaurant.name')}
              className="h-10 w-auto"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 pb-16">
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-giggsi-gold" />
              <span className="mx-2 text-sm text-muted-foreground">
                {t('common.loading')}
              </span>
            </div>
          }
        >
          {children}
        </React.Suspense>
      </main>

      <footer className="border-t bg-background/95">
        <div className="container py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <div>
              <h3 className="text-lg font-semibold text-giggsi-gold mb-2">
                {t('restaurant.name')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('restaurant.welcome')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t('restaurant.location')}</h4>
              <p className="text-sm text-muted-foreground">
                Beer Sheva, Israel
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            © 2024 {t('restaurant.name')}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}