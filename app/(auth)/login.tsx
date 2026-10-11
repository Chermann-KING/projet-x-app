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
import {Lock, Mail} from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { login } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { AuthError } from '@/shared/errors'
import { Button, Input, BackButton} from '@/presentation/components/ui'

export default function LoginScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const { setUser } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [credentialsError, setCredentialsError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function validate(): boolean {
    if (!email.trim()) {
      setEmailError(t('auth.login.email.label') + ' requis')
      return false
    }
    setEmailError('')
    return true
  }

  async function handleLogin(): Promise<void> {
    if (!validate()) return
    setCredentialsError('')
    setIsLoading(true)
    try {
      const user = await login.execute(email, password)
      setUser(user)
      const target =
        user.role === 'artisan'
          ? '/(artisan)/dashboard'
          : user.role === 'admin'
            ? '/(admin)/'
            : '/(client)/home'
      router.replace(target as Parameters<typeof router.replace>[0])
    } catch (error) {
      if (error instanceof AuthError) {
        setCredentialsError(t('auth.login.error.invalidCredentials'))
      } else {
        AppLogger.error(error)
      }
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

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.foreground }]}>
              {t('auth.login.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
              {t('auth.login.subtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('auth.login.email.label')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.login.email.placeholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={Mail}
              error={emailError}
            />
            <Input
              label={t('auth.login.password.label')}
              value={password}
              onChangeText={(v) => { setPassword(v); setCredentialsError('') }}
              placeholder={t('auth.login.password.placeholder')}
              secureTextEntry
              autoCapitalize="none"
              leftIcon={Lock}
              error={credentialsError}
            />

            <Pressable
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotLink}
              accessibilityRole="link"
            >
              <Text style={[styles.forgotText, { color: theme.accent }]}>
                {t('auth.login.forgotPassword')}
              </Text>
            </Pressable>
          </View>

          <Button
            label={t('auth.login.button')}
            onPress={() => void handleLogin()}
            loading={isLoading}
          />

          <View style={styles.separator}>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <Text style={[styles.or, { color: theme.mutedForeground }]}>ou</Text>
            <View style={[styles.line, { backgroundColor: theme.border }]} />
          </View>

          <Pressable
            onPress={() => router.push('/(auth)/role')}
            style={styles.registerLink}
            accessibilityRole="link"
          >
            <Text style={[styles.registerText, { color: theme.mutedForeground }]}>
              {t('auth.login.noAccount')}{' '}
              <Text style={[styles.registerAccent, { color: theme.accent }]}>
                {t('auth.login.register')}
              </Text>
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
    web: {
      flex: 1,
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center' as const,
    },
    default: { flex: 1 },
  }),
  scroll: {
    flexGrow: 1,
    paddingHorizontal: ds.size.paddingH + ds.space[1], // 20
    paddingTop: ds.space[4],
    paddingBottom: ds.space[10],
    gap: ds.space[7],
  },
  header: { gap: ds.space[1] + 2 }, // 6
  title: {
    ...ds.text.h1,
    fontSize: 30,
    letterSpacing: -0.3,
  },
  subtitle: {
    ...ds.text.body,
  },
  form: { gap: ds.space[4] },
  forgotLink: { alignSelf: 'flex-end' },
  forgotText: {
    ...ds.text.label,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
  },
  line: { flex: 1, height: 1 },
  or: {
    ...ds.text.label,
  },
  registerLink: { alignItems: 'center' },
  registerText: {
    ...ds.text.label,
  },
  registerAccent: {
    ...ds.text.label,
    fontWeight: '700',
  },
})
