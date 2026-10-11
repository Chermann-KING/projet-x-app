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
import { router, useLocalSearchParams } from 'expo-router'
import {AlertCircle, Lock, Mail, User} from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { register } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { AuthError } from '@/shared/errors'
import { Button, Input, PhoneInput, BackButton} from '@/presentation/components/ui'
import type { UserRole } from '@/domain/entities/User'
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  digitsToE164,
} from '@/shared/constants/PhoneConstants'

export default function RegisterScreen() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const { role } = useLocalSearchParams<{ role: UserRole }>()
  const { setUser } = useAuthStore()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneCountryIso, setPhoneCountryIso] = useState('GA')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!fullName.trim()) next.fullName = t('auth.register.validation.fullNameRequired')
    if (!email.trim()) next.email = t('auth.register.validation.emailRequired')
    if (password.length < 8) next.password = t('auth.register.validation.passwordMin')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleRegister(): Promise<void> {
    if (!validate()) return
    setIsLoading(true)
    setGlobalError(null)
    try {
      const phoneDigits = phone.replace(/\D/g, '')
      const selectedCountry = PHONE_COUNTRIES.find((c) => c.iso === phoneCountryIso) ?? DEFAULT_PHONE_COUNTRY
      const e164Phone = phoneDigits ? digitsToE164(selectedCountry.dialCode, phoneDigits) : ''
      const user = await register.execute(
        { fullName, email, phone: e164Phone, password, role: role ?? 'client', locale: i18n.language },
      )
      setUser(user)
      const target =
        user.role === 'artisan'
          ? '/(artisan)/dashboard'
          : '/(client)/home'
      router.replace(target)
    } catch (error) {
      AppLogger.error(error)
      const isAlreadyExists = error instanceof AuthError && error.code === 'USER_ALREADY_EXISTS'
      setGlobalError(t(isAlreadyExists ? 'auth.register.error.alreadyExists' : 'auth.register.error.generic'))
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
              {t('auth.register.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
              {t('auth.register.subtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('auth.register.fullName.label')}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t('auth.register.fullName.placeholder')}
              leftIcon={User}
              error={errors.fullName}
            />
            <Input
              label={t('auth.register.email.label')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.register.email.placeholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={Mail}
              error={errors.email}
            />
            <View style={styles.phoneWrapper}>
              <Text style={[styles.phoneLabel, { color: theme.primary }]}>
                {t('auth.register.phone.label')}
              </Text>
              <PhoneInput
                phone={phone}
                onPhoneChange={setPhone}
                countryCode={phoneCountryIso}
                onCountryCodeChange={setPhoneCountryIso}
                showHint={false}
              />
            </View>
            <Input
              label={t('auth.register.password.label')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.register.password.placeholder')}
              secureTextEntry
              autoCapitalize="none"
              leftIcon={Lock}
              error={errors.password}
            />

            <View style={[styles.hint, { backgroundColor: theme.muted }]}>
              <Text style={[styles.hintDot, { color: theme.mutedForeground }]}>•</Text>
              <Text style={[styles.hintText, { color: theme.mutedForeground }]}>
                {t('auth.register.passwordHint')}
              </Text>
            </View>
          </View>

          {globalError ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.errorMuted }]}>
              <AlertCircle size={ds.size.icon.sm} color={theme.error} />
              <Text style={[styles.errorBannerText, { color: theme.error }]}>
                {globalError}
              </Text>
            </View>
          ) : null}

          <Button
            label={t('auth.register.button')}
            onPress={() => void handleRegister()}
            loading={isLoading}
          />

          <View style={styles.separator}>
                      <View style={[styles.line, { backgroundColor: theme.border }]} />
                      <Text style={[styles.or, { color: theme.mutedForeground }]}>ou</Text>
                      <View style={[styles.line, { backgroundColor: theme.border }]} />
                    </View>

          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={styles.loginLink}
            accessibilityRole="link"
          >
            <Text style={[styles.loginText, { color: theme.mutedForeground }]}>
              {t('auth.register.haveAccount')}{' '}
              <Text style={[styles.loginAccent, { color: theme.accent }]}>
                {t('auth.register.login')}
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
    web: { flex: 1, maxWidth: 480, width: '100%', alignSelf: 'center' as const },
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
  form: { gap: ds.space[3] + 2 }, // 14
  phoneWrapper: { gap: ds.space[1] + 2 },
  phoneLabel: { ...ds.text.inputLabel },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.space[1] + 2, // 6
    padding: ds.space[3],
    borderRadius: ds.radius.sm + 2, // 10
  },
  hintDot: {
    ...ds.text.label,
    lineHeight: ds.space[5],
  },
  hintText: {
    ...ds.text.label,
    lineHeight: ds.space[5],
    flex: 1,
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
  loginLink: { alignItems: 'center' },
  loginText: {
    ...ds.text.label,
  },
  loginAccent: {
    ...ds.text.label,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2],
    padding: ds.space[3],
    borderRadius: ds.radius.input,
  },
  errorBannerText: {
    ...ds.text.label,
    flex: 1,
  },
})
