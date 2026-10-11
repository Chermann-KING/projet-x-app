import { useLayoutEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import {Star} from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { leaveReview } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { Button, BackButton} from '@/presentation/components/ui'
import type { Rating } from '@/domain/entities/Review'


export default function ReviewScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigation = useNavigation()
  const { id: appointmentId, artisanId, artisanName } =
    useLocalSearchParams<{ id: string; artisanId: string; artisanName: string }>()
  const user = useAuthStore((s) => s.user)

  const [rating, setRating] = useState<Rating | null>(null)
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useLayoutEffect(() => {
    const parent = navigation.getParent()
    parent?.setOptions({ tabBarStyle: { display: 'none' } })
    return () => parent?.setOptions({ tabBarStyle: undefined })
  }, [navigation])

  async function handlePublish(): Promise<void> {
    if (!rating || !user) return
    setIsLoading(true)
    setError(null)
    try {
      await leaveReview.execute({
        appointmentId,
        clientId: user.id,
        artisanId,
        rating,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      })
      router.back()
    } catch (err) {
      AppLogger.error(err)
      setError(t('common.error.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <BackButton />
          <Text style={[styles.title, { color: theme.foreground }]}>
            {t('client.review.title')}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Artisan info ─────────────────────────────────────────────── */}
          <View style={[styles.artisanCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.artisanName, { color: theme.foreground }]}>{artisanName}</Text>
          </View>

          {/* ── Question ─────────────────────────────────────────────────── */}
          <Text style={[styles.question, { color: theme.foreground }]}>
            {t('client.review.question')}
          </Text>

          {/* ── Étoiles ──────────────────────────────────────────────────── */}
          <View style={styles.starsRow}>
            {([1, 2, 3, 4, 5] as Rating[]).map((star) => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                hitSlop={8}
              >
                <Star
                  size={40}
                  color={theme.warning}
                  fill={rating !== null && star <= rating ? theme.warning : 'transparent'}
                />
              </Pressable>
            ))}
          </View>

          {!rating ? (
            <Text style={[styles.selectHint, { color: theme.mutedForeground }]}>
              {t('client.review.selectRating')}
            </Text>
          ) : null}

          {/* ── Commentaire ──────────────────────────────────────────────── */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.foreground }]}>
              {t('client.review.comment.label')}
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder={t('client.review.comment.placeholder')}
              placeholderTextColor={theme.mutedForeground}
              multiline
              numberOfLines={4}
              style={[
                styles.textarea,
                { backgroundColor: theme.surface, borderColor: theme.border, color: theme.foreground },
              ]}
              textAlignVertical="top"
            />
          </View>

          {error ? (
            <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
          ) : null}

          <Button
            label={t('client.review.button')}
            onPress={() => void handlePublish()}
            loading={isLoading}
            disabled={!rating}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3],
    paddingTop: ds.space[4],
  },
  title: { ...ds.text.h3, fontSize: 18 },
  scroll: {
    paddingHorizontal: ds.size.paddingH,
    paddingBottom: ds.space[10],
    gap: ds.space[5],
  },
  artisanCard: {
    padding: ds.space[4],
    borderRadius: ds.radius.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  artisanName: { ...ds.text.body, fontWeight: '700' },
  question: { ...ds.text.h3, fontSize: 17, textAlign: 'center' },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: ds.space[2],
  },
  selectHint: { ...ds.text.label, textAlign: 'center' },
  field: { gap: ds.space[2] },
  label: { ...ds.text.label, fontWeight: '600' },
  textarea: {
    borderWidth: 1,
    borderRadius: ds.radius.input,
    padding: ds.space[3],
    minHeight: 100,
    ...ds.text.body,
  },
  error: { ...ds.text.label },
})
