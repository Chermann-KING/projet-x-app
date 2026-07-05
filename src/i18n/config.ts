import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'

import fr from '@/i18n/locales/fr.json'
import en from '@/i18n/locales/en.json'
import ar from '@/i18n/locales/ar.json'
import pt from '@/i18n/locales/pt.json'
import es from '@/i18n/locales/es.json'
import sw from '@/i18n/locales/sw.json'

const SUPPORTED_LANGUAGES = ['fr', 'en', 'ar', 'pt', 'es', 'sw'] as const
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

function resolveLanguage(): SupportedLanguage {
  const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'fr'
  return SUPPORTED_LANGUAGES.includes(deviceLang as SupportedLanguage)
    ? (deviceLang as SupportedLanguage)
    : 'fr'
}

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
    pt: { translation: pt },
    es: { translation: es },
    sw: { translation: sw },
  },
  lng: resolveLanguage(),
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
