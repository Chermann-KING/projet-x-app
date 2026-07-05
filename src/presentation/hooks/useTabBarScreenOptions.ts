import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from './useTheme'
import { ds } from '@/shared/designSystem'

export function useTabBarScreenOptions() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return {
    headerShown: false,
    tabBarActiveTintColor: theme.primary,
    tabBarInactiveTintColor: theme.mutedForeground,
    tabBarStyle: {
      height: ds.size.tabBar + insets.bottom,
      backgroundColor: theme.surface,
      borderTopColor: theme.border,
      borderTopWidth: 1,
      paddingBottom: insets.bottom + 8,
      paddingTop: 8,
    },
    tabBarLabelStyle: {
      fontFamily: ds.font.body,
      fontSize: 11,
      marginTop: 4,
    },
  } as const
}
