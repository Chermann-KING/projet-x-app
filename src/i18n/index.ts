import '@/i18n/config'
export { useTranslation } from 'react-i18next'

import i18n from 'i18next'
import type fr from '@/i18n/locales/fr.json'

/** Type des ressources de traduction — utilisé pour le typage i18next */
export type TranslationResources = typeof fr

/**
 * Traduit une clé construite dynamiquement à l'exécution.
 * Le t() strict de react-i18next ne peut pas vérifier statiquement les
 * template literals — cette fonction contourne le typage strict pour ces cas.
 * Accepte optionnellement un objet d'interpolation (ex. { amount: '150' }).
 */
export function translateDynamic(
  key: string,
  fallbackOrOptions?: string | Record<string, unknown>,
): string {
  if (typeof fallbackOrOptions === 'string') {
    return i18n.t(key, { defaultValue: fallbackOrOptions })
  }
  return i18n.t(key, { defaultValue: key, ...fallbackOrOptions })
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: TranslationResources
    }
  }
}
