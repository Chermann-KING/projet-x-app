import { useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native'
import type { ReactElement } from 'react'
import { AlertTriangle, Eye, EyeOff, type LucideIcon } from 'lucide-react-native'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

interface InputProps {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  error?: string
  secureTextEntry?: boolean
  keyboardType?: KeyboardTypeOptions
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  editable?: boolean
  leftIcon?: LucideIcon
  rightElement?: ReactElement
  prefix?: string
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  leftIcon: LeftIcon,
  rightElement,
  prefix,
}: InputProps) {
  const theme = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const borderColor = error
    ? theme.error
    : isFocused
      ? theme.primary
      : theme.border

  const iconColor = isFocused ? theme.primary : theme.mutedForeground

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.primary }]}>{label}</Text>

      <View
        style={[
          styles.row,
          { borderColor, backgroundColor: theme.input },
        ]}
      >
        {LeftIcon ? (
          <LeftIcon size={ds.size.icon.md} color={iconColor} />
        ) : null}

        {prefix ? (
          <View style={[styles.prefix, { borderRightColor: theme.border }]}>
            <Text style={[styles.prefixText, { color: theme.mutedForeground }]}>
              {prefix}
            </Text>
          </View>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.mutedForeground}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.textInput, { color: theme.foreground }]}
          accessibilityLabel={label}
        />

        {secureTextEntry ? (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={ds.space[2]}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Masquer' : 'Afficher'}
          >
            {showPassword ? (
              <EyeOff size={ds.size.icon.md} color={theme.mutedForeground} />
            ) : (
              <Eye size={ds.size.icon.md} color={theme.mutedForeground} />
            )}
          </Pressable>
        ) : rightElement ? (
          rightElement
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <AlertTriangle size={ds.size.icon.xs} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: ds.space[1] + 2, // 6
  },
  label: {
    ...ds.text.inputLabel,
  },
  row: {
    height: ds.size.input,
    borderRadius: ds.radius.input,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ds.space[3] + 2, // 14
    gap: ds.space[2] + 2, // 10
  },
  prefix: {
    borderRightWidth: 1,
    paddingRight: ds.space[2] + 2, // 10
    marginRight: ds.space[1] / 2, // 2
  },
  prefixText: {
    ...ds.text.inputLabel,
  },
  textInput: {
    flex: 1,
    ...ds.text.inputText,
    height: '100%',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[1],
  },
  errorText: {
    ...ds.text.caption,
    flex: 1,
  },
})
