import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { CalendarDays, CheckCircle2, Clock, ClipboardList, Users } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { translateDynamic } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getArtisanDashboard } from '@/di/container'
import type { QuoteWithClientInfo } from '@/application/artisan/GetArtisanDashboardUseCase'
import { AppLogger } from '@/shared/logger/AppLogger'
import { NotFoundError } from '@/shared/errors'
import { AppHeader, Avatar, IconBox, Selector } from '@/presentation/components/ui'
import { useNotifBadge } from '@/presentation/hooks/useNotifBadge'
import type { Artisan } from '@/domain/entities/Artisan'

const PLAN_LIMITS: Record<string, number> = { free: 3, standard: 10, premium: Infinity }


// Signature volontairement simplifiée (pas le type i18next complet) : le type
// t complet en paramètre fait exploser la profondeur d'instanciation
// TypeScript une fois le catalogue de traductions suffisamment large. Cette
// fonction n'appelle t() qu'avec des clés littérales et une interpolation simple.
function formatRequestTime(
  date: Date,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  if (diffDays === 0) return t('common.date.todayAt', { time })
  if (diffDays === 1) return t('common.date.yesterdayAt', { time })
  return date.toLocaleDateString()
}

export default function ArtisanDashboardScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const setAppMode = useAuthStore((s) => s.setAppMode)
  const { hasUnread, refresh: refreshBadge } = useNotifBadge()
  const [artisan, setArtisan] = useState<Artisan | null>(null)
  const [pendingQuotes, setPendingQuotes] = useState<QuoteWithClientInfo[]>([])
  const [rdvTodayCount, setRdvTodayCount] = useState(0)
  const [quotesThisMonth, setQuotesThisMonth] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectorVisible, setSelectorVisible] = useState(false)

  const firstName = user?.fullName?.split(' ')[0] ?? ''

  useEffect(() => {
    void loadDashboard()
  }, [])

  useFocusEffect(useCallback(() => { refreshBadge() }, []))

  function handleSwitchToClientMode(): void {
    setAppMode('client')
    router.replace('/(client)/home')
  }

  const selectorOptions = [
    {
      label: t('common.selector.switchToClient'),
      icon: <Users size={ds.size.icon.sm} color={theme.primary} />,
      onPress: handleSwitchToClientMode,
      variant: 'primary' as const,
    },
  ]

  async function loadDashboard(): Promise<void> {
    if (!user) return
    setIsLoading(true)
    try {
      const data = await getArtisanDashboard.execute(user.id)
      setArtisan(data.artisan)
      setPendingQuotes(data.pendingQuotes)
      setRdvTodayCount(data.rdvTodayCount)
      setQuotesThisMonth(data.quotesThisMonth)
      refreshBadge()
    } catch (err) {
      // NotFoundError = profil artisan pas encore créé (onboarding en cours) — silencieux
      if (!(err instanceof NotFoundError)) AppLogger.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const plan = artisan?.subscriptionPlan ?? 'free'
  const limit = PLAN_LIMITS[plan] ?? 3
  const remaining = Math.max(0, limit - quotesThisMonth)
  const quotaRatio = limit === Infinity ? 0 : quotesThisMonth / limit
  const planLabel = translateDynamic(`artisan.subscription.plans.${plan}.name`)

  return (
    <View style={[styles.safe, { backgroundColor: theme.background }]}>
      <AppHeader
        title={t('artisan.dashboard.greeting', { name: firstName })}
        subtitle={
          <View style={styles.badgeRow}>
            {artisan ? (
              artisan.isVerified ? (
                <View style={[styles.badge, { backgroundColor: theme.errorMuted }]}>
                  <CheckCircle2 size={12} color={theme.primary} />
                  <Text style={[styles.badgeText, { color: theme.primary }]}>
                    {t('common.status.verified')}
                  </Text>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: theme.muted }]}>
                  <Clock size={12} color={theme.mutedForeground} />
                  <Text style={[styles.badgeText, { color: theme.mutedForeground }]}>
                    {t('common.status.pending')}
                  </Text>
                </View>
              )
            ) : null}
            {artisan?.metier ? (
              <Text style={[styles.metierText, { color: theme.mutedForeground }]}>
                {'· ' + translateDynamic(`metier.${artisan.metier}`)}
              </Text>
            ) : null}
          </View>
        }
        showMenu
        onMenuPress={() => setSelectorVisible(true)}
        showNotifDot={hasUnread}
        onNotifPress={() => router.push('/(artisan)/notifications')}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {/* Nouvelles demandes */}
          <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <IconBox bg={theme.errorMuted} size={40}>
              <ClipboardList size={ds.size.icon.md} color={theme.primary} />
            </IconBox>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {pendingQuotes.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>
              {t('artisan.dashboard.stats.newRequests.label')}
            </Text>
          </View>

          {/* RDV aujourd'hui */}
          <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <IconBox bg={theme.successMuted} size={40}>
              <CalendarDays size={ds.size.icon.md} color={theme.success} />
            </IconBox>
            <Text style={[styles.statValue, { color: theme.success }]}>
              {rdvTodayCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>
              {t('artisan.dashboard.stats.rdvToday.label')}
            </Text>
          </View>
        </View>

        {/* ── Quota devis ─────────────────────────────────────────────────── */}
        {limit !== Infinity ? (
          <View style={[styles.quotaCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.quotaRow}>
              <Text style={[styles.quotaTitle, { color: theme.foreground }]}>
                {t('artisan.dashboard.quota.title')}
              </Text>
              <Text style={[styles.quotaCount, { color: theme.foreground }]}>
                {quotesThisMonth}/{limit}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: theme.primary, width: `${Math.min(quotaRatio * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={[styles.quotaHint, { color: theme.mutedForeground }]}>
              {t('artisan.dashboard.quota.remaining', { plan: planLabel, remaining })}
            </Text>
          </View>
        ) : null}

        {/* ── Demandes récentes ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
              {t('artisan.dashboard.recentRequests.title')}
            </Text>
            <Pressable onPress={() => router.push('/(artisan)/quotes/index')}>
              <Text style={[styles.viewAll, { color: theme.primary }]}>
                {t('common.button.viewAll')}
              </Text>
            </Pressable>
          </View>

          {pendingQuotes.length === 0 && !isLoading ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.muted }]}>
              <ClipboardList size={32} color={theme.mutedForeground} />
              <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
                {t('artisan.quotes.empty.description')}
              </Text>
            </View>
          ) : null}

          {pendingQuotes.map((quote, index) => (
            <View
              key={quote.id}
              style={[
                styles.requestCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
                index > 0 && styles.requestCardGap,
              ]}
            >
              <View style={styles.requestTop}>
                <Avatar name={quote.clientName} size="sm" {...(quote.clientAvatarUrl ? { uri: quote.clientAvatarUrl } : {})} />
                <View style={styles.requestMeta}>
                  <View style={styles.requestNameRow}>
                    <Text style={[styles.requestName, { color: theme.foreground }]} numberOfLines={1}>
                      {quote.clientName}
                    </Text>
                    {index === 0 ? (
                      <View style={[styles.newBadge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.newBadgeText}>
                          {t('artisan.dashboard.recentRequests.new')}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.requestTime, { color: theme.mutedForeground }]}>
                    {formatRequestTime(new Date(quote.createdAt), t as unknown as (key: string, options?: Record<string, unknown>) => string)}
                  </Text>
                </View>
                <Pressable
                  style={[styles.viewBtn, { borderColor: theme.border }]}
                  onPress={() => router.push({ pathname: '/(artisan)/quotes/[id]' as never, params: { id: quote.id } })}
                >
                  <Text style={[styles.viewBtnText, { color: theme.foreground }]}>
                    {t('artisan.dashboard.recentRequests.viewButton')}
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.requestDesc, { color: theme.primary }]} numberOfLines={1}>
                {quote.description}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <Selector
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
        options={selectorOptions}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: ds.space[10] },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: ds.space[2], flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: ds.space[2],
    paddingVertical: 3,
    borderRadius: ds.radius.sm,
  },
  badgeText: { ...ds.text.caption, fontWeight: '600' },
  metierText: { ...ds.text.label },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: ds.size.paddingH,
    gap: ds.space[3],
    marginTop: ds.space[5],
    marginBottom: ds.space[4],
  },
  statCard: {
    flex: 1,
    alignItems: 'flex-start',
    padding: ds.space[4],
    borderRadius: ds.radius.card,
    borderWidth: 1,
    gap: ds.space[2],
  },
  statValue: { ...ds.text.h1, fontSize: 32, lineHeight: 36 },
  statLabel: { ...ds.text.caption },
  quotaCard: {
    marginHorizontal: ds.size.paddingH,
    padding: ds.space[4],
    borderRadius: ds.radius.card,
    borderWidth: 1,
    gap: ds.space[3],
    marginBottom: ds.space[5],
  },
  quotaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quotaTitle: { ...ds.text.label, fontWeight: '600' },
  quotaCount: { ...ds.text.label, fontWeight: '700' },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  quotaHint: { ...ds.text.caption },
  section: { paddingHorizontal: ds.size.paddingH },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.space[3],
  },
  sectionTitle: { ...ds.text.h3, fontSize: 16, fontWeight: '700' },
  viewAll: { ...ds.text.label, fontWeight: '600' },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.space[2],
    padding: ds.space[8],
    borderRadius: ds.radius.card,
  },
  emptyText: { ...ds.text.body, textAlign: 'center' },
  requestCard: {
    padding: ds.space[4],
    borderRadius: ds.radius.card,
    borderWidth: 1,
    gap: ds.space[2],
  },
  requestCardGap: { marginTop: ds.space[3] },
  requestTop: { flexDirection: 'row', alignItems: 'center', gap: ds.space[3] },
  requestMeta: { flex: 1, gap: 2 },
  requestNameRow: { flexDirection: 'row', alignItems: 'center', gap: ds.space[2] },
  requestName: { ...ds.text.body, fontWeight: '700', flex: 1 },
  newBadge: {
    paddingHorizontal: ds.space[2],
    paddingVertical: 2,
    borderRadius: ds.radius.avatar,
  },
  newBadgeText: { ...ds.text.caption, color: '#fff', fontWeight: '700', fontSize: 10 },
  requestTime: { ...ds.text.caption },
  viewBtn: {
    borderWidth: 1,
    borderRadius: ds.radius.input,
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[2],
  },
  viewBtnText: { ...ds.text.label, fontWeight: '600' },
  requestDesc: { ...ds.text.label },
})
