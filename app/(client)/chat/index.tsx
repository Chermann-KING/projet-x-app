import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getClientRequests } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { Avatar, EmptyState } from '@/presentation/components/ui'
import type { QuoteWithArtisan } from '@/domain/entities/QuoteWithArtisan'
import { MessageCircle } from 'lucide-react-native'

export default function ChatListScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)

  const [conversations, setConversations] = useState<QuoteWithArtisan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void loadConversations()
  }, [])

  async function loadConversations(): Promise<void> {
    if (!user) return
    setIsLoading(true)
    try {
      const quotes = await getClientRequests.execute(user.id)
      const active = quotes.filter((q) => q.status === 'accepted' || q.status === 'sent' || q.status === 'pending')
      setConversations(active)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          {t('client.chat.title')}
        </Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/(client)/chat/[id]', params: { id: item.id, artisanUserId: item.artisanUserId, artisanName: item.artisanName, artisanAvatarUrl: item.artisanAvatarUrl ?? '' } })}
            style={[styles.row, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
          >
            <Avatar name={item.artisanName} uri={item.artisanAvatarUrl || undefined} size="md" isOnline={null} />
            <View style={styles.info}>
              <View style={styles.topRow}>
                <Text style={[styles.artisanName, { color: theme.foreground }]} numberOfLines={1}>
                  {item.artisanName}
                </Text>
                <Text style={[styles.time, { color: theme.mutedForeground }]}>
                  {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Text style={[styles.preview, { color: theme.mutedForeground }]} numberOfLines={1}>
                {item.description}
              </Text>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={() => void loadConversations()}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={MessageCircle}
              title={t('client.chat.empty.title')}
              description={t('client.chat.empty.description')}
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
  list: { paddingBottom: ds.space[6] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[4],
    borderBottomWidth: 1,
  },
  info: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  artisanName: { ...ds.text.body, fontWeight: '700', flex: 1 },
  time: { ...ds.text.caption },
  preview: { ...ds.text.label },
})
