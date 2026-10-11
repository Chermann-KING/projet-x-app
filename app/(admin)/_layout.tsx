import { useEffect, useState } from 'react'
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Tabs, Slot, Link, Redirect, usePathname, router } from 'expo-router'
import type { Href } from 'expo-router'
import { CheckSquare, Users, AlertTriangle, LogOut, Wrench } from 'lucide-react-native'
import { useTabBarScreenOptions } from '@/presentation/hooks/useTabBarScreenOptions'
import { useAdminBreakpoint } from '@/presentation/hooks/useAdminBreakpoint'
import { TabBarIcon } from '@/presentation/components/ui'
import { useTranslation } from '@/i18n'
import { useAuthStore } from '@/presentation/stores/authStore'
import { logout, getPendingArtisans, getPendingReportCount } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { adminColors } from '@/shared/constants/adminColors'

function adminInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const SIDEBAR_FULL_WIDTH = 240
const SIDEBAR_ICON_WIDTH = 64
const AUTH_CHECK_TIMEOUT_MS = 8000

function AdminSidebar({ collapsed = false }: { collapsed?: boolean }): React.JSX.Element {
  const { t } = useTranslation()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const [pendingArtisanCount, setPendingArtisanCount] = useState(0)
  const [pendingReportCount, setPendingReportCount] = useState(0)

  useEffect(() => {
    void getPendingArtisans
      .execute()
      .then((list) => setPendingArtisanCount(list.length))
      .catch(() => undefined)
    void getPendingReportCount
      .execute()
      .then(setPendingReportCount)
      .catch(() => undefined)
  }, [])

  const navItems: Array<{ href: Extract<Href, string>; label: string; icon: typeof CheckSquare; badge: number }> = [
    {
      href: '/(admin)',
      label: t('admin.nav.toValidateFull'),
      icon: CheckSquare,
      badge: pendingArtisanCount,
    },
    {
      href: '/(admin)/artisans-actifs',
      label: t('admin.nav.activeFull'),
      icon: Users,
      badge: 0,
    },
    {
      href: '/(admin)/signalements',
      label: t('admin.nav.reports'),
      icon: AlertTriangle,
      badge: pendingReportCount,
    },
  ]

  async function handleLogout(): Promise<void> {
    try {
      await logout.execute()
      useAuthStore.getState().reset()
      router.replace('/')
    } catch (err) {
      AppLogger.error(err)
    }
  }

  function isActive(href: string): boolean {
    const path = String(href)
    // Web strips route groups from URLs: /(admin)/foo → /foo, /(admin) → /
    const webPath = path.replace(/^\/\(admin\)/, '') || '/'
    if (path === '/(admin)' || path === '/(admin)/') {
      return (
        pathname === '/(admin)' ||
        pathname === '/(admin)/' ||
        pathname === '/'
      )
    }
    return (
      pathname === path ||
      pathname === webPath ||
      pathname.startsWith(path + '/') ||
      pathname.startsWith(webPath + '/')
    )
  }

  return (
    <View
      style={[
        sidebar.root,
        { backgroundColor: adminColors.sidebarBg, width: collapsed ? SIDEBAR_ICON_WIDTH : SIDEBAR_FULL_WIDTH },
      ]}
    >
      {/* Logo */}
      <View style={[sidebar.logo, collapsed && sidebar.logoCollapsed]}>
        <View style={[sidebar.logoIcon, { backgroundColor: adminColors.accent }]}>
          <Wrench size={18} color="#fff" />
        </View>
        {!collapsed && (
          <View>
            <Text style={[sidebar.logoTitle, { color: adminColors.textPrimary }]}>{t('admin.sidebar.appName')}</Text>
            <Text style={[sidebar.logoSub, { color: adminColors.textMuted }]}>{t('admin.sidebar.appSubtitle')}</Text>
          </View>
        )}
      </View>

      {/* Nav */}
      <View style={[sidebar.section, collapsed && sidebar.sectionCollapsed]}>
        {!collapsed && (
          <Text style={[sidebar.sectionLabel, { color: adminColors.textSection }]}>
            {t('admin.nav.section')}
          </Text>
        )}
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(href)
          return (
            <View key={String(href)} style={[sidebar.navRow, collapsed && sidebar.navRowCollapsed]}>
              {!collapsed && (
                <View style={[sidebar.navIndicator, active && { backgroundColor: adminColors.accent }]} />
              )}
              <Link href={href} asChild>
                <Pressable
                  style={[
                    sidebar.navItem,
                    active && sidebar.navItemActive,
                    collapsed && sidebar.navItemCollapsed,
                  ]}
                >
                  <View style={collapsed ? sidebar.iconWrapper : undefined}>
                    <Icon size={18} color={active ? adminColors.accent : adminColors.textMuted} />
                    {collapsed && badge > 0 && (
                      <View style={sidebar.badgeDot}>
                        <Text style={sidebar.badgeDotText}>{badge > 9 ? '9+' : badge}</Text>
                      </View>
                    )}
                  </View>
                  {!collapsed && (
                    <Text
                      style={[sidebar.navLabel, { color: active ? adminColors.textPrimary : adminColors.textMuted }]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  )}
                  {!collapsed && badge > 0 && (
                    <View style={[sidebar.badge, { backgroundColor: adminColors.accent }]}>
                      <Text style={sidebar.badgeText}>{badge}</Text>
                    </View>
                  )}
                </Pressable>
              </Link>
            </View>
          )
        })}
      </View>

      {/* User */}
      <View
        style={[
          sidebar.userRow,
          { borderTopColor: adminColors.border },
          collapsed && sidebar.userRowCollapsed,
        ]}
      >
        <View style={[sidebar.userAvatar, { backgroundColor: adminColors.accent }]}>
          <Text style={[sidebar.userAvatarText, { color: '#fff' }]}>
            {user ? adminInitials(user.fullName) : 'AD'}
          </Text>
        </View>
        {!collapsed && (
          <View style={sidebar.userInfo}>
            <Text style={[sidebar.userName, { color: adminColors.textPrimary }]} numberOfLines={1}>
              {user?.fullName ?? t('admin.sidebar.adminFallback')}
            </Text>
            {user?.email ? (
              <Text style={[sidebar.userEmail, { color: adminColors.textMuted }]} numberOfLines={1}>
                {user.email}
              </Text>
            ) : null}
          </View>
        )}
        {!collapsed && (
          <Pressable onPress={() => void handleLogout()} accessibilityRole="button">
            <LogOut size={18} color={adminColors.textMuted} />
          </Pressable>
        )}
        {collapsed && (
          <Pressable
            onPress={() => void handleLogout()}
            accessibilityRole="button"
            style={sidebar.logoutCollapsed}
          >
            <LogOut size={18} color={adminColors.textMuted} />
          </Pressable>
        )}
      </View>
    </View>
  )
}

const sidebar = StyleSheet.create({
  root: {
    flexShrink: 0,
    flexDirection: 'column',
    paddingTop: 24,
    paddingBottom: 16,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  logoCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: { fontSize: 16, fontWeight: '700' },
  logoSub: { fontSize: 11 },
  section: { flex: 1, paddingHorizontal: 12 },
  sectionCollapsed: { paddingHorizontal: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    paddingLeft: 15,
    marginBottom: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 2,
  },
  navRowCollapsed: {
    justifyContent: 'center',
  },
  navIndicator: {
    width: 3,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: 'rgba(134, 1, 1, 0.12)',
  },
  navItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 9,
    paddingRight: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navItemCollapsed: {
    flex: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: adminColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeDotText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  navLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  userRowCollapsed: {
    flexDirection: 'column',
    gap: 8,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  logoutCollapsed: {
    padding: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { fontSize: 12, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 13, fontWeight: '600' },
  userEmail: { fontSize: 11 },
})

export default function AdminLayout(): React.JSX.Element {
  const screenOptions = useTabBarScreenOptions()
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isAuthLoading = useAuthStore((s) => s.isLoading)
  const { isDesktop, isTablet } = useAdminBreakpoint()
  const [authCheckTimedOut, setAuthCheckTimedOut] = useState(false)

  useEffect(() => {
    if (!isAuthLoading) return
    const timer = setTimeout(() => {
      AppLogger.warn('TIMEOUT')
      setAuthCheckTimedOut(true)
    }, AUTH_CHECK_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [isAuthLoading])

  // Vérification d'auth bloquée au-delà du délai : on ne laisse jamais
  // l'ActivityIndicator tourner indéfiniment, on retombe sur le login.
  if (isAuthLoading && authCheckTimedOut) {
    return <Redirect href={'/(auth)/login'} />
  }

  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: adminColors.sidebarBg }}>
        <ActivityIndicator color={adminColors.accent} />
      </View>
    )
  }

  if (!user || user.role !== 'admin') {
    return <Redirect href={'/(auth)/login'} />
  }

  // Web desktop : sidebar complète | Web tablette : sidebar icon-only
  if (Platform.OS === 'web' && (isDesktop || isTablet)) {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <AdminSidebar collapsed={isTablet} />
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    )
  }

  // Web mobile (<768px) et natif : navigation par onglets
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('admin.nav.toValidate'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon focused={focused}><CheckSquare color={color} size={size} /></TabBarIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="artisans-actifs"
        options={{
          title: t('admin.nav.active'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon focused={focused}><Users color={color} size={size} /></TabBarIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="signalements"
        options={{
          title: t('admin.nav.reports'),
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon focused={focused}><AlertTriangle color={color} size={size} /></TabBarIcon>
          ),
        }}
      />
    </Tabs>
  )
}
