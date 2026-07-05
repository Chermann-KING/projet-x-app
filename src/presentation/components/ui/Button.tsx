import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
}: ButtonProps) {
  const theme = useTheme()
  const [pressed, setPressed] = useState(false)
  const isDisabled = disabled || loading

  const containerColor =
    variant === 'primary'
      ? isDisabled
        ? theme.muted
        : theme.primary
      : 'transparent'

  const borderStyle =
    variant === 'secondary'
      ? { borderWidth: 1.5, borderColor: isDisabled ? theme.muted : theme.secondary }
      : undefined

  const labelColor =
    variant === 'primary'
      ? isDisabled
        ? theme.mutedForeground
        : theme.primaryForeground
      : variant === 'secondary'
        ? isDisabled
          ? theme.mutedForeground
          : theme.secondary
        : isDisabled
          ? theme.mutedForeground
          : theme.accent

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        { backgroundColor: containerColor },
        borderStyle,
        pressed && !isDisabled && styles.pressed,
        // Objet inline en dernière position = priorité max sur styles injectés par NativeWind
        fullWidth ? STRETCH_OVERRIDE : undefined,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      )}
    </Pressable>
  )
}

const STRETCH_OVERRIDE = { alignSelf: 'stretch' as const }

const styles = StyleSheet.create({
  base: {
    height: ds.size.button,
    borderRadius: ds.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ds.space[5],
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    ...ds.text.button,
  },
})
