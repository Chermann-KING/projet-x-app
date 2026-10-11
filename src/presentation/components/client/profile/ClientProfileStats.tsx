import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

interface Stats {
  total: number
  done: number
  avgRating: number | null
}

interface Props {
  stats: Stats
}

export function ClientProfileStats({ stats }: Props): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <View style={[styles.cell, { borderRightWidth: 1, borderRightColor: theme.border }]}>
        <Text style={[styles.value, { color: theme.primary }]}>{stats.total}</Text>
        <Text style={[styles.label, { color: theme.mutedForeground }]}>
          {t('client.profile.stats.requests')}
        </Text>
      </View>
      <View style={[styles.cell, { borderRightWidth: 1, borderRightColor: theme.border }]}>
        <Text style={[styles.value, { color: theme.primary }]}>{stats.done}</Text>
        <Text style={[styles.label, { color: theme.mutedForeground }]}>
          {t('client.profile.stats.completed')}
        </Text>
      </View>
      <View style={styles.cell}>
        <Text style={[styles.value, { color: theme.primary }]}>
          {stats.avgRating != null ? stats.avgRating.toFixed(1) : '—'}
        </Text>
        <Text style={[styles.label, { color: theme.mutedForeground }]}>
          {t('client.profile.stats.avgRating')}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: ds.size.paddingH,
    borderWidth: 1,
    borderRadius: ds.radius.card,
    marginBottom: ds.space[5],
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: ds.space[4],
    gap: ds.space[1],
  },
  value: { ...ds.text.h3, fontWeight: '700' },
  label: { ...ds.text.caption },
})
