import { StyleSheet, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.muted }]}>
        <Icon size={ds.space[8]} color={theme.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: theme.mutedForeground }]}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ds.space[8],
    gap: ds.space[3],
  },
  iconWrap: {
    width: ds.space[8] * 2 + ds.space[2], // 72
    height: ds.space[8] * 2 + ds.space[2], // 72
    borderRadius: ds.radius.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ds.space[1],
  },
  title: {
    ...ds.text.h3,
    textAlign: 'center',
  },
  description: {
    ...ds.text.body,
    textAlign: 'center',
  },
  action: {
    marginTop: ds.space[2],
  },
})
