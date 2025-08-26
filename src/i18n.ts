import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enTranslations from './locales/en.json'
import heTranslations from './locales/he.json'
import arTranslations from './locales/ar.json'
import ruTranslations from './locales/ru.json'

const resources = {
  en: { translation: enTranslations },
  he: { translation: heTranslations },
  ar: { translation: arTranslations },
  ru: { translation: ruTranslations },
}

console.log('Initializing i18n...')

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'he', // Hebrew as default for Israeli restaurant
    debug: true, // Enable debug to see what's happening
    lng: 'he', // Set default language explicitly
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })
  .then(() => {
    console.log('i18n initialized successfully')
    console.log('Current language:', i18n.language)
    console.log('Available languages:', Object.keys(resources))
  })
  .catch((error) => {
    console.error('Failed to initialize i18n:', error)
  })

export default i18n