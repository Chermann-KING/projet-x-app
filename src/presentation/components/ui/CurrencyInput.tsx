import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import type { CurrencyInfo } from '@/shared/constants/CurrencyConstants'

export interface CurrencyInputProps {
  /** Valeur brute : chiffres uniquement, ex. "15000" */
  value: string
  onValueChange: (raw: string) => void
  currency: CurrencyInfo
  placeholder?: string
  disabled?: boolean
}

function formatWithThousands(digits: string, sep: string): string {
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep)
}

export function CurrencyInput({
  value,
  onValueChange,
  currency,
  placeholder = '0',
  disabled = false,
}: CurrencyInputProps): React.JSX.Element {
  const theme = useTheme()
  const [isFocused, setIsFocused] = useState(false)

  // Pendant la frappe : valeur brute (pas d'espaces → backspace fluide)
  // Au repos : valeur formatée avec séparateur de milliers
  const displayValue = isFocused
    ? value
    : formatWithThousands(value, currency.thousandsSep)

  function handleChangeText(text: string): void {
    const digits = text.replace(/\D/g, '')
    onValueChange(digits)
  }

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isFocused ? theme.primary : theme.border,
          backgroundColor: theme.surface,
        },
      ]}
    >
      <TextInput
        value={displayValue}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={theme.mutedForeground}
        keyboardType="numeric"
        editable={!disabled}
        style={[styles.input, { color: theme.foreground }]}
        accessibilityLabel="tarif"
      />
      <View style={[styles.symbolPill, { backgroundColor: theme.muted }]}>
        <Text style={[styles.symbolText, { color: theme.mutedForeground }]}>
          {currency.symbol}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: ds.size.button,
    borderRadius: ds.radius.input,
    borderWidth: 1,
    paddingLeft: ds.space[4],
    paddingRight: ds.space[2],
    gap: ds.space[2],
  },
  input: {
    ...ds.text.body,
    flex: 1,
  },
  symbolPill: {
    paddingHorizontal: ds.space[3],
    paddingVertical: ds.space[1],
    borderRadius: ds.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    ...ds.text.caption,
    fontWeight: '600',
  },
})
