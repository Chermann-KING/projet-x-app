import { Alert, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, CheckCircle2, Star } from 'lucide-react-native'
import { translateDynamic, useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { updateArtisanAvatar, updateArtisanBanner } from '@/di/container'
import { compressImageForUpload } from '@/shared/utils/compressImage'
import { AppLogger } from '@/shared/logger/AppLogger'
import { Avatar } from '@/presentation/components/ui'
import type { Artisan, TarifUnit } from '@/domain/entities/Artisan'
import type { User } from '@/domain/entities/User'

function getTarifRateKey(unit?: TarifUnit): string {
  if (unit === 'jour') return 'artisan.profile.rateJour'
  if (unit === 'projet') return 'artisan.profile.rateProjet'
  return 'artisan.profile.ratePerHour'
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const theme = useTheme()
  const filled = Math.round(rating)
  return (
    <View style={starStyles.row}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          color={theme.secondary}
          fill={i < filled ? theme.secondary : 'transparent'}
        />
      ))}
    </View>
  )
}

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
})

interface ProfileHeaderProps {
  artisan: Artisan | null
  user: User | null
  currency: string
  planLabel: string
  onArtisanUpdate: (updated: Artisan) => void
  onAvatarUrlUpdate: (url: string | null) => void
}

export function ProfileHeader({
  artisan,
  user,
  currency,
  planLabel,
  onArtisanUpdate,
  onAvatarUrlUpdate,
}: ProfileHeaderProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  async function pickImage(aspect?: [number, number]): Promise<ImagePicker.ImagePickerAsset | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert(t('common.error.permissionDenied'), t('common.error.galleryPermission'))
      return null
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1,
      ...(aspect !== undefined && { aspect }),
    })
    if (result.canceled || !result.assets[0]) return null
    return result.assets[0]
  }

  async function handleAvatarPress(): Promise<void> {
    if (!artisan) return
    const asset = await pickImage([1, 1])
    if (!asset) return
    try {
      const localUri = await compressImageForUpload(asset.uri, asset.width, asset.height)
      const updated = await updateArtisanAvatar.execute({
        artisanId: artisan.id,
        localUri,
        userId: user?.id,
      })
      onArtisanUpdate(updated)
      onAvatarUrlUpdate(updated.avatarUrl ?? null)
    } catch (err) {
      AppLogger.error(err)
      Alert.alert(t('common.error.title'), t('common.error.generic'))
    }
  }

  async function handleBannerPress(): Promise<void> {
    if (!artisan) return
    const asset = await pickImage([16, 9])
    if (!asset) return
    try {
      const localUri = await compressImageForUpload(asset.uri, asset.width, asset.height)
      const updated = await updateArtisanBanner.execute({ artisanId: artisan.id, localUri })
      onArtisanUpdate(updated)
    } catch (err) {
      AppLogger.error(err)
      Alert.alert(t('common.error.title'), t('common.error.generic'))
    }
  }

  return (
    <>
      {/* ── Hero banner ──────────────────────────────────────────────── */}
      <View style={styles.heroWrapper}>
        <Pressable onPress={() => void handleBannerPress()} accessibilityRole="button">
          {artisan?.bannerUrl ? (
            <ImageBackground
              source={{ uri: artisan.bannerUrl }}
              style={styles.heroBanner}
              resizeMode="cover"
            >
              <View style={[styles.bannerOverlay, { backgroundColor: `${theme.primary}33` }]} />
              <View style={styles.cameraHint}>
                <Camera size={16} color="rgba(255,255,255,0.8)" />
              </View>
            </ImageBackground>
          ) : (
            <View style={[styles.heroBanner, { backgroundColor: theme.primary }]}>
              <View style={styles.cameraHint}>
                <Camera size={16} color="rgba(255,255,255,0.5)" />
              </View>
            </View>
          )}
        </Pressable>
        <Pressable
          style={styles.avatarWrapper}
          onPress={() => void handleAvatarPress()}
          accessibilityRole="button"
        >
          <View style={[styles.avatarBorder, { backgroundColor: theme.surface }]}>
            <Avatar
              name={artisan?.fullName ?? user?.fullName ?? ''}
              size="lg"
              {...(artisan?.avatarUrl !== undefined && { uri: artisan.avatarUrl })}
            />
          </View>
        </Pressable>
      </View>

      {/* ── Infos principales ────────────────────────────────────────── */}
      <View style={styles.mainInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.fullName, { color: theme.foreground }]}>
            {artisan?.fullName ?? user?.fullName ?? '—'}
          </Text>
          {artisan?.tarifIndicatif ? (
            <Text style={[styles.rate, { color: theme.primary }]}>
              {translateDynamic(getTarifRateKey(artisan.tarifUnit), {
                amount: artisan.tarifIndicatif.toLocaleString('fr-FR'),
                currency,
              })}
            </Text>
          ) : null}
        </View>

        <View style={styles.metierRow}>
          {artisan?.metier ? (
            <Text style={[styles.metier, { color: theme.mutedForeground }]}>
              {translateDynamic(`metier.${artisan.metier}`)}
            </Text>
          ) : null}
          {artisan?.isVerified && (
            <View style={[styles.verifiedPill, { borderColor: theme.success }]}>
              <CheckCircle2 size={11} color={theme.success} />
              <Text style={[styles.verifiedPillText, { color: theme.success }]}>
                {t('artisan.profile.verified')}
              </Text>
            </View>
          )}
        </View>

        {artisan && artisan.reviewCount > 0 && (
          <View style={styles.ratingRow}>
            <StarRating rating={artisan.averageRating} />
            <Text style={[styles.ratingScore, { color: theme.foreground }]}>
              {artisan.averageRating.toFixed(1)}
            </Text>
            <Text style={[styles.ratingCount, { color: theme.mutedForeground }]}>
              {t('artisan.profile.reviews', { count: artisan.reviewCount })}
            </Text>
          </View>
        )}

        <View style={[styles.planBadge, { backgroundColor: theme.warningMuted }]}>
          <Text style={[styles.planBadgeText, { color: theme.warning }]}>
            {planLabel}
          </Text>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  heroWrapper: { position: 'relative', marginBottom: 32 },
  heroBanner: { height: 100, width: '100%', overflow: 'hidden' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject },
  cameraHint: {
    position: 'absolute',
    bottom: ds.space[2],
    right: ds.size.paddingH,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -32,
    left: ds.size.paddingH,
  },
  avatarBorder: {
    borderRadius: 999,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  mainInfo: {
    paddingHorizontal: ds.size.paddingH,
    paddingTop: ds.space[2],
    paddingBottom: ds.space[5],
    gap: ds.space[2],
    marginBottom: ds.space[4],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  fullName: { ...ds.text.h2, fontSize: 22 },
  rate: { ...ds.text.label, fontWeight: '700', fontSize: 15 },
  metierRow: { flexDirection: 'row', alignItems: 'center', gap: ds.space[2] },
  metier: { ...ds.text.label },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: ds.space[2],
    paddingVertical: 2,
    borderRadius: ds.radius.avatar,
    borderWidth: 1,
  },
  verifiedPillText: { fontSize: 11, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: ds.space[2] },
  ratingScore: { ...ds.text.label, fontWeight: '700' },
  ratingCount: { ...ds.text.caption },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[1],
    borderRadius: ds.radius.avatar,
    marginTop: ds.space[1],
  },
  planBadgeText: { ...ds.text.label, fontWeight: '700' },
})
