import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {Mail, User} from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { updateUser } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import {
  PHONE_COUNTRIES,
  DEFAULT_PHONE_COUNTRY,
  detectCountry,
  digitsToE164,
  e164ToLocalDigits } from '@/shared/constants/PhoneConstants'
import { Button, Input, PhoneInput, formatPhoneDisplay, BackButton} from '@/presentation/components/ui'

function initPhoneState(e164: string): { countryCode: string; localPhone: string } {
  const country = detectCountry(e164)
  const localDigits = e164ToLocalDigits(country.dialCode, e164)
  return {
    countryCode: country.iso,
    localPhone: formatPhoneDisplay(localDigits, country.iso) }
}

export default function EditProfileScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const initial = initPhoneState(user?.phone ?? '')
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [countryCode, setCountryCode] = useState(initial.countryCode)
  const [localPhone, setLocalPhone] = useState(initial.localPhone)
  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSave(): Promise<void> {
    if (!user?.id) return
    const digits = localPhone.replace(/\D/g, '')
    const country = PHONE_COUNTRIES.find((c) => c.iso === countryCode) ?? DEFAULT_PHONE_COUNTRY
    const e164 = digitsToE164(country.dialCode, digits)
    setIsSaving(true)
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      const updated = await updateUser.execute(user.id, { fullName, phone: e164 })
      setUser({ ...user, ...updated })
      setSuccessMsg(t('client.profile.edit.success'))
    } catch (err) {
      AppLogger.error(err)
      setErrorMsg(t('common.error.generic'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <BackButton />
        <Text style={[styles.title, { color: theme.foreground }]}>
          {t('client.profile.edit.title')}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label={t('client.profile.fullName.label')}
            value={fullName}
            onChangeText={setFullName}
            placeholder={t('client.profile.fullName.placeholder')}
            leftIcon={User}
            autoCapitalize="words"
          />

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.primary }]}>
              {t('client.profile.phone.label')}
            </Text>
            <PhoneInput
              phone={localPhone}
              onPhoneChange={setLocalPhone}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              showHint
            />
          </View>

          <Input
            label={t('client.profile.email.label')}
            value={user?.email ?? ''}
            onChangeText={() => {}}
            leftIcon={Mail}
            editable={false}
            autoCapitalize="none"
          />

          {successMsg ? (
            <View style={[styles.banner, { backgroundColor: theme.muted }]}>
              <Text style={[styles.bannerText, { color: theme.success }]}>{successMsg}</Text>
            </View>
          ) : null}

          {errorMsg ? (
            <View style={[styles.banner, { backgroundColor: theme.errorMuted }]}>
              <Text style={[styles.bannerText, { color: theme.error }]}>{errorMsg}</Text>
            </View>
          ) : null}

          <Button
            label={t('client.profile.edit.button')}
            onPress={() => void handleSave()}
            loading={isSaving}
            disabled={!fullName.trim()}
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
    borderBottomWidth: 1 },
  title: { ...ds.text.h3 },
  scroll: {
    padding: ds.size.paddingH,
    gap: ds.space[5],
    paddingBottom: ds.space[10] },
  fieldGroup: { gap: ds.space[1] + 2 },
  fieldLabel: { ...ds.text.inputLabel },
  banner: {
    borderRadius: ds.radius.card,
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[3] },
  bannerText: { ...ds.text.label, fontWeight: '600' } })
