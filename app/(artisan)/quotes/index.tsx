import { useState, useEffect, useCallback } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { ChevronRight, Clock, ClipboardList } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { translateDynamic } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getArtisanQuotes } from '@/di/container'
import type { QuoteWithClientInfo } from '@/application/artisan/GetArtisanDashboardUseCase'
import { AppLogger } from '@/shared/logger/AppLogger'
import { Avatar } from '@/presentation/components/ui'
import { formatCurrency, getCurrencyByIso } from '@/shared/constants/CurrencyConstants'
import { detectCountry } from '@/shared/constants/PhoneConstants'
import type { CurrencyInfo } from '@/shared/constants/CurrencyConstants'

type TabKey = 'toProcess' | 'sent' | 'archived'

function formatDate(date: Date): string {
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  const time = ''
  if (diffDays === 0) return translateDynamic('common.date.todayAt', { time }).trim()
  if (diffDays === 1) return translateDynamic('common.date.yesterdayAt', { time }).trim()
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function formatAmount(amount: number | null | undefined, currency: CurrencyInfo): string {
  if (!amount) return '—'
  return formatCurrency(amount, currency)
}

export default function QuotesScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id
  const currency = getCurrencyByIso(detectCountry(user?.phone ?? '').iso)
  const { tab: tabParam } = useLocalSearchParams<{ tab?: TabKey }>()
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam ?? 'toProcess')
  const [allQuotes, setAllQuotes] = useState<QuoteWithClientInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    if (!userId) return
    setIsLoading(true)
    try {
      const quotes = await getArtisanQuotes.execute(userId)
      setAllQuotes(quotes)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  useFocusEffect(useCallback(() => {
    if (tabParam) setActiveTab(tabParam)
  }, [tabParam]))

  const tabs: TabKey[] = ['toProcess', 'sent', 'archived']

  const filteredQuotes: QuoteWithClientInfo[] = allQuotes.filter((q) => {
    if (activeTab === 'toProcess') return q.status === 'pending'
    if (activeTab === 'sent') return q.status === 'sent'
    return q.status === 'accepted' || q.status === 'refused' || q.status === 'done'
  })

  function statusBadge(status: string): { label: string; bg: string; color: string } {
    switch (status) {
      case 'pending':
        return { label: t('artisan.quotes.status.pending'), bg: theme.warningMuted, color: theme.warning }
      case 'sent':
        return { label: t('artisan.quotes.status.sent'), bg: theme.errorMuted, color: theme.primary }
      case 'accepted':
        return { label: t('artisan.quotes.status.accepted'), bg: theme.successMuted, color: theme.success }
      case 'refused':
        return { label: t('artisan.quotes.status.refused'), bg: theme.errorMuted, color: theme.error }
      default:
        return { label: t('artisan.quotes.status.done'), bg: theme.muted, color: theme.mutedForeground }
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* ── Header + Tabs ─────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          {t('artisan.quotes.title')}
        </Text>
        <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
          {tabs.map((tab) => (
            <Pressable key={tab} style={styles.tab} onPress={() => setActiveTab(tab)}>
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === tab ? theme.primary : theme.mutedForeground },
                ]}
              >
                {t(`artisan.quotes.tabs.${tab}`)}
              </Text>
              {activeTab === tab && (
                <View style={[styles.tabIndicator, { backgroundColor: theme.primary }]} />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Contenu ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} size="large" />
      ) : filteredQuotes.length === 0 ? (
        <View style={styles.empty}>
          <ClipboardList size={44} color={theme.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
            {t('artisan.quotes.empty.title')}
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.mutedForeground }]}>
            {t('artisan.quotes.empty.description')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredQuotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: quote }) => {
            const badge = statusBadge(quote.status)
            return (
              <Pressable
                style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() =>
                  router.push({
                    pathname: '/(artisan)/quotes/[id]' as never,
                    params: { id: quote.id },
                  })
                }
              >
                <Avatar name={quote.clientName} uri={quote.clientAvatarUrl} size="md" />
                <View style={styles.cardContent}>
                  <View style={styles.cardRow}>
                    <Text
                      style={[styles.clientName, { color: theme.foreground }]}
                      numberOfLines={1}
                    >
                      {quote.clientName}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.amount, { color: theme.foreground }]}>
                    {formatAmount(quote.prix, currency)}
                  </Text>
                  <View style={styles.dateRow}>
                    <Clock size={12} color={theme.mutedForeground} />
                    <Text style={[styles.dateText, { color: theme.mutedForeground }]}>
                      {formatDate(new Date(quote.createdAt))}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={ds.size.icon.sm} color={theme.mutedForeground} />
              </Pressable>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: ds.size.paddingH,
    paddingTop: ds.space[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { ...ds.text.h2, marginBottom: ds.space[4] },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: ds.space[3],
    position: 'relative',
  },
  tabLabel: { ...ds.text.label, fontWeight: '600' },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  loader: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
  },
  emptyTitle: { ...ds.text.h3 },
  emptyDesc: { ...ds.text.body, textAlign: 'center' },
  list: { padding: ds.size.paddingH, gap: ds.space[3] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    padding: ds.space[4],
    borderRadius: ds.radius.card,
    borderWidth: 1,
  },
  cardContent: { flex: 1, gap: ds.space[1] },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: ds.space[2] },
  clientName: { ...ds.text.body, fontWeight: '700', flex: 1 },
  badge: {
    paddingHorizontal: ds.space[2],
    paddingVertical: 2,
    borderRadius: ds.radius.avatar,
  },
  badgeText: { ...ds.text.caption, fontWeight: '700', fontSize: 11 },
  amount: { ...ds.text.body, fontWeight: '700', fontSize: 18 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { ...ds.text.caption },
})
