import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { Badge, StarRating } from '@/presentation/components/ui'
import type { Artisan } from '@/domain/entities/Artisan'

interface Props {
  artisan: Artisan
  currency: string
  unitLabel: string
}

export function ArtisanProfileIdentity({ artisan, currency, unitLabel }: Props) {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <View style={styles.container}>
      <View style={styles.nameRow}>
        <Text style={[styles.name, { color: theme.foreground }]}>{artisan.fullName}</Text>
        {artisan.tarifIndicatif ? (
          <View style={styles.rateBlock}>
            <Text style={[styles.rate, { color: theme.primary }]}>
              {artisan.tarifIndicatif.toLocaleString('fr-FR')} {currency}
            </Text>
            <Text style={[styles.rateUnit, { color: theme.mutedForeground }]}>{unitLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metierRow}>
        <Text style={[styles.metierText, { color: theme.mutedForeground }]}>
          {t(`metier.${artisan.metier}`)}
        </Text>
        {artisan.isVerified ? (
          <Badge variant="verified" label={t('common.status.verified')} />
        ) : null}
      </View>

      <View style={styles.ratingRow}>
        <StarRating rating={artisan.averageRating} reviewCount={artisan.reviewCount} />
        {artisan.isOnline ? (
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.onlineLabel, { color: theme.success }]}>
              {t('client.artisanProfile.online')}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: ds.size.paddingH,
    gap: ds.space[2],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  name: { ...ds.text.h2, flex: 1, marginRight: ds.space[3] },
  rateBlock: { alignItems: 'flex-end' },
  rate: { ...ds.text.label, fontWeight: '700' },
  rateUnit: { ...ds.text.caption },
  metierRow: { flexDirection: 'row', alignItems: 'center', gap: ds.space[2] },
  metierText: { ...ds.text.body },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: ds.space[1] },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineLabel: { ...ds.text.label },
})
