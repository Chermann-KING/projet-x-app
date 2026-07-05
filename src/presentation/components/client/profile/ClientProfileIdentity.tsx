import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Camera } from 'lucide-react-native'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { Avatar } from '@/presentation/components/ui'
import type { User } from '@/domain/entities/User'

interface Props {
  user: User
  avatarUrl: string | null
  isUploading: boolean
  onAvatarPress: () => void
}

export function ClientProfileIdentity({ user, avatarUrl, isUploading, onAvatarPress }: Props) {
  const theme = useTheme()

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable
        onPress={onAvatarPress}
        disabled={isUploading}
        style={styles.avatarWrap}
        accessibilityRole="button"
      >
        <Avatar
          name={user.fullName}
          size="lg"
          {...(avatarUrl !== null && { uri: avatarUrl })}
        />
        <View style={[styles.cameraBadge, { backgroundColor: theme.primary }]}>
          {isUploading
            ? <ActivityIndicator size={10} color={theme.primaryForeground} />
            : <Camera size={12} color={theme.primaryForeground} />
          }
        </View>
      </Pressable>

      <View style={styles.info}>
        <Text style={[styles.fullName, { color: theme.foreground }]}>{user.fullName}</Text>
        <Text style={[styles.email, { color: theme.mutedForeground }]}>{user.email}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[4],
    marginHorizontal: ds.size.paddingH,
    padding: ds.space[4],
    borderRadius: ds.radius.card,
    borderWidth: 1,
    marginBottom: ds.space[4],
  },
  avatarWrap: { position: 'relative' },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  info: { gap: 2 },
  fullName: { ...ds.text.body, fontWeight: '700' },
  email: { ...ds.text.label },
})
