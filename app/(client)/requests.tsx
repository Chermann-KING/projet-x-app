import { useEffect, useState, useCallback } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getClientRequests } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { EmptyState } from '@/presentation/components/ui'
import type { QuoteWithArtisan } from '@/domain/entities/QuoteWithArtisan'
import type { Quote } from '@/domain/entities/Quote'
import type { Theme } from '@/presentation/hooks/useTheme'
import { translateDynamic } from '@/i18n'
import { FileText } from 'lucide-react-native'

type TabKey = 'pending' | 'accepted' | 'history'
const TABS: TabKey[] = ['pending', 'accepted', 'history']

const STATUS_MAP: Record<TabKey, Quote['status'][]> = {
  pending: ['pending', 'sent'],
  accepted: ['accepted'],
  history: ['done', 'refused'],
}

function quoteStatusBgColor(status: Quote['status'], theme: Theme): string {
  switch (status) {
    case 'pending': return theme.warningMuted
    case 'sent': return theme.muted
    case 'accepted': return theme.successMuted
    case 'refused': return theme.errorMuted
    case 'done': return theme.successMuted
    default: return theme.muted
  }
}

function quoteStatusTextColor(status: Quote['status'], theme: Theme): string {
  switch (status) {
    case 'pending': return theme.warning
    case 'accepted': return theme.success
    case 'refused': return theme.error
    case 'done': return theme.success
    default: return theme.mutedForeground
  }
}

export default function RequestsScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id

  const [quotes, setQuotes] = useState<QuoteWithArtisan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('pending')

  const loadQuotes = useCallback(async (): Promise<void> => {
    if (!userId) return
    setIsLoading(true)
    try {
      const data = await getClientRequests.execute(userId)
      setQuotes(data)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadQuotes()
  }, [loadQuotes])

  const filteredQuotes = quotes.filter((q) => STATUS_MAP[activeTab].includes(q.status))

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          {t('client.requests.title')}
        </Text>
      </View>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
        {TABS.map((tab) => {
          const isActive = tab === activeTab
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, isActive && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? theme.primary : theme.mutedForeground },
                ]}
              >
                {t(`client.requests.tabs.${tab}`)}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* ── Liste ──────────────────────────────────────────────────────── */}
      <FlatList
        data={filteredQuotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/(client)/request/[id]', params: { id: item.id } })}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={styles.cardTop}>
              <View style={styles.artisanInfo}>
                <Text style={[styles.artisanName, { color: theme.foreground }]}>
                  {item.artisanName || t('client.requests.card.unknownArtisan')}
                </Text>
                {item.artisanMetier ? (
                  <Text style={[styles.artisanMetier, { color: theme.mutedForeground }]}>
                    {translateDynamic(`metier.${item.artisanMetier}`)}
                  </Text>
                ) : null}
                <Text style={[styles.cardDesc, { color: theme.mutedForeground }]} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: quoteStatusBgColor(item.status, theme) },
                ]}
              >
                <Text style={[styles.statusText, { color: quoteStatusTextColor(item.status, theme) }]}>
                  {translateDynamic(`quote.status.${item.status}`)}
                </Text>
              </View>
            </View>
            <Text style={[styles.cardTime, { color: theme.mutedForeground }]}>
              {new Date(item.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={() => void loadQuotes()}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={FileText}
              title={t('client.requests.empty.title')}
              description={t('client.requests.empty.description')}
            />
          ) : null
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: ds.size.paddingH,
    paddingTop: ds.space[5],
    paddingBottom: ds.space[3],
  },
  title: { ...ds.text.h2 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: ds.space[3],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ds.space[3],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { ...ds.text.label, fontWeight: '600' },
  list: { paddingHorizontal: ds.size.paddingH, paddingBottom: ds.space[6] },
  sep: { height: ds.space[3] },
  card: {
    borderRadius: ds.radius.card,
    borderWidth: 1,
    padding: ds.space[4],
    gap: ds.space[2],
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: ds.space[2] },
  artisanInfo: { flex: 1, gap: 2 },
  artisanName: { ...ds.text.label, fontWeight: '700' },
  artisanMetier: { ...ds.text.caption },
  cardDesc: { ...ds.text.label, lineHeight: 18 },
  statusBadge: {
    paddingHorizontal: ds.space[2],
    paddingVertical: ds.space[1],
    borderRadius: ds.radius.sm,
    alignSelf: 'flex-start',
  },
  statusText: { ...ds.text.caption, fontWeight: '700' },
  cardTime: { ...ds.text.caption },
})
