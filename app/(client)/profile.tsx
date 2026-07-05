import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { LogOut } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { useUserLocation } from '@/presentation/hooks/useUserLocation'
import { getClientRequests, getClientReviewStats, logout, updateUserAvatar } from '@/di/container'
import { compressImageForUpload } from '@/shared/utils/compressImage'
import { AppLogger } from '@/shared/logger/AppLogger'
import { LegalSection } from '@/presentation/components/ui'
import { ClientProfileIdentity } from '@/presentation/components/client/profile/ClientProfileIdentity'
import { ClientProfileStats } from '@/presentation/components/client/profile/ClientProfileStats'
import { ClientProfileInfo } from '@/presentation/components/client/profile/ClientProfileInfo'
import { ClientProfileSettings } from '@/presentation/components/client/profile/ClientProfileSettings'

interface ClientStats {
  total: number
  done: number
  avgRating: number | null
}

export default function ProfileScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const reset = useAuthStore((s) => s.reset)
  const avatarUrl = useAuthStore((s) => s.avatarUrl)
  const setAvatarUrl = useAuthStore((s) => s.setAvatarUrl)
  const { location } = useUserLocation()
  const [stats, setStats] = useState<ClientStats>({ total: 0, done: 0, avgRating: null })
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    void loadStats(user.id)
  }, [user?.id])

  async function loadStats(clientId: string): Promise<void> {
    try {
      const [quotes, reviewStats] = await Promise.all([
        getClientRequests.execute(clientId),
        getClientReviewStats.execute(clientId),
      ])
      setStats({
        total: quotes.length,
        done: quotes.filter((q) => q.status === 'done').length,
        avgRating: reviewStats.avgRating,
      })
    } catch (err) {
      AppLogger.error(err)
    }
  }

  async function handleAvatarPress(): Promise<void> {
    if (!user) return
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(t('common.error.permissionDenied'), t('common.error.galleryPermission'))
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1,
      aspect: [1, 1],
    })
    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    setIsUploadingAvatar(true)
    try {
      const localUri = await compressImageForUpload(asset.uri, asset.width, asset.height)
      const url = await updateUserAvatar.execute({ userId: user.id, localUri })
      setAvatarUrl(url)
    } catch (err) {
      AppLogger.error(err)
      Alert.alert(t('common.error.title'), t('common.error.generic'))
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  async function handleLogout(): Promise<void> {
    try {
      await logout.execute()
    } catch (err) {
      AppLogger.error(err)
    } finally {
      reset()
      router.replace('/(auth)/role')
    }
  }

  if (!user) return null

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.foreground }]}>
            {t('client.profile.title')}
          </Text>
        </View>

        <ClientProfileIdentity
          user={user}
          avatarUrl={avatarUrl}
          isUploading={isUploadingAvatar}
          onAvatarPress={() => void handleAvatarPress()}
        />

        <ClientProfileStats stats={stats} />

        <ClientProfileInfo user={user} city={location.city ?? null} />

        <ClientProfileSettings onEditPress={() => router.push('/(client)/edit-profile')} />

        <LegalSection />

        <Pressable
          onPress={() => void handleLogout()}
          style={[styles.logoutBtn, { backgroundColor: theme.errorMuted }]}
        >
          <LogOut size={ds.size.icon.md} color={theme.error} />
          <Text style={[styles.logoutLabel, { color: theme.error }]}>
            {t('client.profile.logout')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: ds.space[10] },
  header: {
    paddingHorizontal: ds.size.paddingH,
    paddingTop: ds.space[5],
    paddingBottom: ds.space[3],
  },
  title: { ...ds.text.h2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.space[2],
    marginHorizontal: ds.size.paddingH,
    height: ds.size.button,
    borderRadius: ds.radius.button,
    marginTop: ds.space[3],
  },
  logoutLabel: { ...ds.text.body, fontWeight: '700' },
})
