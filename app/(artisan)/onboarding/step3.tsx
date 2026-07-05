import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Camera, Lightbulb, Plus, X } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { useOnboardingStore } from '@/presentation/stores/onboardingStore'
import { createArtisanProfile, addArtisanPhoto } from '@/di/container'
import { compressImageForUpload } from '@/shared/utils/compressImage'
import { AppLogger } from '@/shared/logger/AppLogger'
import { StorageUploadError } from '@/shared/errors'
import { sanitizeText } from '@/shared/utils/sanitize'
import { OnboardingHeader, StepIndicator } from '@/presentation/components/ui'

const MAX_PHOTOS = 5

export default function OnboardingStep3Screen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const store = useOnboardingStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const steps = [
    t('artisan.onboarding.steps.informations'),
    t('artisan.onboarding.steps.activite'),
    t('artisan.onboarding.steps.realisations'),
  ]

  async function pickPhoto(): Promise<void> {
    if (store.photos.length >= MAX_PHOTOS) return
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
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      store.addPhoto({ uri: asset.uri, width: asset.width, height: asset.height })
    }
  }

  async function handleSubmit(): Promise<void> {
    const metier = store.metier
    if (!user || !metier) return
    setIsSubmitting(true)
    try {
      const artisan = await createArtisanProfile.execute({
        userId: user.id,
        fullName: sanitizeText(store.fullName, 100),
        phone: store.phone,
        metier,
        competences: store.competences,
        zoneGeographique: sanitizeText(store.zoneGeographique, 200),
        tarifUnit: store.tarifUnit,
        ...(store.tarifIndicatif !== undefined ? { tarifIndicatif: store.tarifIndicatif } : {}),
        ...(store.lat !== undefined ? { lat: store.lat } : {}),
        ...(store.lng !== undefined ? { lng: store.lng } : {}),
      })

      const totalPhotos = store.photos.length
      const uploadResults = await Promise.allSettled(
        store.photos.map(async (photo) => {
          const compressed = await compressImageForUpload(photo.uri, photo.width, photo.height)
          await addArtisanPhoto.execute({ artisanId: artisan.id, localUri: compressed })
        }),
      )
      const photosFailed = uploadResults.filter((r) => r.status === 'rejected').length
      uploadResults
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .forEach((r) => AppLogger.error(r.reason))

      store.reset()

      if (photosFailed > 0 && totalPhotos > 0) {
        Alert.alert(
          t('common.error.title'),
          t('artisan.onboarding.step3.photosPartialError'),
          [{ text: t('common.button.confirm'), onPress: () => router.replace('/(artisan)/onboarding/pending') }],
        )
      } else {
        router.replace('/(artisan)/onboarding/pending')
      }
    } catch (err) {
      AppLogger.error(err)
      const message = err instanceof StorageUploadError
        ? t('common.error.photoUpload')
        : t('common.error.generic')
      Alert.alert(t('common.error.title'), message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <OnboardingHeader showBack />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Progression ─────────────────────────────────────────────── */}
        <View style={styles.stepWrapper}>
          <StepIndicator steps={steps} currentStep={3} />
        </View>

        {/* ── Titre ───────────────────────────────────────────────────── */}
        <Text style={[styles.title, { color: theme.foreground }]}>
          {t('artisan.onboarding.step3.title')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.primary }]}>
          {t('artisan.onboarding.step3.subtitle')}
        </Text>

        {/* ── Grille photos ───────────────────────────────────────────── */}
        <View style={styles.photoGrid}>
          {store.photos.map((photo, index) => (
            <View key={photo.uri} style={styles.photoSlot}>
              <Image source={{ uri: photo.uri }} style={styles.photoImage} resizeMode="cover" />
              <Pressable
                onPress={() => store.removePhoto(photo.uri)}
                style={[styles.removeBtn, { backgroundColor: theme.surface }]}
                accessibilityRole="button"
              >
                <X size={12} color={theme.foreground} />
              </Pressable>
              <View style={[styles.photoLabel, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                <Camera size={12} color="#fff" />
                <Text style={styles.photoLabelText}>
                  {t('artisan.onboarding.step3.photoLabel', { n: index + 1 })}
                </Text>
              </View>
            </View>
          ))}

          {store.photos.length < MAX_PHOTOS ? (
            <Pressable
              onPress={() => void pickPhoto()}
              style={[styles.addSlot, { borderColor: theme.border, backgroundColor: theme.surface }]}
              accessibilityRole="button"
            >
              <Plus size={ds.size.icon.md} color={theme.primary} strokeWidth={2.5} />
              <Text style={[styles.addLabel, { color: theme.primary }]}>
                {t('artisan.onboarding.step3.add')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* ── Bannière info ───────────────────────────────────────────── */}
        <View
          style={[
            styles.hint,
            { backgroundColor: theme.warningMuted, borderColor: theme.warning },
          ]}
        >
          <Lightbulb size={ds.size.icon.sm} color={theme.warning} />
          <Text style={[styles.hintText, { color: theme.warning }]}>
            {t('artisan.onboarding.step3.hint')}
          </Text>
        </View>

        {/* ── CTA + conditions ────────────────────────────────────────── */}
        <View style={styles.ctaWrapper}>
          <Pressable
            onPress={() => void handleSubmit()}
            disabled={isSubmitting}
            style={[
              styles.cta,
              { backgroundColor: isSubmitting ? theme.muted : theme.primary },
            ]}
            accessibilityRole="button"
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.mutedForeground} />
            ) : (
              <Text style={[styles.ctaText, { color: theme.primaryForeground }]}>
                {t('artisan.onboarding.step3.submit')}
              </Text>
            )}
          </Pressable>

          <Text style={[styles.terms, { color: theme.mutedForeground }]}>
            {t('artisan.onboarding.step3.termsPrefix')}{' '}
            <Text
              onPress={() => router.push('/(legal)/conditions')}
              style={[styles.termsLink, { color: theme.primary }]}
              suppressHighlighting
            >
              {t('artisan.onboarding.step3.termsLink')}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: ds.size.paddingH,
    paddingBottom: ds.space[10],
  },
  stepWrapper: {
    marginTop: ds.space[4],
    marginBottom: ds.space[6],
  },
  title: {
    ...ds.text.h1,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: ds.space[2],
  },
  subtitle: {
    ...ds.text.body,
    marginBottom: ds.space[6],
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ds.space[3],
    marginBottom: ds.space[6],
  },
  photoSlot: {
    width: 140,
    height: 110,
    borderRadius: ds.radius.card,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: ds.space[2],
    right: ds.space[2],
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: ds.space[2],
  },
  photoLabelText: {
    ...ds.text.caption,
    color: '#fff',
    fontWeight: '600',
  },
  addSlot: {
    width: 140,
    height: 110,
    borderRadius: ds.radius.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ds.space[2],
  },
  addLabel: {
    ...ds.text.label,
    fontWeight: '600',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.space[3],
    borderRadius: ds.radius.card,
    borderWidth: 1,
    padding: ds.space[4],
    marginBottom: ds.space[6],
  },
  hintText: {
    ...ds.text.body,
    flex: 1,
  },
  ctaWrapper: {
    gap: ds.space[4],
    alignItems: 'center',
  },
  cta: {
    height: ds.size.button,
    borderRadius: ds.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  ctaText: {
    ...ds.text.body,
    fontWeight: '700',
    fontSize: 16,
  },
  terms: {
    ...ds.text.caption,
    textAlign: 'center',
  },
  termsLink: {
    ...ds.text.caption,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
})
