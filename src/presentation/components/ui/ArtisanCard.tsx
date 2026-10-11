import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { translateDynamic, useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { getCurrencyFromPhone } from '@/shared/constants/PhoneConstants'
import { formatDistanceParts } from '@/shared/utils/formatDistance'
import type { Artisan } from '@/domain/entities/Artisan'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { StarRating } from './StarRating'

interface ArtisanCardProps {
  artisan: Artisan
  distanceKm?: number | undefined
  isOnline?: boolean
  onPress: () => void
}

export function ArtisanCard({ artisan, distanceKm, isOnline, onPress }: ArtisanCardProps): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()
  const [pressed, setPressed] = useState(false)

  const metierLabel = translateDynamic(`metier.${artisan.metier}`, artisan.metier)
  const currency = getCurrencyFromPhone(artisan.phone)
  const rateUnit = artisan.tarifUnit === 'heure' ? '/h' : null
  const distance = distanceKm !== undefined ? formatDistanceParts(distanceKm) : null
  const distanceLabel = distance ? t(`common.distance.${distance.unit}`, { value: distance.value }) : null

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.card,
        ds.shadow.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={artisan.fullName}
    >
      <Avatar name={artisan.fullName} uri={artisan.avatarUrl} size="lg" isOnline={isOnline ?? null} />

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.foreground }]} numberOfLines={1}>
            {artisan.fullName}
          </Text>
          {artisan.tarifIndicatif ? (
            <View style={styles.rateBlock}>
              <Text style={[styles.rate, { color: theme.primary }]}>
                {artisan.tarifIndicatif.toLocaleString('fr-FR')} {currency}
              </Text>
              {rateUnit ? (
                <Text style={[styles.rateUnit, { color: theme.mutedForeground }]}>{rateUnit}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.metierRow}>
          <Text style={[styles.metier, { color: theme.mutedForeground }]}>
            {metierLabel}
            {distanceLabel ? ` · ${distanceLabel}` : artisan.zoneGeographique ? ` · ${artisan.zoneGeographique}` : ''}
          </Text>
          {artisan.isVerified ? (
            <Badge variant="verified" label={t('common.status.verified')} />
          ) : null}
        </View>

        <StarRating rating={artisan.averageRating} reviewCount={artisan.reviewCount} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: ds.space[3] + 2,
    borderRadius: ds.radius.card,
    padding: ds.space[3] + 2,
    borderWidth: 1,
  },
  pressed: { opacity: 0.92 },
  content: {
    flex: 1,
    gap: ds.space[1],
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  name: {
    ...ds.text.body,
    fontWeight: '700',
    flex: 1,
    marginRight: ds.space[2],
  },
  rateBlock: { alignItems: 'flex-end' },
  rate: {
    ...ds.text.label,
    fontWeight: '700',
  },
  rateUnit: {
    ...ds.text.caption,
  },
  metierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[2],
  },
  metier: {
    ...ds.text.label,
    flex: 1,
  },
})
