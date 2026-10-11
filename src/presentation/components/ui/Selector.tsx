import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ReactNode } from 'react'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

export interface SelectorOption {
  label: string
  icon?: ReactNode
  onPress: () => void
  variant?: 'default' | 'primary' | 'destructive'
}

interface Props {
  visible: boolean
  onClose: () => void
  options: SelectorOption[]
}

function resolveTextColor(
  variant: SelectorOption['variant'],
  theme: ReturnType<typeof useTheme>,
): string {
  if (variant === 'destructive') return theme.error
  if (variant === 'primary') return theme.primary
  return theme.foreground
}

export function Selector({ visible, onClose, options }: Props): React.JSX.Element {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              paddingBottom: insets.bottom + ds.space[6],
              shadowColor: theme.foreground,
            },
          ]}
        >
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {options.map((option, index) => {
            const textColor = resolveTextColor(option.variant, theme)

            return (
              <Pressable
                key={index}
                style={[
                  styles.option,
                  index > 0 && styles.optionDivider,
                  index > 0 && { borderTopColor: theme.border },
                ]}
                onPress={() => {
                  onClose()
                  option.onPress()
                }}
                android_ripple={{ color: theme.muted }}
                accessibilityRole="button"
              >
                {option.icon != null && (
                  <View style={styles.iconWrap}>{option.icon}</View>
                )}
                <Text
                  style={[styles.optionLabel, { color: textColor }]}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: ds.radius.xl,
    borderTopRightRadius: ds.radius.xl,
    paddingTop: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    elevation: 20,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: ds.space[4],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ds.space[4],
    minHeight: 56,
  },
  optionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 32,
    alignItems: 'center',
    marginRight: ds.space[3],
  },
  optionLabel: {
    fontFamily: 'NunitoSans',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    flex: 1,
  },
})
