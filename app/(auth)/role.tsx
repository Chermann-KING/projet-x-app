import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronRight, User, Wrench } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

// Objet inline en fin de tableau de styles = priorité maximale sur tout style injecté
const ROW_OVERRIDE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  alignSelf: 'stretch' as const,
}

export default function RoleScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const [clientPressed, setClientPressed] = useState(false)
  const [artisanPressed, setArtisanPressed] = useState(false)

  function goToRegister(role: 'client' | 'artisan'): void {
    router.push({ pathname: '/(auth)/register', params: { role } })
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.topAccent, { backgroundColor: theme.secondary }]} />

      <View style={[styles.container, styles.webWrap]}>
        <View style={[styles.logoBox, { backgroundColor: theme.primary }]}>
          <Wrench size={20} color={theme.primaryForeground} strokeWidth={2.5} />
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.foreground }]}>
            {t('auth.role.title')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
            {t('auth.role.subtitle')}
          </Text>
        </View>

        <View style={styles.cards}>
          <Pressable
            onPress={() => goToRegister('client')}
            onPressIn={() => setClientPressed(true)}
            onPressOut={() => setClientPressed(false)}
            style={[
              styles.card,
              { borderColor: theme.border, backgroundColor: theme.card },
              clientPressed && styles.pressed,
              ROW_OVERRIDE,
            ]}
            accessibilityRole="button"
          >
            <View style={[styles.cardIcon, { backgroundColor: theme.muted }]}>
              <User size={22} color={theme.mutedForeground} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: theme.foreground }]}>
                {t('auth.role.client.label')}
              </Text>
              <Text style={[styles.cardDesc, { color: theme.mutedForeground }]}>
                {t('auth.role.client.description')}
              </Text>
            </View>
            <ChevronRight size={20} color={theme.mutedForeground} />
          </Pressable>

          <Pressable
            onPress={() => goToRegister('artisan')}
            onPressIn={() => setArtisanPressed(true)}
            onPressOut={() => setArtisanPressed(false)}
            style={[
              styles.card,
              styles.cardArtisan,
              { backgroundColor: theme.primary },
              artisanPressed && styles.pressed,
              ROW_OVERRIDE,
            ]}
            accessibilityRole="button"
          >
            <View style={[styles.cardIcon, { backgroundColor: '#932C22' }]}>
              <Wrench size={22} color={theme.primaryForeground} />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: theme.primaryForeground }]}>
                {t('auth.role.artisan.label')}
              </Text>
              <Text style={[styles.cardDesc, { color: '#EDC2BA' }]}>
                {t('auth.role.artisan.description')}
              </Text>
            </View>
            <ChevronRight size={20} color={theme.primaryForeground} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push('/(auth)/login')}
          style={styles.loginLink}
          accessibilityRole="link"
        >
          <Text style={[styles.loginText, { color: theme.mutedForeground }]}>
            {t('auth.role.alreadyAccount')}{' '}
            <Text style={[styles.loginAccent, { color: theme.accent }]}>
              {t('auth.role.connect')}
            </Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topAccent: { height: 3 },
  webWrap: Platform.select({
    web: { maxWidth: 480, width: '100%', alignSelf: 'center' as const },
    default: {},
  }),
  container: {
    flex: 1,
    paddingHorizontal: ds.size.paddingH + ds.space[1], // 20
    paddingTop: ds.space[6],
    gap: ds.space[8],
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: ds.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { gap: ds.space[2] },
  title: {
    ...ds.text.h1,
    fontSize: 34,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...ds.text.body,
  },
  cards: { gap: ds.space[3] + 2, alignSelf: 'stretch' }, // 14
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: ds.space[3] + 2, // 14
    padding: ds.space[4] + 2, // 18
    borderRadius: ds.space[4],
    borderWidth: 1,
  },
  cardArtisan: { borderWidth: 0 },
  cardIcon: {
    width: ds.size.avatar.md,
    height: ds.size.avatar.md,
    borderRadius: ds.radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: ds.space[1] - 1 }, // 3
  cardTitle: {
    ...ds.text.body,
    fontWeight: '700',
    fontSize: 16,
  },
  cardDesc: {
    ...ds.text.label,
  },
  pressed: { opacity: 0.88 },
  loginLink: {
    position: 'absolute',
    bottom: ds.space[10],
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loginText: {
    ...ds.text.label,
  },
  loginAccent: {
    ...ds.text.label,
    fontWeight: '700',
  },
})
