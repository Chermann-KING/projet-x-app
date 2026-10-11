import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import {Bell} from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getNotifications, markNotificationsRead } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { EmptyState, BackButton} from '@/presentation/components/ui'
import type { InboxNotification } from '@/domain/repositories/INotificationService'

export default function ArtisanNotificationsScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const [notifications, setNotifications] = useState<InboxNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void load()
  }, [user?.id])

  async function load(): Promise<void> {
    if (!user) return
    setIsLoading(true)
    try {
      const data = await getNotifications.execute(user.id)
      setNotifications(data)
      await markNotificationsRead.execute(user.id)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  function handlePress(notif: InboxNotification): void {
    if (!notif.quoteId) return
    if (notif.type === 'quote_request') {
      router.push({ pathname: '/(artisan)/quotes/[id]', params: { id: notif.quoteId } })
    } else if (notif.type === 'message') {
      router.push({ pathname: '/(artisan)/chat/[id]', params: { id: notif.quoteId } })
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <BackButton />
        <Text style={[styles.title, { color: theme.foreground }]}>
          {t('common.notifications.title')}
        </Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePress(item)}
            style={[
              styles.row,
              {
                backgroundColor: item.isRead ? theme.background : theme.surface,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: item.isRead ? 'transparent' : theme.primary }]} />
            <View style={styles.content}>
              <Text style={[styles.notifTitle, { color: theme.foreground }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.notifBody, { color: theme.mutedForeground }]} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={[styles.notifTime, { color: theme.mutedForeground }]}>
                {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={() => void load()}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={Bell}
              title={t('common.notifications.empty.title')}
              description={t('common.notifications.empty.description')}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[4],
    borderBottomWidth: 1,
  },
  title: { ...ds.text.h3, fontWeight: '700', flex: 1 },
  list: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[4],
    borderBottomWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  content: { flex: 1, gap: ds.space[1] },
  notifTitle: { ...ds.text.body, fontWeight: '700' },
  notifBody: { ...ds.text.label, lineHeight: 18 },
  notifTime: { ...ds.text.caption },
})
