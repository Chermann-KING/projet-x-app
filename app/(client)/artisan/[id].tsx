import { useEffect, useLayoutEffect, useState, useCallback } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import { Linking } from 'react-native'
import { useTranslation } from '@/i18n'
import { useTheme } from '@/presentation/hooks/useTheme'
import { getArtisanProfile, getClientRequests } from '@/di/container'
import { useAuthStore } from '@/presentation/stores/authStore'
import { AppLogger } from '@/shared/logger/AppLogger'
import { PhotoViewer } from '@/presentation/components/ui'
import { ArtisanProfileHero, HERO_AVATAR_SIZE } from '@/presentation/components/client/artisanProfile/ArtisanProfileHero'
import { ArtisanProfileIdentity } from '@/presentation/components/client/artisanProfile/ArtisanProfileIdentity'
import { ArtisanProfileActions } from '@/presentation/components/client/artisanProfile/ArtisanProfileActions'
import { ArtisanProfileContent } from '@/presentation/components/client/artisanProfile/ArtisanProfileContent'
import { getCurrencyFromPhone } from '@/shared/constants/PhoneConstants'
import { ds } from '@/shared/designSystem'
import type { Artisan } from '@/domain/entities/Artisan'

export default function ArtisanProfileScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const user = useAuthStore((s) => s.user)

  const [artisan, setArtisan] = useState<Artisan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerVisible, setViewerVisible] = useState(false)

  useLayoutEffect(() => {
    const parent = navigation.getParent()
    parent?.setOptions({ tabBarStyle: { display: 'none' } })
    return () => parent?.setOptions({ tabBarStyle: undefined })
  }, [navigation])

  const loadArtisan = useCallback(async (): Promise<void> => {
    try {
      const data = await getArtisanProfile.execute(id)
      setArtisan(data)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadArtisan()
  }, [loadArtisan])

  function handleCall(): void {
    if (artisan?.phone) void Linking.openURL(`tel:${artisan.phone}`)
  }

  async function handleChat(): Promise<void> {
    if (!artisan || !user) return
    try {
      const quotes = await getClientRequests.execute(user.id)
      const match = quotes.find(
        (q) => q.artisanId === artisan.id && (q.status === 'sent' || q.status === 'accepted'),
      )
      if (match) {
        router.push({
          pathname: '/(client)/chat/[id]' as never,
          params: { id: match.id, artisanUserId: artisan.userId, artisanName: artisan.fullName, artisanAvatarUrl: artisan.avatarUrl ?? '', artisanIsOnline: artisan.isOnline ? '1' : '0', artisanPhone: artisan.phone ?? '' },
        })
      } else {
        router.push({
          pathname: '/(client)/quote/request' as never,
          params: { artisanId: artisan.id, artisanName: artisan.fullName, artisanMetier: artisan.metier, artisanAvatarUrl: artisan.avatarUrl ?? '' },
        })
      }
    } catch (err) {
      AppLogger.error(err)
    }
  }

  function handleQuote(): void {
    if (!artisan) return
    router.push({
      pathname: '/(client)/quote/request',
      params: {
        artisanId: artisan.id,
        artisanName: artisan.fullName,
        artisanMetier: artisan.metier,
        artisanAvatarUrl: artisan.avatarUrl ?? '',
      },
    })
  }

  function handleWhatsApp(): void {
    if (artisan?.phone) {
      const phone = artisan.phone.replace(/\D/g, '')
      void Linking.openURL(`https://wa.me/${phone}`)
    }
  }

  if (isLoading || !artisan) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>
          {t('common.loading')}
        </Text>
      </View>
    )
  }

  const currency = getCurrencyFromPhone(artisan.phone)
  const unitLabel = artisan.tarifUnit
    ? t(`client.artisanProfile.rate.unit.${artisan.tarifUnit}`)
    : t('client.artisanProfile.rate.unit.heure')

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ArtisanProfileHero artisan={artisan} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroSpacer} />

        <ArtisanProfileIdentity artisan={artisan} currency={currency} unitLabel={unitLabel} />

        <ArtisanProfileActions
          onCall={handleCall}
          onQuote={handleQuote}
          onChat={() => void handleChat()}
          onWhatsApp={handleWhatsApp}
        />

        <ArtisanProfileContent
          artisan={artisan}
          onPhotoPress={(index) => { setViewerIndex(index); setViewerVisible(true) }}
        />
      </ScrollView>

      <PhotoViewer
        photos={artisan.photos}
        initialIndex={viewerIndex}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...ds.text.body },
  scroll: { paddingBottom: ds.space[12] },
  heroSpacer: { height: HERO_AVATAR_SIZE / 2 + ds.space[3] },
})
