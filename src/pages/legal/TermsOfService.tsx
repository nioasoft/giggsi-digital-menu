import { useTranslation } from 'react-i18next'

export function TermsOfService() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'he' || i18n.language === 'ar'

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{t('terms.title')}</h1>
        
        <div className={`prose ${isRTL ? 'prose-rtl' : ''} max-w-none text-foreground`}>
          <section className="mb-8">
            <p className="mb-4">
              <strong>{t('terms.lastUpdated')}</strong>: {new Date().toLocaleDateString(i18n.language)}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.acceptance.title')}</h2>
            <p className="mb-4">{t('terms.acceptance.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.use.title')}</h2>
            <p className="mb-4">{t('terms.use.content')}</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>{t('terms.use.permitted')}</li>
              <li>{t('terms.use.prohibited')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.content.title')}</h2>
            <p className="mb-4">{t('terms.content.ownership')}</p>
            <p className="mb-4">{t('terms.content.restrictions')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.disclaimer.title')}</h2>
            <p className="mb-4">{t('terms.disclaimer.content')}</p>
            <p className="mb-4">{t('terms.disclaimer.menuChanges')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.limitation.title')}</h2>
            <p className="mb-4">{t('terms.limitation.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.privacy.title')}</h2>
            <p className="mb-4">{t('terms.privacy.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.governing.title')}</h2>
            <p className="mb-4">{t('terms.governing.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.changes.title')}</h2>
            <p className="mb-4">{t('terms.changes.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.contact.title')}</h2>
            <p className="mb-4">{t('terms.contact.content')}</p>
            <p className="mb-4">
              Giggsi Sports Bar<br/>
              אימייל: info@giggsi.com<br/>
              טלפון: 08-1234567<br/>
              כתובת: באר שבע, ישראל
            </p>
          </section>
        </div>
    </div>
  )
}