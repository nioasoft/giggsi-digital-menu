import { useTranslation } from 'react-i18next'

export function PrivacyPolicy() {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'he' || i18n.language === 'ar'

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{t('privacy.policy.title')}</h1>
        
        <div className={`prose ${isRTL ? 'prose-rtl' : ''} max-w-none text-foreground`}>
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.policy.introduction.title')}</h2>
            <p className="mb-4">{t('privacy.policy.introduction.content')}</p>
            <p className="mb-4">
              <strong>{t('privacy.policy.lastUpdated')}</strong>: {new Date().toLocaleDateString(i18n.language)}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.policy.dataController.title')}</h2>
            <p className="mb-4">
              Giggsi Sports Bar<br/>
              באר שבע, ישראל<br/>
              אימייל: privacy@giggsi.com<br/>
              טלפון: 08-1234567
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.policy.dataCollection.title')}</h2>
            <h3 className="text-xl font-medium mb-3">{t('privacy.policy.dataCollection.types')}</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>{t('privacy.policy.dataCollection.analytics')}</li>
              <li>{t('privacy.policy.dataCollection.preferences')}</li>
              <li>{t('privacy.policy.dataCollection.adminData')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.policy.purposes.title')}</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>{t('privacy.policy.purposes.service')}</li>
              <li>{t('privacy.policy.purposes.improvement')}</li>
              <li>{t('privacy.policy.purposes.legal')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.policy.rights.title')}</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>{t('privacy.policy.rights.access')}</li>
              <li>{t('privacy.policy.rights.correction')}</li>
              <li>{t('privacy.policy.rights.deletion')}</li>
              <li>{t('privacy.policy.rights.portability')}</li>
              <li>{t('privacy.policy.rights.objection')}</li>
              <li>{t('privacy.policy.rights.withdrawal')}</li>
            </ul>
            <p className="mb-4">{t('privacy.policy.rights.howTo')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.policy.cookies.title')}</h2>
            <h3 className="text-xl font-medium mb-3">{t('privacy.policy.cookies.types')}</h3>
            <div className="space-y-4 mb-4">
              <div>
                <strong className="block mb-1">{t('privacy.policy.cookies.necessary')}</strong>
                <p className="text-sm text-muted-foreground">{t('privacy.policy.cookies.necessaryDesc')}</p>
              </div>
              <div>
                <strong className="block mb-1">{t('privacy.policy.cookies.analytics')}</strong>
                <p className="text-sm text-muted-foreground">{t('privacy.policy.cookies.analyticsDesc')}</p>
              </div>
              <div>
                <strong className="block mb-1">{t('privacy.policy.cookies.marketing')}</strong>
                <p className="text-sm text-muted-foreground">{t('privacy.policy.cookies.marketingDesc')}</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.policy.security.title')}</h2>
            <p className="mb-4">{t('privacy.policy.security.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.policy.retention.title')}</h2>
            <p className="mb-4">{t('privacy.policy.retention.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.policy.thirdParties.title')}</h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Google Analytics / Google Tag Manager</li>
              <li>Vercel Analytics</li>
              <li>Supabase (Database & Authentication)</li>
            </ul>
            <p className="mb-4">{t('privacy.policy.thirdParties.note')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.policy.children.title')}</h2>
            <p className="mb-4">{t('privacy.policy.children.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.policy.changes.title')}</h2>
            <p className="mb-4">{t('privacy.policy.changes.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.policy.contact.title')}</h2>
            <p className="mb-4">{t('privacy.policy.contact.content')}</p>
            <p className="mb-4">
              אימייל: privacy@giggsi.com<br/>
              טלפון: 08-1234567<br/>
              כתובת: באר שבע, ישראל
            </p>
          </section>
        </div>

        <div className="mt-12 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            {t('privacy.policy.compliance')}
          </p>
        </div>
    </div>
  )
}