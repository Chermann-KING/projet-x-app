import { useCallback, useLayoutEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import {CheckCircle2, Circle} from 'lucide-react-native'
import { translateDynamic, useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { BackButton } from '@/presentation/components/ui'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getClientRequestById, acceptQuote, refuseQuote } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { getCurrencyByIso } from '@/shared/constants/CurrencyConstants'
import { detectCountry } from '@/shared/constants/PhoneConstants'
import type { QuoteStatus } from '@/domain/entities/Quote'
import type { QuoteWithArtisan } from '@/domain/entities/QuoteWithArtisan'
import type { Theme } from '@/presentation/hooks/useTheme'

function statusBadgeBg(status: QuoteStatus, theme: Theme): string {
  switch (status) {
    case 'sent':     return theme.warningMuted
    case 'accepted': return theme.successMuted
    case 'refused':  return theme.errorMuted
    case 'done':     return theme.successMuted
    default:         return theme.muted
  }
}

function statusBadgeColor(status: QuoteStatus, theme: Theme): string {
  switch (status) {
    case 'sent':     return theme.warning
    case 'accepted': return theme.success
    case 'refused':  return theme.error
    case 'done':     return theme.success
    default:         return theme.mutedForeground
  }
}

const TIMELINE_LABELS = ['pending', 'sent', 'accepted', 'rdv', 'done'] as const

function statusToIndex(status: QuoteStatus): number {
  switch (status) {
    case 'pending': return 0
    case 'sent': return 1
    case 'accepted': return 2
    case 'done': return 4
    default: return 0
  }
}

export default function RequestDetailScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigation = useNavigation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)

  const [quote, setQuote] = useState<QuoteWithArtisan | null>(null)

  useLayoutEffect(() => {
    const parent = navigation.getParent()
    parent?.setOptions({ tabBarStyle: { display: 'none' } })
    return () => parent?.setOptions({ tabBarStyle: undefined })
  }, [navigation])

  const loadQuote = useCallback(async (): Promise<void> => {
    try {
      const found = await getClientRequestById.execute(id)
      setQuote(found)
    } catch (err) {
      AppLogger.error(err)
    }
  }, [id])

  useFocusEffect(
    useCallback(() => {
      void loadQuote()
    }, [loadQuote]),
  )

  async function handleAccept(): Promise<void> {
    if (!quote || !user) return
    try {
      await acceptQuote.execute(quote.id, user.id)
      setQuote({ ...quote, status: 'accepted' })
    } catch (err) {
      AppLogger.error(err)
    }
  }

  async function handleRefuse(): Promise<void> {
    if (!quote || !user) return
    try {
      await refuseQuote.execute(quote.id, user.id)
      router.back()
    } catch (err) {
      AppLogger.error(err)
    }
  }

  const currentStatusIndex = quote ? statusToIndex(quote.status) : 0
  const artisanCurrency = getCurrencyByIso(detectCountry(quote?.artisanPhone ?? '').iso)

  if (!quote) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>
            {t('common.loading')}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <BackButton />
        <Text style={[styles.title, { color: theme.foreground }]}>
          {t('client.quoteDetail.trackingTitle')}
        </Text>
        <View
          style={[styles.statusBadge, { backgroundColor: statusBadgeBg(quote.status, theme) }]}
        >
          <Text style={[styles.statusText, { color: statusBadgeColor(quote.status, theme) }]}>
            {translateDynamic(`quote.status.${quote.status}`)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Timeline ─────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            {t('client.quoteDetail.trackingTitle')}
          </Text>
          {TIMELINE_LABELS.map((labelKey, index) => {
            const isDone = index < currentStatusIndex
            const isCurrent = index === currentStatusIndex
            return (
              <View key={labelKey + index} style={styles.timelineRow}>
                <View style={styles.timelineIconWrap}>
                  {isDone ? (
                    <CheckCircle2 size={20} color={theme.success} />
                  ) : (
                    <Circle
                      size={20}
                      color={isCurrent ? theme.primary : theme.border}
                      fill={isCurrent ? theme.primary : 'transparent'}
                    />
                  )}
                  {index < TIMELINE_LABELS.length - 1 ? (
                    <View
                      style={[
                        styles.timelineLine,
                        { backgroundColor: isDone ? theme.success : theme.border },
                      ]}
                    />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.timelineLabel,
                    {
                      color: isDone || isCurrent ? theme.foreground : theme.mutedForeground,
                      fontWeight: isCurrent ? '700' : '400' },
                  ]}
                >
                  {translateDynamic(`client.quoteDetail.timeline.${labelKey}`)}
                </Text>
              </View>
            )
          })}
        </View>

        {/* ── Devis reçu ───────────────────────────────────────────────── */}
        {quote.status === 'sent' && quote.prix ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
              {t('client.quoteDetail.quote.label')}
            </Text>
            <View style={styles.quoteRow}>
              <Text style={[styles.quoteLabel, { color: theme.mutedForeground }]}>
                {t('client.quoteDetail.quote.amount')}
              </Text>
              <Text style={[styles.quoteValue, { color: theme.primary }]}>
                {quote.prix.toLocaleString('fr-FR')} {artisanCurrency.symbol}
              </Text>
            </View>
            {quote.delaiPropose ? (
              <View style={styles.quoteRow}>
                <Text style={[styles.quoteLabel, { color: theme.mutedForeground }]}>
                  {t('client.quoteDetail.quote.delay')}
                </Text>
                <Text style={[styles.quoteValue, { color: theme.foreground }]}>
                  {quote.delaiPropose}
                </Text>
              </View>
            ) : null}

            {/* ── Actions ────────────────────────────────────────────────── */}
            <View style={styles.quoteActions}>
              <Pressable
                onPress={() => void handleAccept()}
                style={[styles.acceptBtn, { backgroundColor: theme.success }]}
              >
                <Text style={[styles.btnLabel, { color: theme.successForeground }]}>
                  {t('client.quoteDetail.quote.accept')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void handleRefuse()}
                style={[styles.refuseBtn, { borderColor: theme.error }]}
              >
                <Text style={[styles.btnLabel, { color: theme.error }]}>
                  {t('client.quoteDetail.quote.decline')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.negotiateBtn, { borderColor: theme.border }]}
                onPress={() =>
                  router.push({
                    pathname: '/(client)/chat/[id]' as never,
                    params: {
                      id: quote.id,
                      artisanUserId: quote.artisanUserId,
                      artisanName: quote.artisanName,
                      artisanAvatarUrl: quote.artisanAvatarUrl ?? '' } })
                }
              >
                <Text style={[styles.btnLabel, { color: theme.foreground }]}>
                  {t('client.quoteDetail.negotiate')}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : quote.status === 'pending' ? (
          <View style={[styles.card, { backgroundColor: theme.muted, borderColor: theme.border }]}>
            <Text style={[styles.noQuote, { color: theme.mutedForeground }]}>
              {t('client.quoteDetail.noQuoteYet')}
            </Text>
          </View>
        ) : null}

        {/* ── Description demande ──────────────────────────────────────── */}
        <View style={styles.desc}>
          <Text style={[styles.descLabel, { color: theme.mutedForeground }]}>
            {t('client.quoteDetail.quote.description')}
          </Text>
          <Text style={[styles.descText, { color: theme.foreground }]}>{quote.description}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...ds.text.body },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3],
    paddingTop: ds.space[4] },
  title: { ...ds.text.h3, fontSize: 17, flex: 1 },
  statusBadge: {
    paddingHorizontal: ds.space[2],
    paddingVertical: ds.space[1],
    borderRadius: ds.radius.sm },
  statusText: { ...ds.text.caption, fontWeight: '700' },
  scroll: { padding: ds.size.paddingH, gap: ds.space[4], paddingBottom: ds.space[12] },
  card: {
    borderRadius: ds.radius.card,
    borderWidth: 1,
    padding: ds.space[4],
    gap: ds.space[3] },
  sectionTitle: { ...ds.text.h3, fontSize: 15 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: ds.space[3] },
  timelineIconWrap: { alignItems: 'center', width: 20 },
  timelineLine: { width: 2, height: 28, marginTop: 2 },
  timelineLabel: { ...ds.text.body, flex: 1, paddingTop: 1 },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quoteLabel: { ...ds.text.label },
  quoteValue: { ...ds.text.label, fontWeight: '700' },
  quoteActions: { gap: ds.space[2], marginTop: ds.space[2] },
  acceptBtn: {
    height: ds.size.button,
    borderRadius: ds.radius.button,
    alignItems: 'center',
    justifyContent: 'center' },
  refuseBtn: {
    height: ds.size.button,
    borderRadius: ds.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1 },
  negotiateBtn: {
    height: ds.size.button,
    borderRadius: ds.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1 },
  btnLabel: { ...ds.text.body, fontWeight: '600' },
  noQuote: { ...ds.text.body, textAlign: 'center' },
  desc: { gap: ds.space[2] },
  descLabel: { ...ds.text.label },
  descText: { ...ds.text.body, lineHeight: 22 } })
