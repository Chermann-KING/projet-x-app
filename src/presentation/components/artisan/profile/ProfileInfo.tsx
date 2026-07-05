import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native'
import { CheckCircle2, Mail, MapPin, Phone, User } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme, type Theme } from '@/presentation/hooks/useTheme'
import { updateArtisanProfile } from '@/di/container'
import { useField, type FieldState } from '@/hooks/useField'
import { ValidationError } from '@/shared/errors'
import {
  detectCountry,
  e164ToLocalDigits,
  getFormat,
  isFormatComplete,
} from '@/shared/constants/PhoneConstants'
import type { Artisan } from '@/domain/entities/Artisan'

// ── Private sub-components ────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  theme,
}: {
  icon: ReactNode
  label: string
  value: string
  theme: Theme
}) {
  return (
    <View style={styles.infoRow}>
      {icon}
      <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.foreground }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

function EditableInfoRow({
  icon,
  label,
  field,
  theme,
  keyboardType,
  autoCapitalize,
}: {
  icon: ReactNode
  label: string
  field: FieldState<string>
  theme: Theme
  keyboardType?: KeyboardTypeOptions
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}) {
  const { t } = useTranslation()
  const isError = field.status === 'error'

  return (
    <View>
      <View style={[styles.infoRow, isError && { borderLeftWidth: 3, borderLeftColor: theme.error }]}>
        {icon}
        <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>{label}</Text>
        <TextInput
          style={[styles.infoValue, styles.infoValueEditable, { color: theme.foreground }]}
          value={field.value}
          onChangeText={field.setValue}
          onBlur={field.onBlur}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'sentences'}
        />
        {field.isSaving ? (
          <ActivityIndicator size="small" color={theme.mutedForeground} style={styles.fieldFeedback} />
        ) : field.status === 'success' ? (
          <CheckCircle2 size={16} color={theme.success} style={styles.fieldFeedback} />
        ) : null}
      </View>
      {isError && (
        <Text style={[styles.fieldError, { color: theme.error }]}>
          {field.error?.name === 'ValidationError'
            ? t('artisan.profile.field.validationError')
            : t('artisan.profile.field.saveError')}
        </Text>
      )}
    </View>
  )
}

// ── ArtisanPhoneField ─────────────────────────────────────────────────────────
// TextInput E.164 complet. Le drapeau du pays détecté s'affiche en lecture seule
// à gauche du champ. Le + est protégé (ne peut pas être supprimé).
// Validation via isFormatComplete du pays détecté avant la sauvegarde.

function ArtisanPhoneField({
  artisan,
  onArtisanUpdate,
}: {
  artisan: Artisan
  onArtisanUpdate: (updated: Artisan) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()

  const savePhone = useCallback(async (e164: string) => {
    const country = detectCountry(e164)
    const localDigits = e164ToLocalDigits(country.dialCode, e164)
    const fmt = getFormat(country, localDigits)
    if (!isFormatComplete(fmt, localDigits)) {
      throw new ValidationError('Format de téléphone invalide')
    }
    const updated = await updateArtisanProfile.execute({
      artisanId: artisan.id,
      phone: e164,
    })
    onArtisanUpdate(updated)
  }, [artisan.id, onArtisanUpdate])

  const phoneFieldRaw = useField(artisan.phone ?? '', savePhone)

  // Protège uniquement le + : l'utilisateur peut changer l'indicatif mais pas le supprimer
  const phoneField: FieldState<string> = {
    ...phoneFieldRaw,
    setValue: (text: string) =>
      phoneFieldRaw.setValue(text.startsWith('+') ? text : `+${text.replace(/^\+*/u, '')}`),
  }

  const phoneCountry = detectCountry(phoneField.value)
  const isError = phoneField.status === 'error'

  return (
    <View>
      <View style={[styles.infoRow, isError && { borderLeftWidth: 3, borderLeftColor: theme.error }]}>
        <Phone size={ds.size.icon.sm} color={theme.mutedForeground} />
        <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>
          {t('artisan.profile.info.phone')}
        </Text>
        <View style={styles.phoneValueRow}>
          <Text style={styles.phoneFlag}>{phoneCountry.flag}</Text>
          <TextInput
            style={[styles.infoValue, styles.phoneInput, { color: theme.foreground }]}
            value={phoneField.value}
            onChangeText={phoneField.setValue}
            onBlur={phoneField.onBlur}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
        </View>
        {phoneField.isSaving ? (
          <ActivityIndicator size="small" color={theme.mutedForeground} style={styles.fieldFeedback} />
        ) : phoneField.status === 'success' ? (
          <CheckCircle2 size={16} color={theme.success} style={styles.fieldFeedback} />
        ) : null}
      </View>
      {isError && (
        <Text style={[styles.fieldError, { color: theme.error }]}>
          {phoneField.error?.name === 'ValidationError'
            ? t('artisan.profile.field.validationError')
            : t('artisan.profile.field.saveError')}
        </Text>
      )}
    </View>
  )
}

// ── ArtisanZoneField ──────────────────────────────────────────────────────────
// Champ ville avec autocomplete Nominatim.
// Le dropdown est rendu via Modal pour contourner l'overflow:hidden de infoCard.

interface NominatimResult {
  readonly place_id: number
  readonly display_name: string
  readonly lat: string
  readonly lon: string
}

const ZONE_DEBOUNCE_MS = 350
const ZONE_MIN_CHARS = 3
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

function ArtisanZoneField({
  artisan,
  onArtisanUpdate,
}: {
  artisan: Artisan
  onArtisanUpdate: (updated: Artisan) => void
}) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()

  const saveZone = useCallback(async (value: string) => {
    const updated = await updateArtisanProfile.execute({
      artisanId: artisan.id,
      zoneGeographique: value,
    })
    onArtisanUpdate(updated)
  }, [artisan.id, onArtisanUpdate])

  const zoneField = useField(artisan.zoneGeographique, saveZone)

  const [results, setResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownTop, setDropdownTop] = useState(0)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const rowRef = useRef<View>(null)

  const search = useCallback(async (query: string) => {
    if (query.trim().length < ZONE_MIN_CHARS) {
      setResults([])
      setShowDropdown(false)
      return
    }
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setIsSearching(true)
    try {
      const params = new URLSearchParams({
        q: query, format: 'json', addressdetails: '0', limit: '6',
      })
      const res = await fetch(`${NOMINATIM_URL}?${params}`, {
        signal: abortRef.current.signal,
        headers: {
          'Accept-Language': i18n.language,
          'User-Agent': 'projet-x/1.0 (companyviene@gmail.com)',
        },
      })
      if (!res.ok) throw new Error('network')
      const data: NominatimResult[] = await res.json()
      setResults(data)
      setShowDropdown(data.length > 0)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setResults([])
      setShowDropdown(false)
    } finally {
      setIsSearching(false)
    }
  }, [i18n.language])

  function handleChangeText(text: string): void {
    zoneField.setValue(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void search(text), ZONE_DEBOUNCE_MS)
  }

  function handleFocus(): void {
    rowRef.current?.measure((_x, _y, _w, height, _pageX, pageY) => {
      setDropdownTop(pageY + height)
    })
  }

  function handleSelect(result: NominatimResult): void {
    const shortName = result.display_name.split(',').slice(0, 2).join(',').trim()
    zoneField.setValue(shortName)
    setResults([])
    setShowDropdown(false)
    zoneField.onBlur()
  }

  function handleBlur(): void {
    // Delay so Pressable onPress can fire before dropdown is hidden
    setTimeout(() => {
      setShowDropdown(false)
      zoneField.onBlur()
    }, 150)
  }

  const isError = zoneField.status === 'error'

  return (
    <View>
      <View
        ref={rowRef}
        style={[styles.infoRow, isError && { borderLeftWidth: 3, borderLeftColor: theme.error }]}
      >
        <MapPin size={ds.size.icon.sm} color={theme.mutedForeground} />
        <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>
          {t('artisan.profile.info.city')}
        </Text>
        <TextInput
          style={[styles.infoValue, styles.infoValueEditable, { color: theme.foreground }]}
          value={zoneField.value}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          onFocus={handleFocus}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {isSearching || zoneField.isSaving ? (
          <ActivityIndicator size="small" color={theme.mutedForeground} style={styles.fieldFeedback} />
        ) : zoneField.status === 'success' ? (
          <CheckCircle2 size={16} color={theme.success} style={styles.fieldFeedback} />
        ) : null}
      </View>
      {isError && (
        <Text style={[styles.fieldError, { color: theme.error }]}>
          {zoneField.error?.name === 'ValidationError'
            ? t('artisan.profile.field.validationError')
            : t('artisan.profile.field.saveError')}
        </Text>
      )}

      <Modal
        visible={showDropdown}
        transparent
        animationType="none"
        onRequestClose={() => setShowDropdown(false)}
      >
        <Pressable style={styles.zoneOverlay} onPress={() => setShowDropdown(false)}>
          <View
            style={[
              styles.zoneDropdown,
              { top: dropdownTop, backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {results.map((result, index) => (
              <Pressable
                key={String(result.place_id)}
                onPress={() => handleSelect(result)}
                style={[
                  styles.zoneDropdownItem,
                  index < results.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}
              >
                <MapPin size={ds.size.icon.sm} color={theme.primary} />
                <Text
                  style={[styles.zoneDropdownText, { color: theme.foreground }]}
                  numberOfLines={2}
                >
                  {result.display_name}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

// ── ProfileInfo ───────────────────────────────────────────────────────────────
// Encapsule les useField de la section Informations.
// Monté avec key={artisan.id} pour garantir l'initialisation correcte.

interface ProfileInfoProps {
  artisan: Artisan
  userEmail: string | undefined
  onArtisanUpdate: (updated: Artisan) => void
}

export function ProfileInfo({ artisan, userEmail, onArtisanUpdate }: ProfileInfoProps) {
  const { t } = useTranslation()
  const theme = useTheme()

  const saveName = useCallback(async (value: string) => {
    const updated = await updateArtisanProfile.execute({ artisanId: artisan.id, fullName: value })
    onArtisanUpdate(updated)
  }, [artisan.id, onArtisanUpdate])

  const nameField = useField(artisan.fullName, saveName)

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
          {t('artisan.profile.sections.information')}
        </Text>
      </View>
      <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <EditableInfoRow
          icon={<User size={ds.size.icon.sm} color={theme.mutedForeground} />}
          label={t('artisan.profile.info.name')}
          field={nameField}
          theme={theme}
          autoCapitalize="words"
        />
        <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
        <ArtisanPhoneField artisan={artisan} onArtisanUpdate={onArtisanUpdate} />
        <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
        <InfoRow
          icon={<Mail size={ds.size.icon.sm} color={theme.mutedForeground} />}
          label={t('artisan.profile.info.email')}
          value={userEmail ?? '—'}
          theme={theme}
        />
        <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
        <ArtisanZoneField artisan={artisan} onArtisanUpdate={onArtisanUpdate} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: ds.space[4] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.size.paddingH,
    marginBottom: ds.space[2],
  },
  sectionTitle: { ...ds.text.label, fontWeight: '700' },

  infoCard: {
    marginHorizontal: ds.size.paddingH,
    borderRadius: ds.radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3] + 2,
  },
  infoLabel: { ...ds.text.label, width: 80 },
  infoValue: { ...ds.text.label, flex: 1, textAlign: 'right' },
  infoValueEditable: { paddingVertical: 0 },
  rowDivider: { height: 1 },

  phoneValueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: ds.space[1],
  },
  phoneFlag: { fontSize: 16, lineHeight: 20 },
  phoneInput: { flex: 0, textAlign: 'left', paddingVertical: 0 },

  fieldFeedback: { marginLeft: ds.space[1] },
  fieldError: {
    ...ds.text.caption,
    paddingHorizontal: ds.size.paddingH,
    paddingBottom: ds.space[2],
  },

  zoneOverlay: { flex: 1 },
  zoneDropdown: {
    position: 'absolute',
    left: ds.size.paddingH,
    right: ds.size.paddingH,
    borderWidth: 1,
    borderRadius: ds.radius.card,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  zoneDropdownItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.space[2],
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[3],
  },
  zoneDropdownText: { ...ds.text.caption, flex: 1, lineHeight: 18 },
})
