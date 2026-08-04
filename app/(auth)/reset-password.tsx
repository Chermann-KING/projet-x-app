import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Linking from 'expo-linking'
import { Lock, KeyRound } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { establishRecoverySession, updatePassword } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { Button, Input, BackButton } from '@/presentation/components/ui'

type ScreenStatus = 'verifying' | 'ready' | 'expired' | 'success'

interface RecoveryTokens {
  accessToken: string
  refreshToken: string
}

/** Le lien de récupération Supabase place les tokens dans le fragment "#" de l'URL, pas dans les query params. */
function parseRecoveryTokens(url: string): RecoveryTokens | null {
  const hashIndex = url.indexOf('#')
  if (hashIndex === -1) return null
  const params = new URLSearchParams(url.slice(hashIndex + 1))
  if (params.get('type') !== 'recovery') return null
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (!accessToken || !refreshToken) return null
  return { accessToken, refreshToken }
}

export default function ResetPasswordScreen() {
  const { t } = useTranslation()
  const theme = useTheme()

  const [status, setStatus] = useState<ScreenStatus>('verifying')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    async function verifyLink(url: string | null): Promise<void> {
      const tokens = url ? parseRecoveryTokens(url) : null
      if (!tokens) {
        if (active) setStatus('expired')
        return
      }
      try {
        await establishRecoverySession.execute(tokens.accessToken, tokens.refreshToken)
        if (active) setStatus('ready')
      } catch (err) {
        AppLogger.error(err)
        if (active) setStatus('expired')
      }
    }

    void Linking.getInitialURL().then(verifyLink)
    const subscription = Linking.addEventListener('url', ({ url }) => void verifyLink(url))

    return () => {
      active = false
      subscription.remove()
    }
  }, [])

  async function handleSubmit(): Promise<void> {
    if (password.length < 8) {
      setError(t('auth.resetPassword.validation.passwordMin'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('auth.resetPassword.validation.mismatch'))
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await updatePassword.execute(password)
      setStatus('success')
    } catch (err) {
      AppLogger.error(err)
      setError(t('auth.resetPassword.error.generic'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.webWrap}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {status !== 'success' && <BackButton />}

            <View style={[styles.iconWrap, { backgroundColor: theme.muted }]}>
              <KeyRound size={28} color={theme.primary} />
            </View>

            {status === 'verifying' && (
              <View style={styles.center}>
                <ActivityIndicator color={theme.primary} />
              </View>
            )}

            {status === 'expired' && (
              <>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: theme.foreground }]}>
                    {t('auth.resetPassword.expired.title')}
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
                    {t('auth.resetPassword.expired.subtitle')}
                  </Text>
                </View>
                <Button
                  label={t('auth.resetPassword.expired.button')}
                  onPress={() => router.replace('/(auth)/forgot-password')}
                />
              </>
            )}

            {status === 'ready' && (
              <>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: theme.foreground }]}>
                    {t('auth.resetPassword.title')}
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
                    {t('auth.resetPassword.subtitle')}
                  </Text>
                </View>

                <Input
                  label={t('auth.resetPassword.password.label')}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError('') }}
                  placeholder={t('auth.resetPassword.password.placeholder')}
                  secureTextEntry
                  autoCapitalize="none"
                  leftIcon={Lock}
                />
                <Input
                  label={t('auth.resetPassword.confirmPassword.label')}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setError('') }}
                  placeholder={t('auth.resetPassword.confirmPassword.placeholder')}
                  secureTextEntry
                  autoCapitalize="none"
                  leftIcon={Lock}
                  error={error}
                />
                <Button
                  label={t('auth.resetPassword.button')}
                  onPress={() => void handleSubmit()}
                  loading={isSubmitting}
                />
              </>
            )}

            {status === 'success' && (
              <>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: theme.foreground }]}>
                    {t('auth.resetPassword.success.title')}
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
                    {t('auth.resetPassword.success.subtitle')}
                  </Text>
                </View>
                <Button
                  label={t('auth.resetPassword.success.button')}
                  onPress={() => router.replace('/(auth)/login')}
                />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  webWrap: Platform.select({
    web: { flex: 1, maxWidth: 480, width: '100%', alignSelf: 'center' as const },
    default: { flex: 1 },
  }) as object,
  scroll: {
    flexGrow: 1,
    paddingHorizontal: ds.size.paddingH + ds.space[1],
    paddingTop: ds.space[4],
    paddingBottom: ds.space[10],
    gap: ds.space[6],
  },
  center: {
    alignItems: 'center',
    paddingVertical: ds.space[10],
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: ds.radius.xl - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { gap: ds.space[2] + 2 },
  title: {
    ...ds.text.h1,
    letterSpacing: -0.3,
  },
  subtitle: {
    ...ds.text.body,
  },
})
