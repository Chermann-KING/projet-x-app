import { useState } from 'react'
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
import { router, useLocalSearchParams } from 'expo-router'
import { Lock, KeyRound } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { verifyRecoveryOtp, updatePassword } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { Button, Input, BackButton } from '@/presentation/components/ui'

type ScreenStatus = 'confirm' | 'verifying' | 'ready' | 'expired' | 'success'

export default function ResetPasswordScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { token_hash: tokenHash, type } = useLocalSearchParams<{ token_hash?: string; type?: string }>()

  const isValidLink = typeof tokenHash === 'string' && tokenHash.length > 0 && type === 'recovery'

  const [status, setStatus] = useState<ScreenStatus>(isValidLink ? 'confirm' : 'expired')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ne jamais consommer le token automatiquement au chargement de l'écran :
  // certains scanners anti-phishing (Gmail...) exécutent le JS des pages liées
  // depuis un email, pas seulement un simple GET. Un vrai clic humain sur ce
  // bouton est la seule chose qu'un scanner automatisé ne peut pas reproduire.
  async function handleConfirm(): Promise<void> {
    if (!isValidLink || typeof tokenHash !== 'string') return
    setStatus('verifying')
    try {
      await verifyRecoveryOtp.execute(tokenHash)
      setStatus('ready')
    } catch (err) {
      AppLogger.error(err)
      setStatus('expired')
    }
  }

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

            {status === 'confirm' && (
              <>
                <View style={styles.header}>
                  <Text style={[styles.title, { color: theme.foreground }]}>
                    {t('auth.resetPassword.confirm.title')}
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
                    {t('auth.resetPassword.confirm.subtitle')}
                  </Text>
                </View>
                <Button
                  label={t('auth.resetPassword.confirm.button')}
                  onPress={() => void handleConfirm()}
                />
              </>
            )}

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
