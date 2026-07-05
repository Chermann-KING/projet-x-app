import { getCurrencyByIso } from '@/shared/constants/CurrencyConstants'
import { useOnboardingStore } from '@/presentation/stores/onboardingStore'
import type { CurrencyInfo } from '@/shared/constants/CurrencyConstants'

/** Retourne la devise correspondant au pays téléphonique sélectionné en step1. */
export function useCurrency(): CurrencyInfo {
  const iso = useOnboardingStore((s) => s.phoneCountryIso)
  return getCurrencyByIso(iso)
}
