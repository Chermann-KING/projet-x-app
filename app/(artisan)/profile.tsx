import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronRight, LogOut } from 'lucide-react-native'
import { translateDynamic, useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getArtisanByUserId, logout } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { LegalSection } from '@/presentation/components/ui'
import { ProfileHeader } from '@/presentation/components/artisan/profile/ProfileHeader'
import { ProfileInfo } from '@/presentation/components/artisan/profile/ProfileInfo'
import { ProfileSkills } from '@/presentation/components/artisan/profile/ProfileSkills'
import { ProfileTarif } from '@/presentation/components/artisan/profile/ProfileTarif'
import { ProfilePortfolio } from '@/presentation/components/artisan/profile/ProfilePortfolio'
import { getCurrencyFromPhone } from '@/shared/constants/PhoneConstants'
import type { Artisan } from '@/domain/entities/Artisan'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const reset = useAuthStore((s) => s.reset)
  const setAvatarUrl = useAuthStore((s) => s.setAvatarUrl)
  const [artisan, setArtisan] = useState<Artisan | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void load()
  }, [])

  async function load(): Promise<void> {
    if (!user) return
    setIsLoading(true)
    try {
      const profile = await getArtisanByUserId.execute(user.id)
      setArtisan(profile)
      if (profile) setAvatarUrl(profile.avatarUrl ?? null)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsLoading(false)
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

  const currency = getCurrencyFromPhone(artisan?.phone ?? user?.phone ?? '')
  const planLabel = artisan
    ? translateDynamic(`artisan.subscription.plans.${artisan.subscriptionPlan}.name`)
    : '—'

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          {t('artisan.profile.title')}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} size="large" />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <ProfileHeader
            artisan={artisan}
            user={user}
            currency={currency}
            planLabel={planLabel}
            onArtisanUpdate={setArtisan}
            onAvatarUrlUpdate={setAvatarUrl}
          />

          {artisan && (
            <ProfileInfo
              key={`info-${artisan.id}`}
              artisan={artisan}
              userEmail={user?.email}
              onArtisanUpdate={setArtisan}
            />
          )}

          {artisan && (
            <ProfileSkills
              key={`skills-${artisan.id}`}
              artisan={artisan}
              onArtisanUpdate={setArtisan}
            />
          )}

          {artisan && (
            <ProfileTarif
              key={`tarif-${artisan.id}`}
              artisan={artisan}
              currency={currency}
              onArtisanUpdate={setArtisan}
            />
          )}

          {artisan && (
            <ProfilePortfolio
              key={`photos-${artisan.id}`}
              artisan={artisan}
              onArtisanUpdate={setArtisan}
            />
          )}

          {artisan && (
            <View style={styles.subscriptionSection}>
              <View style={styles.subscriptionSectionHeader}>
                <Text style={[styles.subscriptionSectionTitle, { color: theme.foreground }]}>
                  {t('artisan.profile.subscription.label')}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push({
                  pathname: '/(artisan)/subscription',
                  params: { plan: artisan.subscriptionPlan },
                })}
                style={[styles.subscriptionRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                accessibilityRole="button"
              >
                <View style={styles.subscriptionInfo}>
                  <Text style={[styles.subscriptionLabel, { color: theme.mutedForeground }]}>
                    {t('artisan.subscription.current.label')}
                  </Text>
                  <Text style={[styles.subscriptionPlan, { color: theme.foreground }]}>
                    {planLabel}
                  </Text>
                </View>
                <ChevronRight size={ds.size.icon.md} color={theme.mutedForeground} />
              </Pressable>
            </View>
          )}

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
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1 },
  header: {
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[4],
    borderBottomWidth: 1,
  },
  title: { ...ds.text.h2 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: ds.space[10] },
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
  subscriptionSection: { marginBottom: ds.space[4] },
  subscriptionSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.size.paddingH,
    marginBottom: ds.space[2],
  },
  subscriptionSectionTitle: { ...ds.text.label, fontWeight: '700' },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: ds.size.paddingH,
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[4],
    borderRadius: ds.radius.card,
    borderWidth: 1,
  },
  subscriptionInfo: { flex: 1 },
  subscriptionLabel: { ...ds.text.caption, marginBottom: 2 },
  subscriptionPlan: { ...ds.text.body, fontWeight: '700' },
})
