import { useCallback, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { MapPin, Search } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

export interface ZoneResult {
  readonly displayName: string
  readonly shortName: string
  readonly latitude: number
  readonly longitude: number
  readonly city: string
}

export interface ZoneSearchInputProps {
  value: string
  onValueChange: (text: string) => void
  onLocationSelected: (result: ZoneResult) => void
  placeholder?: string
  hasError?: boolean
  disabled?: boolean
}

interface NominatimResult {
  readonly place_id: number
  readonly display_name: string
  readonly lat: string
  readonly lon: string
  readonly address?: {
    readonly city?: string
    readonly town?: string
    readonly village?: string
    readonly municipality?: string
    readonly county?: string
  }
}

const DEBOUNCE_MS = 350
const MIN_CHARS = 3
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export function ZoneSearchInput({
  value,
  onValueChange,
  onLocationSelected,
  placeholder,
  hasError = false,
  disabled = false,
}: ZoneSearchInputProps) {
  const { t, i18n } = useTranslation()
  const theme = useTheme()

  const [results, setResults] = useState<NominatimResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const search = useCallback(
    async (query: string) => {
      if (query.trim().length < MIN_CHARS) {
        setResults([])
        return
      }

      abortRef.current?.abort()
      abortRef.current = new AbortController()

      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '6',
        })

        const res = await fetch(`${NOMINATIM_URL}?${params}`, {
          signal: abortRef.current.signal,
          headers: {
            'Accept-Language': i18n.language,
            'User-Agent': 'projet-x/1.0 (codes.smiling@gmail.com)',
          },
        })

        if (!res.ok) throw new Error('network')

        const data: NominatimResult[] = await res.json()
        setResults(data)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError(t('common.zoneSearch.networkError'))
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [t, i18n.language],
  )

  function handleChangeText(text: string): void {
    onValueChange(text)
    setError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(text), DEBOUNCE_MS)
  }

  function handleSelect(result: NominatimResult): void {
    const city =
      result.address?.city ??
      result.address?.town ??
      result.address?.village ??
      result.address?.municipality ??
      result.address?.county ??
      ''

    const shortName = result.display_name.split(',').slice(0, 2).join(',').trim()

    onValueChange(shortName)
    setResults([])

    onLocationSelected({
      displayName: result.display_name,
      shortName,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      city,
    })
  }

  return (
    <View>
      {/* ── Champ de saisie ─────────────────────────────────────────── */}
      <View
        style={[
          styles.inputRow,
          {
            borderColor: hasError ? theme.error : theme.border,
            backgroundColor: theme.surface,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.mutedForeground} />
        ) : (
          <Search size={ds.size.icon.md} color={theme.mutedForeground} />
        )}
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder ?? t('artisan.onboarding.step1.zone.placeholder')}
          placeholderTextColor={theme.mutedForeground}
          style={[styles.input, { color: theme.foreground }]}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!disabled}
        />
      </View>

      {/* ── Suggestions ─────────────────────────────────────────────── */}
      {results.length > 0 && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {results.map((result, index) => (
            <Pressable
              key={String(result.place_id)}
              onPress={() => handleSelect(result)}
              style={[
                styles.suggestion,
                index < results.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <View style={styles.pinWrapper}>
                <MapPin size={ds.size.icon.sm} color={theme.primary} />
              </View>
              <Text
                style={[styles.suggestionText, { color: theme.foreground }]}
                numberOfLines={2}
              >
                {result.display_name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* ── Erreur réseau ───────────────────────────────────────────── */}
      {error !== null && (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: theme.errorMuted, borderColor: theme.error },
          ]}
        >
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    borderWidth: 1,
    borderRadius: ds.radius.input,
    paddingHorizontal: ds.space[4],
    height: ds.size.input,
  },
  input: {
    ...ds.text.body,
    flex: 1,
  },
  dropdown: {
    marginTop: ds.space[1],
    borderWidth: 1,
    borderRadius: ds.radius.card,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ds.space[2],
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[3],
  },
  pinWrapper: {
    marginTop: 2,
  },
  suggestionText: {
    ...ds.text.caption,
    flex: 1,
    lineHeight: 18,
  },
  errorBanner: {
    marginTop: ds.space[2],
    borderWidth: 1,
    borderRadius: ds.radius.card,
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[3],
  },
  errorText: {
    ...ds.text.caption,
  },
})
