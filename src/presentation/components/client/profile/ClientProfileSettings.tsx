import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Bell, ChevronRight } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'

interface Props {
  onEditPress: () => void
}

export function ClientProfileSettings({ onEditPress }: Props): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <View style={styles.section}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <SettingRow
          label={t('client.profile.settings.editInfo')}
          theme={theme}
          onPress={onEditPress}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingRow
          label={t('client.profile.settings.notifications')}
          icon={<Bell size={ds.size.icon.sm} color={theme.mutedForeground} />}
          theme={theme}
          onPress={() => router.push('/(client)/notifications')}
        />
      </View>
    </View>
  )
}

function SettingRow({
  label,
  icon,
  onPress,
  theme,
}: {
  label: string
  icon?: React.ReactNode
  onPress: () => void
  theme: ReturnType<typeof useTheme>
}): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      {icon ?? null}
      <Text style={[styles.rowLabel, { color: theme.foreground }]}>{label}</Text>
      <ChevronRight size={ds.size.icon.sm} color={theme.mutedForeground} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: ds.space[4] },
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
    paddingVertical: ds.space[4],
  },
  rowLabel: { ...ds.text.body, flex: 1 },
})
