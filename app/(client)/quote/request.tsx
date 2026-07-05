import { useLayoutEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
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
import {AlertCircle, CalendarDays, X} from 'lucide-react-native'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { translateDynamic, useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { requestQuote } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { ValidationError } from '@/shared/errors'
import { Avatar, Button, ZoneSearchInput, BackButton} from '@/presentation/components/ui'
import type { ZoneResult } from '@/presentation/components/ui'

const DESCRIPTION_MIN_LENGTH = 10

// Demain à minuit — la date minimum sélectionnable
function tomorrow(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

// ---------------------------------------------------------------------------

export default function QuoteRequestScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigation = useNavigation()
  const user = useAuthStore((s) => s.user)
  const { artisanId, artisanName, artisanMetier, artisanAvatarUrl } =
    useLocalSearchParams<{ artisanId: string; artisanName: string; artisanMetier?: string; artisanAvatarUrl?: string }>()

  const [description, setDescription] = useState('')
  const [adresse, setAdresse] = useState('')
  const [disponibilite, setDisponibilite] = useState<Date | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  // iOS uniquement : valeur intermédiaire du spinner avant confirmation
  const [pickerTempDate, setPickerTempDate] = useState<Date>(tomorrow())

  const [fieldErrors, setFieldErrors] = useState<{ description?: string; adresse?: string }>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useLayoutEffect(() => {
    const parent = navigation.getParent()
    parent?.setOptions({ tabBarStyle: { display: 'none' } })
    return () => parent?.setOptions({ tabBarStyle: undefined })
  }, [navigation])

  // ── Validation locale ────────────────────────────────────────────────────

  function validate(): boolean {
    const errors: { description?: string; adresse?: string } = {}
    if (description.trim().length < DESCRIPTION_MIN_LENGTH) {
      errors.description = t('client.quoteRequest.error.descriptionTooShort')
    }
    if (!adresse.trim()) {
      errors.adresse = t('client.quoteRequest.error.addressRequired')
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Date picker handlers ─────────────────────────────────────────────────

  function handleOpenPicker(): void {
    setPickerTempDate(disponibilite ?? tomorrow())
    setShowPicker(true)
  }

  function handleAndroidChange(_event: DateTimePickerEvent, date?: Date): void {
    setShowPicker(false)
    if (date) setDisponibilite(date)
  }

  function handleIOSChange(_event: DateTimePickerEvent, date?: Date): void {
    if (date) setPickerTempDate(date)
  }

  function handleIOSConfirm(): void {
    setDisponibilite(pickerTempDate)
    setShowPicker(false)
  }

  function handleIOSCancel(): void {
    setShowPicker(false)
  }

  function handleClearDate(): void {
    setDisponibilite(null)
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSend(): Promise<void> {
    if (!user) return
    setGlobalError(null)
    if (!validate()) return

    setIsLoading(true)
    try {
      await requestQuote.execute({
        clientId: user.id,
        artisanId,
        description,
        adresse,
        ...(disponibilite ? { disponibiliteSouhaitee: disponibilite } : {}),
        notification: {
          title: t('notification.quote.newRequest.title'),
          body: t('notification.quote.newRequest.body'),
        },
      })
      router.replace({
        pathname: '/(client)/quote/confirmation',
        params: { artisanName },
      })
    } catch (err) {
      if (err instanceof ValidationError) {
        // Cas défensif : la validation use case a capté quelque chose que le composant a raté
        setGlobalError(t('common.error.generic'))
      } else {
        AppLogger.error(err)
        setGlobalError(t('common.error.generic'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const minDate = tomorrow()

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <BackButton />
          <Text style={[styles.title, { color: theme.foreground }]}>
            {t('client.quoteRequest.title')}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Carte artisan ──────────────────────────────────────────── */}
          <View style={[styles.artisanCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Avatar name={artisanName} uri={artisanAvatarUrl || undefined} size="md" />
            <View style={styles.artisanInfo}>
              <Text style={[styles.artisanName, { color: theme.foreground }]}>{artisanName}</Text>
              {artisanMetier ? (
                <Text style={[styles.artisanMetier, { color: theme.mutedForeground }]}>
                  {translateDynamic(`metier.${artisanMetier}`)}
                </Text>
              ) : null}
            </View>
          </View>

          {/* ── Description ────────────────────────────────────────────── */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.foreground }]}>
              {t('client.quoteRequest.description.label')}
            </Text>
            <TextInput
              value={description}
              onChangeText={(v) => {
                setDescription(v)
                if (fieldErrors.description && v.trim().length >= DESCRIPTION_MIN_LENGTH) {
                  setFieldErrors(({ description: _d, ...rest }) => rest)
                }
              }}
              placeholder={t('client.quoteRequest.description.placeholder')}
              placeholderTextColor={theme.mutedForeground}
              multiline
              numberOfLines={4}
              style={[
                styles.textarea,
                {
                  backgroundColor: theme.surface,
                  borderColor: fieldErrors.description ? theme.error : theme.border,
                  color: theme.foreground,
                },
              ]}
              textAlignVertical="top"
            />
            {fieldErrors.description ? (
              <Text style={[styles.fieldError, { color: theme.error }]}>
                {fieldErrors.description}
              </Text>
            ) : null}
          </View>

          {/* ── Adresse ────────────────────────────────────────────────── */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.foreground }]}>
              {t('client.quoteRequest.address.label')}
            </Text>
            <ZoneSearchInput
              value={adresse}
              placeholder={t('client.quoteRequest.address.placeholder')}
              hasError={!!fieldErrors.adresse}
              onValueChange={(v) => {
                setAdresse(v)
                if (fieldErrors.adresse && v.trim()) {
                  setFieldErrors(({ adresse: _a, ...rest }) => rest)
                }
              }}
              onLocationSelected={(result: ZoneResult) => {
                setAdresse(result.shortName)
                setFieldErrors(({ adresse: _a, ...rest }) => rest)
              }}
            />
            {fieldErrors.adresse ? (
              <Text style={[styles.fieldError, { color: theme.error }]}>
                {fieldErrors.adresse}
              </Text>
            ) : null}
          </View>

          {/* ── Disponibilité — date picker natif ──────────────────────── */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.foreground }]}>
              {t('client.quoteRequest.availability.label')}
            </Text>
            <View style={styles.dateRow}>
              <Pressable
                onPress={handleOpenPicker}
                style={[
                  styles.inputRow,
                  styles.dateInput,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                accessibilityRole="button"
              >
                <CalendarDays size={ds.size.icon.sm} color={theme.mutedForeground} />
                <Text
                  style={[
                    styles.inputText,
                    { color: disponibilite ? theme.foreground : theme.mutedForeground },
                  ]}
                  numberOfLines={1}
                >
                  {disponibilite
                    ? formatDateDisplay(disponibilite)
                    : t('client.quoteRequest.availability.placeholder')}
                </Text>
              </Pressable>

              {disponibilite ? (
                <Pressable
                  onPress={handleClearDate}
                  style={[styles.clearBtn, { backgroundColor: theme.muted }]}
                  accessibilityRole="button"
                  accessibilityLabel={t('client.quoteRequest.availability.clear')}
                >
                  <X size={ds.size.icon.sm} color={theme.mutedForeground} />
                </Pressable>
              ) : null}
            </View>

            {/* Android : picker natif affiché directement */}
            {showPicker && Platform.OS === 'android' ? (
              <DateTimePicker
                value={disponibilite ?? minDate}
                mode="date"
                display="default"
                minimumDate={minDate}
                onChange={handleAndroidChange}
              />
            ) : null}
          </View>

          {/* ── Bannière info ───────────────────────────────────────────── */}
          <View style={[styles.infoBanner, { backgroundColor: theme.muted }]}>
            <AlertCircle size={ds.size.icon.sm} color={theme.mutedForeground} />
            <Text style={[styles.infoText, { color: theme.mutedForeground }]}>
              {t('client.quoteRequest.hint')}
            </Text>
          </View>

          {/* ── Erreur globale ──────────────────────────────────────────── */}
          {globalError ? (
            <Text style={[styles.error, { color: theme.error }]}>{globalError}</Text>
          ) : null}

          <Button
            label={t('client.quoteRequest.button')}
            onPress={() => void handleSend()}
            loading={isLoading}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── iOS : date picker dans une modale ────────────────────────────── */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={handleIOSCancel}
        >
          <Pressable style={styles.modalOverlay} onPress={handleIOSCancel} />
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Pressable onPress={handleIOSCancel} hitSlop={ds.space[2]}>
                <Text style={[styles.modalAction, { color: theme.mutedForeground }]}>
                  {t('common.button.cancel')}
                </Text>
              </Pressable>
              <Pressable onPress={handleIOSConfirm} hitSlop={ds.space[2]}>
                <Text style={[styles.modalAction, { color: theme.primary }]}>
                  {t('common.button.confirm')}
                </Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={pickerTempDate}
              mode="date"
              display="spinner"
              minimumDate={minDate}
              onChange={handleIOSChange}
              style={styles.iosPicker}
            />
          </View>
        </Modal>
      ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    padding: ds.space[4],
    borderRadius: ds.radius.card,
    borderWidth: 1,
  },
  artisanInfo: { gap: 2 },
  artisanName: { ...ds.text.body, fontWeight: '700' },
  artisanMetier: { ...ds.text.label },
  field: { gap: ds.space[2] },
  label: { ...ds.text.label, fontWeight: '600' },
  fieldError: { ...ds.text.caption },
  textarea: {
    borderWidth: 1,
    borderRadius: ds.radius.input,
    padding: ds.space[3],
    minHeight: 100,
    ...ds.text.body,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    borderWidth: 1,
    borderRadius: ds.radius.input,
    paddingHorizontal: ds.size.paddingH,
    height: ds.size.input,
  },
  inputText: { flex: 1, ...ds.text.body },
  dateRow: { flexDirection: 'row', gap: ds.space[2], alignItems: 'center' },
  dateInput: { flex: 1 },
  clearBtn: {
    width: ds.size.input,
    height: ds.size.input,
    borderRadius: ds.radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.space[2],
    padding: ds.space[3],
    borderRadius: ds.radius.input,
  },
  infoText: { ...ds.text.label, flex: 1, lineHeight: 18 },
  error: { ...ds.text.label },
  // iOS modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalSheet: {
    borderTopLeftRadius: ds.radius.card,
    borderTopRightRadius: ds.radius.card,
    paddingBottom: ds.space[6],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3],
    borderBottomWidth: 1,
  },
  modalAction: { ...ds.text.body, fontWeight: '600' },
  iosPicker: { width: '100%' },
})
