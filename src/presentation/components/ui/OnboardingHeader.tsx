import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft, Wrench } from 'lucide-react-native'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

interface Props {
  showBack?: boolean
}

export function OnboardingHeader({ showBack = true }: Props): React.JSX.Element {
  const theme = useTheme()

  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: theme.border }]}
          accessibilityRole="button"
        >
          <ArrowLeft size={ds.size.icon.md} color={theme.foreground} />
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}

      <View style={styles.logoRow}>
        <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
          <Wrench size={16} color={theme.primaryForeground} />
        </View>
        <Text style={[styles.logoText, { color: theme.foreground }]}>projet-x</Text>
      </View>

      <View style={styles.placeholder} />
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: ds.radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 36,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2],
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: ds.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    ...ds.text.h3,
    fontWeight: '700',
  },
})
