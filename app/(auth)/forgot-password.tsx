import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import {Mail} from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { forgotPassword } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { Button, Input, BackButton} from '@/presentation/components/ui'

export default function ForgotPasswordScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(): Promise<void> {
    if (!email.trim()) return
    setIsLoading(true)
    try {
      await forgotPassword.execute(email)
      setSent(true)
    } catch (error) {
      AppLogger.error(error)
    } finally {
      setIsLoading(false)
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
          <BackButton />

          <View style={[styles.iconWrap, { backgroundColor: theme.muted }]}>
            <Mail size={28} color={theme.primary} />
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.foreground }]}>
              {t('auth.forgotPassword.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
              {t('auth.forgotPassword.subtitle')}
            </Text>
          </View>

          {sent ? (
            <View style={[styles.successBox, { backgroundColor: theme.successMuted }]}>
              <Text style={[styles.successText, { color: '#004905' }]}>
                {t('auth.forgotPassword.success')}
              </Text>
            </View>
          ) : (
            <>
              <Input
                label={t('auth.forgotPassword.email.label')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.forgotPassword.email.placeholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={Mail}
              />
              <Button
                label={t('auth.forgotPassword.button')}
                onPress={() => void handleSubmit()}
                loading={isLoading}
              />
            </>
          )}

          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={styles.loginLink}
            accessibilityRole="link"
          >
            <Text style={[styles.loginAccent, { color: theme.accent }]}>
              {t('auth.forgotPassword.backToLogin')}
            </Text>
          </Pressable>
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
  }),
  scroll: {
    flexGrow: 1,
    paddingHorizontal: ds.size.paddingH + ds.space[1], // 20
    paddingTop: ds.space[4],
    paddingBottom: ds.space[10],
    gap: ds.space[6],
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: ds.radius.xl - 2, // 18
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { gap: ds.space[2] + 2 }, // 10
  title: {
    ...ds.text.h1,
    letterSpacing: -0.3,
  },
  subtitle: {
    ...ds.text.body,
  },
  successBox: {
    padding: ds.space[4],
    borderRadius: ds.radius.button,
  },
  successText: {
    ...ds.text.label,
    fontWeight: '500',
    textAlign: 'center',
  },
  loginLink: { alignItems: 'center', marginTop: ds.space[2] },
  loginAccent: {
    ...ds.text.label,
    fontWeight: '700',
  },
})
