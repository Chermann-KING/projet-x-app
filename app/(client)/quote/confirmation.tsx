import { useLayoutEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { Check, CheckCircle2 } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { Button } from '@/presentation/components/ui'

const STEPS = ['sent', 'artisanReplies', 'rdvConfirmed'] as const

export default function QuoteConfirmationScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigation = useNavigation()
  const { artisanName } = useLocalSearchParams<{ artisanName: string }>()

  useLayoutEffect(() => {
    const parent = navigation.getParent()
    parent?.setOptions({ tabBarStyle: { display: 'none' } })
    return () => parent?.setOptions({ tabBarStyle: undefined })
  }, [navigation])

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        {/* ── Icône succès ─────────────────────────────────────────────── */}
        <View style={[styles.iconWrap, { backgroundColor: theme.successMuted }]}>
          <CheckCircle2 size={56} color={theme.success} />
        </View>

        {/* ── Titre + description ───────────────────────────────────────── */}
        <Text style={[styles.title, { color: theme.foreground }]}>
          {t('client.quoteConfirmation.title')}
        </Text>
        <Text style={[styles.desc, { color: theme.mutedForeground }]}>
          {t('client.quoteConfirmation.notifiedDesc', { artisanName: artisanName ?? '' })}
        </Text>

        {/* ── Étapes ───────────────────────────────────────────────────── */}
        <View style={[styles.stepsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {STEPS.map((step, index) => {
            const isDone = index === 0
            return (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    isDone
                      ? { backgroundColor: theme.success }
                      : { backgroundColor: theme.border },
                  ]}
                >
                  {isDone ? (
                    <Check size={16} color={theme.successForeground} strokeWidth={3} />
                  ) : (
                    <Text style={[styles.stepNum, { color: theme.mutedForeground }]}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    { color: isDone ? theme.foreground : theme.mutedForeground },
                  ]}
                >
                  {t(`client.quoteConfirmation.steps.${step}`)}
                </Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <View style={styles.actions}>
        <Button
          label={t('client.quoteConfirmation.button')}
          onPress={() => router.replace('/(client)/requests')}
        />
        <Pressable onPress={() => router.replace('/(client)/home')} style={styles.secondaryBtn}>
          <Text style={[styles.secondaryLabel, { color: theme.mutedForeground }]}>
            {t('client.quoteConfirmation.backToHome')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: ds.size.paddingH },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.space[5],
    paddingBottom: ds.space[10],
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...ds.text.h2, textAlign: 'center' },
  desc: { ...ds.text.body, textAlign: 'center', lineHeight: 22 },
  stepsCard: {
    width: '100%',
    padding: ds.space[5],
    borderRadius: ds.radius.card,
    borderWidth: 1,
    gap: ds.space[4],
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: ds.space[3] },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { ...ds.text.label, fontWeight: '700' },
  stepLabel: { ...ds.text.body, flex: 1 },
  actions: { gap: ds.space[3], paddingBottom: ds.space[8] },
  secondaryBtn: { alignItems: 'center', paddingVertical: ds.space[3] },
  secondaryLabel: { ...ds.text.label },
})
