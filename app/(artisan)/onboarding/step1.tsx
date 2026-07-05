import { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { AlertCircle, ArrowRight, User } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useUserLocation } from '@/presentation/hooks/useUserLocation'
import { useOnboardingStore } from '@/presentation/stores/onboardingStore'
import { useAuthStore } from '@/presentation/stores/authStore'
import {
  OnboardingHeader,
  PhoneInput,
  StepIndicator,
  ZoneSearchInput,
  formatPhoneDisplay,
  validatePhoneNumber,
} from '@/presentation/components/ui'
import type { ZoneResult } from '@/presentation/components/ui'
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  detectCountry,
  digitsToE164,
} from '@/shared/constants/PhoneConstants'

export default function OnboardingStep1Screen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { location } = useUserLocation()
  const store = useOnboardingStore()
  const authUser = useAuthStore((s) => s.user)

  const [fullName, setFullName] = useState(store.fullName || authUser?.fullName || '')
  const [countryCode, setCountryCode] = useState(() => {
    if (store.phoneCountryIso) return store.phoneCountryIso
    const rawE164 = store.phone || authUser?.phone || ''
    if (rawE164) return detectCountry(rawE164).iso
    return DEFAULT_PHONE_COUNTRY.iso
  })
  const [phone, setPhone] = useState(() => {
    const rawE164 = store.phone || authUser?.phone || ''
    if (!rawE164) return ''
    const country = detectCountry(rawE164)
    const e164Digits = rawE164.replace(/\D/g, '')
    const dialDigits = country.dialCode.replace(/\D/g, '')
    const intlLocal = e164Digits.startsWith(dialDigits) ? e164Digits.slice(dialDigits.length) : e164Digits
    const localDigits = country.placeholder.startsWith('0') ? `0${intlLocal}` : intlLocal
    return formatPhoneDisplay(localDigits, country.iso)
  })
  const [zone, setZone] = useState(store.zoneGeographique)

  useEffect(() => {
    if (location.granted) {
      useOnboardingStore.setState({ lat: location.lat, lng: location.lng })
    }
  }, [location])

  const steps = [
    t('artisan.onboarding.steps.informations'),
    t('artisan.onboarding.steps.activite'),
    t('artisan.onboarding.steps.realisations'),
  ]

  function handleZoneSelected(result: ZoneResult): void {
    setZone(result.shortName)
    if (!location.granted) {
      useOnboardingStore.setState({ lat: result.latitude, lng: result.longitude })
    }
  }

  function handleContinue(): void {
    const { lat, lng } = useOnboardingStore.getState()
    const digits = phone.replace(/\D/g, '')
    const selected = PHONE_COUNTRIES.find((c) => c.iso === countryCode) ?? DEFAULT_PHONE_COUNTRY
    const e164 = digitsToE164(selected.dialCode, digits)
    store.setStep1({
      fullName: fullName.trim(),
      phone: e164,
      phoneCountryIso: countryCode,
      zoneGeographique: zone.trim(),
      ...(lat !== undefined && lng !== undefined ? { lat, lng } : {}),
    })
    router.push('/(artisan)/onboarding/step2')
  }

  const rawDigits = phone.replace(/\D/g, '')
  const canContinue =
    fullName.trim().length > 0 &&
    rawDigits.length > 0 &&
    validatePhoneNumber(phone, countryCode) &&
    zone.trim().length > 0

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <OnboardingHeader showBack={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Progression ─────────────────────────────────────────────── */}
          <View style={styles.stepWrapper}>
            <StepIndicator steps={steps} currentStep={1} />
          </View>

          {/* ── Titre ───────────────────────────────────────────────────── */}
          <Text style={[styles.title, { color: theme.foreground }]}>
            {t('artisan.onboarding.step1.title')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
            {t('artisan.onboarding.step1.subtitle')}
          </Text>

          {/* ── Nom complet ─────────────────────────────────────────────── */}
          <Text style={[styles.label, { color: theme.foreground }]}>
            {t('artisan.onboarding.step1.fullName.label')}
          </Text>
          <View
            style={[
              styles.inputRow,
              { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          >
            <User size={ds.size.icon.md} color={theme.mutedForeground} />
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('artisan.onboarding.step1.fullName.placeholder')}
              placeholderTextColor={theme.mutedForeground}
              style={[styles.input, { color: theme.foreground }]}
              autoCapitalize="words"
            />
          </View>

          {/* ── Téléphone ───────────────────────────────────────────────── */}
          <Text style={[styles.label, { color: theme.foreground }]}>
            {t('artisan.onboarding.step1.phone.label')}
          </Text>
          <PhoneInput
            phone={phone}
            onPhoneChange={setPhone}
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
          />

          {/* ── Zone géographique ───────────────────────────────────────── */}
          <Text style={[styles.label, { color: theme.foreground }]}>
            {t('artisan.onboarding.step1.zone.label')}
          </Text>
          <ZoneSearchInput
            value={zone}
            onValueChange={setZone}
            onLocationSelected={handleZoneSelected}
          />

          {/* ── Bannière info ───────────────────────────────────────────── */}
          <View
            style={[
              styles.warningBanner,
              { backgroundColor: theme.warningMuted, borderColor: theme.warning },
            ]}
          >
            <AlertCircle size={ds.size.icon.md} color={theme.warning} />
            <Text style={[styles.warningText, { color: theme.warning }]}>
              {t('artisan.onboarding.step1.phoneHint')}
            </Text>
          </View>
        </ScrollView>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <Pressable
            onPress={handleContinue}
            disabled={!canContinue}
            style={[
              styles.cta,
              { backgroundColor: canContinue ? theme.primary : theme.muted },
            ]}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.ctaText,
                { color: canContinue ? theme.primaryForeground : theme.mutedForeground },
              ]}
            >
              {t('artisan.onboarding.continue')}
            </Text>
            <ArrowRight
              size={ds.size.icon.md}
              color={canContinue ? theme.primaryForeground : theme.mutedForeground}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: ds.size.paddingH,
    paddingBottom: ds.space[6],
  },
  stepWrapper: {
    marginTop: ds.space[4],
    marginBottom: ds.space[6],
  },
  title: {
    ...ds.text.h1,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: ds.space[2],
  },
  subtitle: {
    ...ds.text.body,
    marginBottom: ds.space[6],
  },
  label: {
    ...ds.text.label,
    fontWeight: '600',
    marginBottom: ds.space[2],
    marginTop: ds.space[4],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    borderWidth: 1,
    borderRadius: ds.radius.input,
    paddingHorizontal: ds.space[4],
    height: ds.size.input,
  },
  input: {
    ...ds.text.body,
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.space[3],
    borderRadius: ds.radius.card,
    borderWidth: 1,
    padding: ds.space[4],
    marginTop: ds.space[6],
  },
  warningText: {
    ...ds.text.body,
    flex: 1,
  },
  footer: {
    paddingHorizontal: ds.size.paddingH,
    paddingTop: ds.space[3],
    paddingBottom: ds.space[6],
  },
  cta: {
    width: '100%',
    height: ds.size.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.space[2],
    borderRadius: ds.radius.button,
  },
  ctaText: {
    ...ds.text.body,
    fontWeight: '700',
    fontSize: 16,
  },
})
