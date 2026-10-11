import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import type { Artisan } from '@/domain/entities/Artisan'

interface Props {
  artisan: Artisan
  onPhotoPress: (index: number) => void
}

const PHOTO_CARD_W = 148
const PHOTO_CARD_H = 112

export function ArtisanProfileContent({ artisan, onPhotoPress }: Props): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <>
      {/* ── Réalisations ─────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            {t('client.artisanProfile.portfolio.title')}
          </Text>
          {artisan.photos.length > 0 ? (
            <Text style={[styles.photoCount, { color: theme.mutedForeground }]}>
              {t('client.artisanProfile.portfolio.count', {
                current: 1,
                total: artisan.photos.length,
              })}
            </Text>
          ) : null}
        </View>

        {artisan.photos.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoList}
          >
            {artisan.photos.map((photo, index) => (
              <Pressable
                key={photo.id}
                style={[
                  styles.photoCard,
                  { backgroundColor: theme.muted, borderColor: theme.border },
                  index === 0 && { borderColor: theme.primary },
                ]}
                onPress={() => onPhotoPress(index)}
                accessibilityRole="button"
              >
                <Image source={{ uri: photo.url }} style={styles.photo} resizeMode="cover" />
                {photo.caption ? (
                  <View style={[styles.captionWrap, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                    <Text style={styles.captionText} numberOfLines={1}>
                      {photo.caption}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.emptyBox, { backgroundColor: theme.muted }]}>
            <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
              {t('client.artisanProfile.portfolio.empty')}
            </Text>
          </View>
        )}
      </View>

      {/* ── À propos ─────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
          {t('client.artisanProfile.about.title')}
        </Text>
        {artisan.bio ? (
          <Text style={[styles.bio, { color: theme.mutedForeground }]}>{artisan.bio}</Text>
        ) : (
          <View style={[styles.emptyBox, { backgroundColor: theme.muted }]}>
            <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>
              {t('client.artisanProfile.about.empty')}
            </Text>
          </View>
        )}
      </View>

      {/* ── Zone ─────────────────────────────────────────────────────── */}
      {artisan.zoneGeographique ? (
        <View style={[styles.infoRow, { borderColor: theme.border }]}>
          <Text style={[styles.infoLabel, { color: theme.mutedForeground }]}>
            {t('client.artisanProfile.zone.label')}
          </Text>
          <Text style={[styles.infoValue, { color: theme.foreground }]}>
            {artisan.zoneGeographique}
          </Text>
        </View>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: ds.size.paddingH,
    marginTop: ds.space[6],
    gap: ds.space[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { ...ds.text.h3 },
  photoCount: { ...ds.text.label },
  photoList: { gap: ds.space[3], paddingRight: ds.space[1] },
  photoCard: {
    width: PHOTO_CARD_W,
    height: PHOTO_CARD_H,
    borderRadius: ds.radius.card,
    borderWidth: 2,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  captionWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: ds.space[2],
    paddingVertical: ds.space[1],
  },
  captionText: { ...ds.text.caption, color: '#fff' },
  bio: { ...ds.text.body, lineHeight: 22 },
  emptyBox: {
    borderRadius: ds.radius.card,
    paddingHorizontal: ds.space[4],
    paddingVertical: ds.space[4],
    alignItems: 'center',
  },
  emptyText: { ...ds.text.body, textAlign: 'center' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3],
    borderBottomWidth: 1,
    marginTop: ds.space[4],
  },
  infoLabel: { ...ds.text.label },
  infoValue: { ...ds.text.label, fontWeight: '600' },
})
