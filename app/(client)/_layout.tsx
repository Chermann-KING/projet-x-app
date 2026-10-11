import { Tabs, Redirect } from 'expo-router'
import { Home, FileText, MessageCircle, User } from 'lucide-react-native'
import { getFocusedRouteNameFromRoute } from '@react-navigation/native'
import { useTabBarScreenOptions } from '@/presentation/hooks/useTabBarScreenOptions'
import { TabBarIcon } from '@/presentation/components/ui'
import { usePresenceHeartbeat } from '@/presentation/hooks/usePresenceHeartbeat'
import { useAuthStore } from '@/presentation/stores/authStore'

const NO_TAB_BAR = { display: 'none' } as const

export default function ClientLayout() {
  const screenOptions = useTabBarScreenOptions()
  const user = useAuthStore((s) => s.user)
  const appMode = useAuthStore((s) => s.appMode)
  usePresenceHeartbeat()

  const isClientAllowed =
    user?.role === 'client' || (user?.role === 'artisan' && appMode === 'client')

  if (!isClientAllowed) {
    return <Redirect href={'/(auth)/login'} />
  }

  return (
    <Tabs screenOptions={screenOptions}>
        {/* ── Onglets principaux ─────────────────────────────────────────── */}
        <Tabs.Screen
          name="home"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, size, focused }) => (
              <TabBarIcon focused={focused}>
                <Home color={color} size={size} />
              </TabBarIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: 'Demandes',
            tabBarIcon: ({ color, size, focused }) => (
              <TabBarIcon focused={focused}>
                <FileText color={color} size={size} />
              </TabBarIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={({ route }) => ({
            title: 'Chat',
            ...(getFocusedRouteNameFromRoute(route) === '[id]' ? { tabBarStyle: NO_TAB_BAR } : {}),
            tabBarIcon: ({ color, size, focused }) => (
              <TabBarIcon focused={focused}>
                <MessageCircle color={color} size={size} />
              </TabBarIcon>
            ),
          })}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size, focused }) => (
              <TabBarIcon focused={focused}>
                <User color={color} size={size} />
              </TabBarIcon>
            ),
          }}
        />

        {/* ── Écrans plein écran (pas d'onglet, tab bar masquée) ─────────── */}
        <Tabs.Screen name="results"            options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
        <Tabs.Screen name="artisan/[id]"       options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
        <Tabs.Screen name="quote/request"      options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
        <Tabs.Screen name="quote/confirmation" options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
        <Tabs.Screen name="request/[id]"       options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
        <Tabs.Screen name="review/[id]"        options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
        <Tabs.Screen name="edit-profile"       options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
        <Tabs.Screen name="notifications"      options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
      </Tabs>
  )
}
