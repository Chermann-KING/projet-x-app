import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Banknote, CheckCircle2 } from 'lucide-react-native'
import { translateDynamic, useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { updateArtisanProfile } from '@/di/container'
import { useField } from '@/hooks/useField'
import { ValidationError } from '@/shared/errors'
import { AppLogger } from '@/shared/logger/AppLogger'
import type { Artisan, TarifUnit } from '@/domain/entities/Artisan'

// ── ArtisanBioField ───────────────────────────────────────────────────────────
// Encapsule le useField du champ Bio (section Tarif).
// Monté avec key={artisan.id} pour garantir l'initialisation correcte.

function ArtisanBioField({
  artisan,
  onArtisanUpdate,
}: {
  artisan: Artisan
  onArtisanUpdate: (updated: Artisan) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()

  const saveBio = useCallback(async (value: string) => {
    const updated = await updateArtisanProfile.execute({ artisanId: artisan.id, bio: value })
    onArtisanUpdate(updated)
  }, [artisan.id, onArtisanUpdate])

  const bioField = useField(artisan.bio ?? '', saveBio)

  return (
    <View>
      <View style={styles.bioRow}>
        <TextInput
          style={[styles.bioInput, { color: theme.foreground }]}
          value={bioField.value}
          onChangeText={bioField.setValue}
          onBlur={bioField.onBlur}
          placeholder={t('artisan.profile.tarif.bioPlaceholder')}
          placeholderTextColor={theme.mutedForeground}
          multiline
          numberOfLines={3}
          maxLength={500}
          textAlignVertical="top"
        />
        <View style={styles.bioFeedbackRow}>
          {bioField.isSaving && (
            <ActivityIndicator size="small" color={theme.mutedForeground} />
          )}
          {bioField.status === 'success' && (
            <CheckCircle2 size={16} color={theme.success} />
          )}
        </View>
      </View>
      {bioField.status === 'error' && (
        <Text style={[styles.fieldError, { color: theme.error }]}>
          {bioField.error?.name === 'ValidationError'
            ? t('artisan.profile.field.validationError')
            : t('artisan.profile.field.saveError')}
        </Text>
      )}
    </View>
  )
}

// ── ProfileTarif ──────────────────────────────────────────────────────────────

const TARIF_UNITS: TarifUnit[] = ['heure', 'jour', 'projet']
const UNIT_PILL_KEYS: Record<TarifUnit, string> = {
  heure: 'artisan.profile.tarif.pillHeure',
  jour: 'artisan.profile.tarif.pillJour',
  projet: 'artisan.profile.tarif.pillProjet',
}

interface ProfileTarifProps {
  artisan: Artisan
  currency: string
  onArtisanUpdate: (updated: Artisan) => void
}

export function ProfileTarif({ artisan, currency, onArtisanUpdate }: ProfileTarifProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [isSavingUnit, setIsSavingUnit] = useState(false)

  const saveTarif = useCallback(async (raw: string) => {
    if (!raw.trim()) return
    const num = parseFloat(raw.replace(/\s/gu, '').replace(',', '.'))
    if (!Number.isFinite(num) || num < 0) throw new ValidationError('Tarif invalide')
    const updated = await updateArtisanProfile.execute({ artisanId: artisan.id, tarifIndicatif: num })
    onArtisanUpdate(updated)
  }, [artisan.id, onArtisanUpdate])

  const tarifField = useField(
    artisan.tarifIndicatif != null ? String(artisan.tarifIndicatif) : '',
    saveTarif,
  )

  async function handleUnitChange(unit: TarifUnit): Promise<void> {
    if (unit === (artisan.tarifUnit ?? 'heure')) return
    setIsSavingUnit(true)
    try {
      const updated = await updateArtisanProfile.execute({ artisanId: artisan.id, tarifUnit: unit })
      onArtisanUpdate(updated)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsSavingUnit(false)
    }
  }

  const currentUnit = artisan.tarifUnit ?? 'heure'
  const isError = tarifField.status === 'error'

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
          {t('artisan.profile.sections.tarif')}
        </Text>
        {(tarifField.isSaving || isSavingUnit) && (
          <ActivityIndicator size="small" color={theme.mutedForeground} />
        )}
        {tarifField.status === 'success' && !isSavingUnit && (
          <CheckCircle2 size={16} color={theme.success} />
        )}
      </View>
      <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Montant */}
        <View style={[styles.infoRow, isError && { borderLeftWidth: 3, borderLeftColor: theme.error }]}>
          <Banknote size={ds.size.icon.sm} color={theme.mutedForeground} />
          <TextInput
            style={[styles.infoValue, styles.infoValueEditable, { color: theme.foreground, flex: 1, textAlign: 'left' }]}
            value={tarifField.value}
            onChangeText={tarifField.setValue}
            onBlur={tarifField.onBlur}
            keyboardType="numeric"
            placeholder={t('artisan.profile.tarif.amountPlaceholder')}
            placeholderTextColor={theme.mutedForeground}
            returnKeyType="done"
          />
          <Text style={[styles.infoLabel, { color: theme.mutedForeground, width: 'auto' }]}>
            {currency}
          </Text>
        </View>
        {isError && (
          <Text style={[styles.fieldError, { color: theme.error }]}>
            {t('artisan.profile.field.validationError')}
          </Text>
        )}
        {/* Unité */}
        <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
        <View style={tarifStyles.unitRow}>
          {TARIF_UNITS.map((unit) => {
            const active = currentUnit === unit
            return (
              <Pressable
                key={unit}
                style={[
                  tarifStyles.unitPill,
                  { borderColor: active ? theme.primary : theme.border },
                  active && { backgroundColor: `${theme.primary}14` },
                  isSavingUnit && { opacity: 0.5 },
                ]}
                onPress={() => void handleUnitChange(unit)}
                disabled={isSavingUnit}
              >
                <Text style={[tarifStyles.unitPillText, { color: active ? theme.primary : theme.mutedForeground }]}>
                  {translateDynamic(UNIT_PILL_KEYS[unit])}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
        {/* Bio */}
        <ArtisanBioField
          key={`bio-${artisan.id}`}
          artisan={artisan}
          onArtisanUpdate={onArtisanUpdate}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: ds.space[4] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.size.paddingH,
    marginBottom: ds.space[2],
  },
  sectionTitle: { ...ds.text.label, fontWeight: '700' },

  infoCard: {
    marginHorizontal: ds.size.paddingH,
    borderRadius: ds.radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[3],
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3] + 2,
  },
  infoLabel: { ...ds.text.label, width: 80 },
  infoValue: { ...ds.text.label, flex: 1, textAlign: 'right' },
  infoValueEditable: { paddingVertical: 0 },
  rowDivider: { height: 1 },

  fieldError: {
    ...ds.text.caption,
    paddingHorizontal: ds.size.paddingH,
    paddingBottom: ds.space[2],
  },

  bioRow: {
    paddingHorizontal: ds.size.paddingH,
    paddingTop: ds.space[3],
    paddingBottom: ds.space[1],
  },
  bioInput: { ...ds.text.body, minHeight: 72 },
  bioFeedbackRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: ds.space[2],
    minHeight: 22,
  },
})

const tarifStyles = StyleSheet.create({
  unitRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: 12,
  },
  unitPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  unitPillText: { fontSize: 13, fontWeight: '600' },
})
