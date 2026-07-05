import type { ReactNode } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Bell, MoreVertical } from 'lucide-react-native'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { Avatar } from './Avatar'
import { IconBox } from './IconBox'

interface AppHeaderProps {
  title: string
  subtitle?: ReactNode
  showMenu?: boolean
  onMenuPress?: () => void
  showNotifDot?: boolean
  onNotifPress?: () => void
}

export function AppHeader({
  title,
  subtitle,
  showMenu = false,
  onMenuPress,
  showNotifDot = false,
  onNotifPress,
}: AppHeaderProps) {
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const avatarUrl = useAuthStore((s) => s.avatarUrl)

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safeArea,
        { backgroundColor: theme.surface },
        Platform.OS === 'android' && styles.androidShadow,
      ]}
    >
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View style={styles.left}>
          <Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>
          {subtitle ?? null}
        </View>
        <View style={styles.right}>
          <Pressable onPress={onNotifPress} accessibilityRole="button">
            <IconBox bg={theme.muted} size={40} radius={ds.radius.button}>
              <Bell size={ds.size.icon.md} color={theme.foreground} />
            </IconBox>
            {showNotifDot ? (
              <View style={[styles.notifDot, { backgroundColor: theme.error }]} />
            ) : null}
          </Pressable>
          <Avatar
            name={user?.fullName ?? ''}
            size="sm"
            {...(avatarUrl !== null && { uri: avatarUrl })}
          />
          {showMenu ? (
            <Pressable onPress={onMenuPress} hitSlop={8} accessibilityRole="button">
              <MoreVertical size={ds.size.icon.md} color={theme.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {},
  androidShadow: {
    elevation: 3,
    shadowColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: ds.size.paddingH,
    paddingTop: ds.space[4],
    paddingBottom: ds.space[4],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
    }),
  },
  left: { flex: 1, gap: ds.space[1] },
  right: { flexDirection: 'row', alignItems: 'center', gap: ds.space[2] },
  title: { ...ds.text.h2, fontSize: 22 },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 4,
  },
})
