import { StyleSheet, Text, View } from 'react-native'
import { CheckCircle, Circle, X } from 'lucide-react-native'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

type BadgeVariant = 'verified' | 'accepted' | 'pending' | 'rejected'

interface BadgeProps {
  variant: BadgeVariant
  label: string
}

// Les couleurs de badge sont sémantiques et héritent du thème pour light/dark
function useBadgeColors(variant: BadgeVariant): { bg: string; text: string; icon: string } {
  const theme = useTheme()
  switch (variant) {
    case 'verified':
      return { bg: theme.warningMuted, text: '#734E00', icon: theme.warning }
    case 'accepted':
      return { bg: theme.successMuted, text: '#004905', icon: theme.success }
    case 'pending':
      return { bg: theme.warningMuted, text: '#7B4800', icon: theme.warning }
    case 'rejected':
      return { bg: theme.errorMuted, text: '#8C3431', icon: theme.error }
  }
}

function BadgeIcon({ variant, color }: { variant: BadgeVariant; color: string }) {
  switch (variant) {
    case 'verified':
      return <Circle size={ds.size.icon.xs} color={color} fill={color} />
    case 'accepted':
      return <CheckCircle size={ds.size.icon.xs} color={color} />
    case 'pending':
      return <View style={[styles.dot, { backgroundColor: color }]} />
    case 'rejected':
      return <X size={ds.size.icon.xs} color={color} strokeWidth={2.5} />
  }
}

export function Badge({ variant, label }: BadgeProps) {
  const colors = useBadgeColors(variant)

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <BadgeIcon variant={variant} color={colors.icon} />
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[1],
    paddingHorizontal: ds.space[2],
    paddingVertical: 3,
    borderRadius: ds.radius.badge,
    alignSelf: 'flex-start',
  },
  label: {
    ...ds.text.caption,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
})
