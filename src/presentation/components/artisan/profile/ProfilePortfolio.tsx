import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { X } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { addArtisanPhoto, deleteArtisanPhoto } from '@/di/container'
import { compressImageForUpload } from '@/shared/utils/compressImage'
import { AppLogger } from '@/shared/logger/AppLogger'
import type { Artisan, ArtisanPhoto } from '@/domain/entities/Artisan'

const MAX_PORTFOLIO_PHOTOS = 10

interface ProfilePortfolioProps {
  artisan: Artisan
  onArtisanUpdate: (updated: Artisan) => void
}

export function ProfilePortfolio({ artisan, onArtisanUpdate }: ProfilePortfolioProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleAdd(): Promise<void> {
    if (artisan.photos.length >= MAX_PORTFOLIO_PHOTOS) return
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(t('common.error.permissionDenied'), t('common.error.galleryPermission'))
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1,
    })
    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    setIsUploading(true)
    setUploadError(null)
    try {
      const localUri = await compressImageForUpload(asset.uri, asset.width, asset.height)
      const photo = await addArtisanPhoto.execute({
        artisanId: artisan.id,
        localUri,
      })
      onArtisanUpdate({ ...artisan, photos: [...artisan.photos, photo] })
    } catch (err) {
      AppLogger.error(err)
      setUploadError(t('artisan.profile.photos.errorUpload'))
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete(photo: ArtisanPhoto): Promise<void> {
    try {
      await deleteArtisanPhoto.execute({
        artisanId: artisan.id,
        photoId: photo.id,
        ...(photo.storagePath !== undefined && { storagePath: photo.storagePath }),
      })
      onArtisanUpdate({ ...artisan, photos: artisan.photos.filter((p) => p.id !== photo.id) })
    } catch (err) {
      AppLogger.error(err)
    }
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
          {t('artisan.profile.sections.photos')}
        </Text>
        <View style={styles.headerRight}>
          {isUploading && <ActivityIndicator size="small" color={theme.mutedForeground} />}
          {isDeleting && (
            <Pressable
              onPress={() => setIsDeleting(false)}
              style={styles.doneBtn}
              accessibilityRole="button"
            >
              <Text style={[styles.doneBtnText, { color: theme.primary }]}>
                {t('common.button.done')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.photoGrid}>
          {artisan.photos.map((photo) => (
            <Pressable
              key={photo.id}
              style={styles.thumbWrapper}
              onLongPress={() => setIsDeleting(true)}
              onPress={isDeleting ? () => void handleDelete(photo) : undefined}
              delayLongPress={500}
              accessibilityRole="button"
            >
              <Image
                source={{ uri: photo.url }}
                style={styles.photoThumb}
                resizeMode="cover"
              />
              {isDeleting && (
                <View style={[styles.deleteBadge, { backgroundColor: theme.error }]}>
                  <X size={11} color="#fff" />
                </View>
              )}
            </Pressable>
          ))}

          {artisan.photos.length < MAX_PORTFOLIO_PHOTOS && (
            <Pressable
              style={[styles.photoAdd, { backgroundColor: theme.muted, borderColor: theme.border }]}
              onPress={() => void handleAdd()}
              disabled={isUploading}
              accessibilityRole="button"
            >
              {isUploading ? (
                <ActivityIndicator color={theme.mutedForeground} />
              ) : (
                <>
                  <Text style={[styles.photoAddPlus, { color: theme.mutedForeground }]}>+</Text>
                  <Text style={[styles.photoAddLabel, { color: theme.mutedForeground }]}>
                    {t('artisan.profile.photos.add')}
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {uploadError !== null && (
          <Text style={[styles.fieldError, { color: theme.error, paddingTop: 0 }]}>
            {uploadError}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: ds.space[4] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.size.paddingH,
    marginBottom: ds.space[2],
  },
  sectionTitle: { ...ds.text.label, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doneBtn: { paddingHorizontal: 4, paddingVertical: 2 },
  doneBtnText: { fontSize: 14, fontWeight: '600' },

  infoCard: {
    marginHorizontal: ds.size.paddingH,
    borderRadius: ds.radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.space[2],
    padding: ds.size.paddingH,
  },
  thumbWrapper: { position: 'relative' },
  photoThumb: {
    width: 96,
    height: 96,
    borderRadius: ds.radius.sm,
  },
  deleteBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdd: {
    width: 96,
    height: 96,
    borderRadius: ds.radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddPlus: { fontSize: 24, lineHeight: 26 },
  photoAddLabel: { ...ds.text.caption, fontWeight: '600' },
  fieldError: {
    ...ds.text.caption,
    paddingHorizontal: ds.size.paddingH,
    paddingBottom: ds.space[2],
  },
})
