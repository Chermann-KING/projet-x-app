import { useEffect, useState } from 'react'
import { Tabs, Redirect, usePathname, useRouter } from 'expo-router'
import type { Href } from 'expo-router'
import { LayoutGrid, ClipboardList, Calendar, User } from 'lucide-react-native'
import { getFocusedRouteNameFromRoute } from '@react-navigation/native'
import { useTabBarScreenOptions } from '@/presentation/hooks/useTabBarScreenOptions'
import { TabBarIcon } from '@/presentation/components/ui'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getArtisanByUserId } from '@/di/container'
import { usePresenceHeartbeat } from '@/presentation/hooks/usePresenceHeartbeat'

const NO_TAB_BAR = { display: 'none' } as const

function isQuoteDetailRoute(route: Parameters<typeof getFocusedRouteNameFromRoute>[0]): boolean {
  const focused = getFocusedRouteNameFromRoute(route) ?? 'index'
  return ['[id]', 'create'].includes(focused)
}

export default function ArtisanLayout() {
  const screenOptions = useTabBarScreenOptions()
  const user = useAuthStore((s) => s.user)
  const pathname = usePathname()
  const router = useRouter()
  const [profileChecked, setProfileChecked] = useState(false)

  usePresenceHeartbeat()

  useEffect(() => {
    if (!user) return
    void checkArtisanProfile()
  }, [user])

  async function checkArtisanProfile(): Promise<void> {
    try {
      const profile = await getArtisanByUserId.execute(user!.id)
      const isInOnboarding = pathname.includes('/onboarding')
      if (!profile && !isInOnboarding) {
        router.replace('/(artisan)/onboarding/step1')
      }
    } finally {
      setProfileChecked(true)
    }
  }

  if (!user || user.role !== 'artisan') {
    return <Redirect href={'/(auth)/login' as Href} />
  }

  if (!profileChecked && user) return null

  return (
    <Tabs screenOptions={screenOptions}>
      {/* ── Onglets principaux ─────────────────────────────────────────── */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon focused={focused}>
              <LayoutGrid color={color} size={size} />
            </TabBarIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={({ route }) => ({
          title: 'Devis',
          ...(isQuoteDetailRoute(route) ? { tabBarStyle: NO_TAB_BAR } : {}),
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon focused={focused}>
              <ClipboardList color={color} size={size} />
            </TabBarIcon>
          ),
        })}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon focused={focused}>
              <Calendar color={color} size={size} />
            </TabBarIcon>
          ),
        }}
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

      {/* ── Écrans plein écran sans onglet ─────────────────────────────── */}
      <Tabs.Screen name="chat/[id]"          options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
      <Tabs.Screen name="onboarding/step1"   options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
      <Tabs.Screen name="onboarding/step2"   options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
      <Tabs.Screen name="onboarding/step3"   options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
      <Tabs.Screen name="onboarding/pending" options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
      <Tabs.Screen name="notifications"      options={{ href: null, tabBarStyle: NO_TAB_BAR }} />
      <Tabs.Screen name="subscription"       options={{ href: null }} />
    </Tabs>
  )
}
