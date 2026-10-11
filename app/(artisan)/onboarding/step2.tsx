import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Check, Droplets, Hammer, Paintbrush, Zap } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { translateDynamic } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useOnboardingStore } from '@/presentation/stores/onboardingStore'
import { COMPETENCES_BY_METIER } from '@/shared/constants/competences'
import { CurrencyInput, OnboardingHeader, StepIndicator } from '@/presentation/components/ui'
import { useCurrency } from '@/presentation/hooks/useCurrency'
import type { Metier } from '@/shared/constants/metiers'
import type { TarifUnit } from '@/presentation/stores/onboardingStore'

const METIER_CHIPS: { key: Metier; Icon: typeof Zap }[] = [
  { key: 'plombier', Icon: Droplets },
  { key: 'electricien', Icon: Zap },
  { key: 'peintre', Icon: Paintbrush },
  { key: 'maçon', Icon: Hammer },
]

const TARIF_UNITS: TarifUnit[] = ['heure', 'jour', 'projet']

export default function OnboardingStep2Screen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const store = useOnboardingStore()
  const currency = useCurrency()

  const [metier, setMetier] = useState<Metier | undefined>(store.metier)
  const [competences, setCompetences] = useState<string[]>(store.competences)
  // Valeur brute : chiffres uniquement (ex. "15000")
  const [tarif, setTarif] = useState(store.tarifIndicatif?.toString() ?? '')
  const [tarifUnit, setTarifUnit] = useState<TarifUnit>(store.tarifUnit)

  const steps = [
    t('artisan.onboarding.steps.informations'),
    t('artisan.onboarding.steps.activite'),
    t('artisan.onboarding.steps.realisations'),
  ]

  function selectMetier(m: Metier): void {
    if (metier === m) return
    setMetier(m)
    setCompetences([])
  }

  function toggleCompetence(slug: string): void {
    setCompetences((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug],
    )
  }

  function handleContinue(): void {
    if (!metier) return
    const parsedTarif = tarif ? parseFloat(tarif) : undefined
    store.setStep2({
      metier,
      competences,
      tarifUnit,
      ...(parsedTarif !== undefined ? { tarifIndicatif: parsedTarif } : {}),
    })
    router.push('/(artisan)/onboarding/step3')
  }

  const canContinue = !!metier && tarif.trim().length > 0

  const availableCompetences = metier ? COMPETENCES_BY_METIER[metier] : []

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <OnboardingHeader showBack />

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
            <StepIndicator steps={steps} currentStep={2} />
          </View>

          {/* ── Titre ───────────────────────────────────────────────────── */}
          <Text style={[styles.title, { color: theme.foreground }]}>
            {t('artisan.onboarding.step2.title')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
            {t('artisan.onboarding.step2.subtitle')}
          </Text>

          {/* ── Métier ──────────────────────────────────────────────────── */}
          <Text style={[styles.label, { color: theme.foreground }]}>
            {t('artisan.onboarding.step2.metier.label')}
          </Text>
          <View style={styles.metierGrid}>
            {METIER_CHIPS.map(({ key, Icon }) => {
              const selected = metier === key
              return (
                <Pressable
                  key={key}
                  onPress={() => selectMetier(key)}
                  style={[
                    styles.metierChip,
                    {
                      borderColor: selected ? theme.primary : theme.border,
                      backgroundColor: selected ? theme.primary : theme.surface,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Icon
                    size={ds.size.icon.sm}
                    color={selected ? theme.primaryForeground : theme.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.metierLabel,
                      { color: selected ? theme.primaryForeground : theme.foreground },
                    ]}
                  >
                    {translateDynamic(`metier.${key}`)}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          {/* ── Compétences ─────────────────────────────────────────────── */}
          {metier ? (
            <>
              <Text style={[styles.label, { color: theme.foreground }]}>
                {t('artisan.onboarding.step2.competences.label')}
              </Text>
              <View style={styles.competenceWrap}>
                {availableCompetences.map((slug) => {
                  const selected = competences.includes(slug)
                  return (
                    <Pressable
                      key={slug}
                      onPress={() => toggleCompetence(slug)}
                      style={[
                        styles.competenceChip,
                        {
                          borderColor: selected ? theme.primary : theme.border,
                          backgroundColor: selected ? theme.errorMuted : theme.surface,
                        },
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      {selected ? (
                        <Check size={ds.size.icon.sm} color={theme.primary} />
                      ) : null}
                      <Text
                        style={[
                          styles.competenceLabel,
                          { color: selected ? theme.primary : theme.foreground },
                        ]}
                      >
                        {translateDynamic(`artisan.competences.${slug}`)}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </>
          ) : null}

          {/* ── Tarif indicatif ──────────────────────────────────────────── */}
          <Text style={[styles.label, { color: theme.foreground }]}>
            {t('artisan.onboarding.step2.tarif.label')}
          </Text>
          <View style={styles.tarifRow}>
            <CurrencyInput
              value={tarif}
              onValueChange={setTarif}
              currency={currency}
              placeholder={t('artisan.onboarding.step2.tarif.placeholder')}
            />
            {TARIF_UNITS.map((unit) => {
              const active = tarifUnit === unit
              return (
                <Pressable
                  key={unit}
                  onPress={() => setTarifUnit(unit)}
                  style={[
                    styles.unitBtn,
                    { backgroundColor: active ? theme.primary : theme.surface, borderColor: theme.border },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.unitText,
                      { color: active ? theme.primaryForeground : theme.mutedForeground },
                    ]}
                  >
                    {t(`artisan.onboarding.step2.tarif.units.${unit}`)}
                  </Text>
                </Pressable>
              )
            })}
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
    marginBottom: ds.space[3],
    marginTop: ds.space[4],
  },
  metierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.space[2],
  },
  metierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2],
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[2] + 2,
    borderRadius: ds.radius.avatar,
    borderWidth: 1,
  },
  metierLabel: {
    ...ds.text.label,
    fontWeight: '600',
  },
  competenceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.space[2],
  },
  competenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[2],
    borderRadius: ds.radius.avatar,
    borderWidth: 1,
  },
  competenceLabel: {
    ...ds.text.label,
  },
  tarifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2],
  },
  unitBtn: {
    height: ds.size.button,
    paddingHorizontal: ds.space[3],
    borderRadius: ds.radius.input,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitText: {
    ...ds.text.label,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: ds.size.paddingH,
    paddingTop: ds.space[3],
    paddingBottom: ds.space[6],
  },
  cta: {
    height: ds.size.button,
    borderRadius: ds.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    ...ds.text.body,
    fontWeight: '700',
    fontSize: 16,
  },
})
