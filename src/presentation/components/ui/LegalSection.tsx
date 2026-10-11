import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

export function LegalSection(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
        {t('common.legal.title')}
      </Text>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Pressable
          onPress={() => router.push('/(legal)/conditions')}
          style={styles.row}
          accessibilityRole="link"
        >
          <Text style={[styles.rowLabel, { color: theme.foreground }]}>
            {t('common.legal.cgu')}
          </Text>
          <ChevronRight size={ds.size.icon.sm} color={theme.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Pressable
          onPress={() => router.push('/(legal)/privacy')}
          style={styles.row}
          accessibilityRole="link"
        >
          <Text style={[styles.rowLabel, { color: theme.foreground }]}>
            {t('common.legal.privacy')}
          </Text>
          <ChevronRight size={ds.size.icon.sm} color={theme.mutedForeground} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: ds.space[4] },
  sectionTitle: {
    ...ds.text.label,
    fontWeight: '700',
    paddingHorizontal: ds.size.paddingH,
    marginBottom: ds.space[2],
  },
  card: {
    marginHorizontal: ds.size.paddingH,
    borderRadius: ds.radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[4],
  },
  rowLabel: { ...ds.text.body, flex: 1 },
  divider: { height: 1 },
})
