import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft, Briefcase } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'

/**
 * Bannière visible uniquement quand un artisan navigue en mode client.
 * Permet de revenir à l'espace artisan en un tap.
 */
export function ClientModeBanner(): React.JSX.Element | null {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const setAppMode = useAuthStore((s) => s.setAppMode)

  if (user?.role !== 'artisan') return null

  function handleReturn(): void {
    setAppMode('artisan')
    router.replace('/(artisan)/dashboard')
  }

  return (
    <View style={[styles.banner, { backgroundColor: theme.primary }]}>
      <Pressable
        onPress={handleReturn}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel={t('common.artisanClientBanner.back')}
      >
        <ArrowLeft size={14} color={theme.primaryForeground} />
        <Text style={[styles.backText, { color: theme.primaryForeground }]}>
          {t('common.artisanClientBanner.back')}
        </Text>
      </Pressable>

      <View style={styles.labelRow}>
        <Briefcase size={12} color={theme.primaryForeground} />
        <Text style={[styles.label, { color: theme.primaryForeground }]}>
          {t('common.artisanClientBanner.label')}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[2],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[1],
  },
  backText: {
    ...ds.text.caption,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[1],
  },
  label: {
    ...ds.text.caption,
    fontWeight: '700',
  },
})
