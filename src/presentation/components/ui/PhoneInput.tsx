import { useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Check, CheckCircle, ChevronDown, Phone, XCircle } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  formatPhoneDigits,
  getFormat,
  isFormatComplete,
} from '@/shared/constants/PhoneConstants'
import type { PhoneCountry } from '@/shared/constants/PhoneConstants'

export interface PhoneInputProps {
  /** Valeur courante (chiffres formatés avec espaces, ex: '07 12 34 56'). */
  phone: string
  onPhoneChange: (phone: string) => void
  /** Code ISO du pays sélectionné. Défaut : 'GA' (Gabon). */
  countryCode?: string
  /** Si fourni, le sélecteur de pays est activé. */
  onCountryCodeChange?: (iso: string) => void
  /** Message d'erreur externe (affiche le champ en rouge). */
  error?: string
  /** Affiche la ligne d'aide format + nom pays sous le champ. @default true */
  showHint?: boolean
  disabled?: boolean
}

/** Valide un numéro selon le format du pays. Retourne true si vide ou complet. */
export function validatePhoneNumber(phone: string, iso: string): boolean {
  if (!phone) return true
  const country = PHONE_COUNTRIES.find((c) => c.iso === iso) ?? DEFAULT_PHONE_COUNTRY
  const digits = phone.replace(/\D/g, '')
  if (!digits) return true
  const format = getFormat(country, digits)
  return isFormatComplete(format, digits)
}

/** Formate un numéro brut selon le format du pays. */
export function formatPhoneDisplay(phone: string, iso: string): string {
  const country = PHONE_COUNTRIES.find((c) => c.iso === iso) ?? DEFAULT_PHONE_COUNTRY
  const digits = phone.replace(/\D/g, '')
  const format = getFormat(country, digits)
  return formatPhoneDigits(digits, format)
}

export function PhoneInput({
  phone,
  onPhoneChange,
  countryCode,
  onCountryCodeChange,
  error,
  showHint = true,
  disabled = false,
}: PhoneInputProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [pickerOpen, setPickerOpen] = useState(false)

  const country: PhoneCountry =
    PHONE_COUNTRIES.find((c) => c.iso === (countryCode ?? DEFAULT_PHONE_COUNTRY.iso)) ??
    DEFAULT_PHONE_COUNTRY

  const rawDigits = phone.replace(/\D/g, '')
  const format = getFormat(country, rawDigits)
  const displayValue = formatPhoneDigits(rawDigits, format)
  const complete = isFormatComplete(format, rawDigits)

  const canOpenPicker = !!onCountryCodeChange && !disabled

  function handleTextChange(text: string): void {
    const newRaw = text.replace(/\D/g, '').slice(0, format.total)
    const newFormat = getFormat(country, newRaw)
    onPhoneChange(formatPhoneDigits(newRaw, newFormat))
  }

  function handleSelectCountry(selected: PhoneCountry): void {
    onCountryCodeChange?.(selected.iso)
    onPhoneChange('')
    setPickerOpen(false)
  }

  const borderColor = error ? theme.error : theme.border
  const iconColor = error ? theme.error : theme.mutedForeground

  return (
    <View>
      {/* ── Input row ───────────────────────────────────────────────────── */}
      <View
        style={[
          styles.inputRow,
          { borderColor, backgroundColor: theme.surface },
          disabled && styles.disabled,
        ]}
      >
        {/* Country button */}
        <Pressable
          onPress={() => { if (canOpenPicker) setPickerOpen(true) }}
          style={styles.countryBtn}
          disabled={!canOpenPicker}
          accessibilityRole={canOpenPicker ? 'button' : 'none'}
          accessibilityLabel={`${country.name} ${country.dialCode}`}
        >
          <Text style={styles.flag}>{country.flag}</Text>
          <Text style={[styles.dialCode, { color: theme.foreground }]}>
            {country.dialCode}
          </Text>
          {canOpenPicker && (
            <ChevronDown size={13} color={theme.mutedForeground} />
          )}
        </Pressable>

        {/* Separator */}
        <View style={[styles.separator, { backgroundColor: theme.border }]} />

        {/* Phone icon */}
        <Phone size={ds.size.icon.sm} color={iconColor} />

        {/* Text input */}
        <TextInput
          value={displayValue}
          onChangeText={handleTextChange}
          placeholder={country.placeholder}
          placeholderTextColor={theme.mutedForeground}
          style={[styles.input, { color: theme.foreground }]}
          keyboardType="phone-pad"
          editable={!disabled}
          accessibilityLabel={t('artisan.onboarding.step1.phone.label')}
        />

        {/* Status icon */}
        {rawDigits.length > 0 &&
          (complete ? (
            <CheckCircle size={ds.size.icon.sm} color={theme.success} />
          ) : (
            <Pressable
              onPress={() => onPhoneChange('')}
              accessibilityRole="button"
              accessibilityLabel={t('common.button.cancel')}
            >
              <XCircle size={ds.size.icon.sm} color={theme.mutedForeground} />
            </Pressable>
          ))}
      </View>

      {/* ── Hint ────────────────────────────────────────────────────────── */}
      {showHint && (
        <Text style={[styles.hint, { color: theme.mutedForeground }]}>
          {t('common.phone.hint', {
            placeholder: country.placeholder,
            name: country.name,
          })}
        </Text>
      )}

      {/* ── Country picker — bottom sheet ───────────────────────────────── */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        {/* Overlay tap to close */}
        <Pressable
          style={styles.overlay}
          onPress={() => setPickerOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={t('common.button.close')}
        >
          {/* Card — inner Pressable blocks event propagation */}
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.background }]}
            onPress={() => { /* block */ }}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: theme.border }]} />

            {/* Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.sheetTitle, { color: theme.mutedForeground }]}>
                {t('common.phone.selectCountry')}
              </Text>
            </View>

            {/* List */}
            <ScrollView
              style={styles.sheetList}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {PHONE_COUNTRIES.map((item) => {
                const selected = item.iso === country.iso
                return (
                  <Pressable
                    key={item.iso}
                    onPress={() => handleSelectCountry(item)}
                    style={[
                      styles.sheetRow,
                      { borderBottomColor: theme.border },
                      selected && { backgroundColor: theme.muted },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text style={styles.sheetFlag}>{item.flag}</Text>
                    <Text
                      style={[
                        styles.sheetName,
                        { color: selected ? theme.primary : theme.foreground },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.sheetDial, { color: theme.mutedForeground }]}>
                      {item.dialCode}
                    </Text>
                    {selected && (
                      <Check size={14} color={theme.primary} strokeWidth={2.5} />
                    )}
                  </Pressable>
                )
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: ds.radius.input,
    height: ds.size.input,
    paddingRight: ds.space[4],
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[1],
    paddingHorizontal: ds.space[3],
    height: '100%',
  },
  flag: {
    fontSize: 20,
    lineHeight: 24,
  },
  dialCode: {
    ...ds.text.label,
    fontWeight: '600',
  },
  separator: {
    width: 1,
    height: '55%',
    marginRight: ds.space[3],
  },
  input: {
    ...ds.text.body,
    flex: 1,
    marginLeft: ds.space[2],
    marginRight: ds.space[2],
  },
  hint: {
    ...ds.text.caption,
    marginTop: ds.space[2],
    marginLeft: ds.space[1],
  },
  // ── Modal bottom sheet ────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: ds.radius.card * 2,
    borderTopRightRadius: ds.radius.card * 2,
    paddingTop: ds.space[3],
    maxHeight: '65%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: ds.space[3],
  },
  sheetHeader: {
    paddingHorizontal: ds.space[5],
    paddingBottom: ds.space[3],
    borderBottomWidth: 1,
  },
  sheetTitle: {
    ...ds.text.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sheetList: {
    flexGrow: 0,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.space[5],
    paddingVertical: ds.space[3] + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetFlag: {
    fontSize: 22,
    lineHeight: 26,
  },
  sheetName: {
    ...ds.text.body,
    flex: 1,
    fontWeight: '500',
  },
  sheetDial: {
    ...ds.text.caption,
    fontWeight: '500',
  },
})
