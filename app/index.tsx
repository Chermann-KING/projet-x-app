import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Redirect } from 'expo-router'
import type { Href } from 'expo-router'
import { Wrench } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getCurrentUser } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'

/**
 * Route racine unique ("/"). Doit rester le seul fichier index.tsx au
 * premier niveau des groupes (auth)/(admin)/(client)/(artisan) : Expo Router
 * résout un groupe non déterministe si deux groupes définissent chacun un
 * index.tsx concurrent sur "/".
 */
export default function Bootstrap(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const { setUser, setLoading } = useAuthStore()
  const [destination, setDestination] = useState<Href | null>(null)

  useEffect(() => {
    let active = true

    async function bootstrap(): Promise<void> {
      try {
        const safeExecute = getCurrentUser.execute().catch(() => null)
        const timeout = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 5000)
        )
        const user = await Promise.race([safeExecute, timeout])
        if (!active) return
        setUser(user)
        if (user) {
          const target: Href =
            user.role === 'artisan'
              ? '/(artisan)/dashboard'
              : user.role === 'admin'
                ? '/(admin)'
                : '/(client)/home'
          setDestination(target)
        } else {
          setDestination('/(auth)/role')
        }
      } catch (error) {
        AppLogger.error(error)
        setLoading(false)
        if (active) setDestination('/(auth)/role')
      }
    }

    void bootstrap()
    return () => { active = false }
  }, [setUser, setLoading])

  if (destination) {
    return <Redirect href={destination} />
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        {/* Halo + icône — fidèle au Figma C01 */}
        <View style={[styles.iconHalo, { backgroundColor: theme.surface, ...ds.shadow.card }]}>
          <View style={[styles.iconBox, { backgroundColor: theme.primary }]}>
            <Wrench size={44} color="#FFFFFF" strokeWidth={2} />
          </View>
        </View>

        <Text style={[styles.appName, { color: theme.foreground }]}>projet-x</Text>

        {/* Tagline : "La plateforme " gris · "des artisans gabonais" primary */}
        <Text style={[styles.tagline, { color: theme.mutedForeground }]}>
          {t('auth.splash.taglinePrefix')}
          <Text style={{ color: theme.primary }}>{t('auth.splash.taglineSuffix')}</Text>
        </Text>
      </View>

      <Text style={[styles.version, { color: theme.mutedForeground }]}>v0.1.0 — Gabon</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: ds.space[10],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ds.space[4],
  },
  iconHalo: {
    width: 116,
    height: 116,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: ds.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    ...ds.text.h1,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  tagline: {
    ...ds.text.body,
    textAlign: 'center',
    paddingHorizontal: ds.space[10],
  },
  version: {
    ...ds.text.caption,
  },
})
