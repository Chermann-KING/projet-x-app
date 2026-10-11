import { StyleSheet, Text, View } from 'react-native'
import { Mail, MapPin, Phone } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import type { User } from '@/domain/entities/User'

interface Props {
  user: User
  city: string | null
}

export function ClientProfileInfo({ user, city }: Props): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
        {t('client.profile.info.title')}
      </Text>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <InfoRow
          icon={<Phone size={ds.size.icon.sm} color={theme.mutedForeground} />}
          label={t('client.profile.phone.label')}
          value={user.phone || '—'}
          theme={theme}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <InfoRow
          icon={<Mail size={ds.size.icon.sm} color={theme.mutedForeground} />}
          label={t('client.profile.email.label')}
          value={user.email}
          theme={theme}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <InfoRow
          icon={<MapPin size={ds.size.icon.sm} color={theme.mutedForeground} />}
          label={t('client.profile.city.label')}
          value={city ?? '—'}
          theme={theme}
        />
      </View>
    </View>
  )
}

function InfoRow({
  icon,
  label,
  value,
  theme,
}: {
  icon: React.ReactNode
  label: string
  value: string
  theme: ReturnType<typeof useTheme>
}): React.JSX.Element {
  return (
    <View style={styles.row}>
      {icon}
      <Text style={[styles.rowLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: theme.foreground }]} numberOfLines={1}>
        {value}
      </Text>
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
  divider: { height: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3] + 2,
  },
  rowLabel: { ...ds.text.label, width: 70 },
  rowValue: { ...ds.text.label, flex: 1, textAlign: 'right' },
})
