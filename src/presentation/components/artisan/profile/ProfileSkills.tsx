import { useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Plus, X } from 'lucide-react-native'
import { translateDynamic, useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { updateArtisanProfile } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { COMPETENCES_BY_METIER } from '@/shared/constants/competences'
import type { Artisan } from '@/domain/entities/Artisan'

interface ProfileSkillsProps {
  artisan: Artisan
  onArtisanUpdate: (updated: Artisan) => void
}

export function ProfileSkills({ artisan, onArtisanUpdate }: ProfileSkillsProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const metierCompetences = artisan.metier
    ? (COMPETENCES_BY_METIER[artisan.metier] ?? [])
    : []
  const available = metierCompetences.filter((c) => !artisan.competences.includes(c))

  async function saveCompetences(next: string[]): Promise<void> {
    setIsSaving(true)
    try {
      const updated = await updateArtisanProfile.execute({
        artisanId: artisan.id,
        competences: next,
      })
      onArtisanUpdate(updated)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemove(key: string): Promise<void> {
    await saveCompetences(artisan.competences.filter((c) => c !== key))
  }

  async function handleAdd(key: string): Promise<void> {
    await saveCompetences([...artisan.competences, key])
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
          {t('artisan.profile.sections.competences')}
        </Text>
        <View style={styles.headerActions}>
          {isSaving && <ActivityIndicator size="small" color={theme.mutedForeground} />}
          {isDeleting ? (
            <Pressable onPress={() => setIsDeleting(false)} style={styles.doneBtn}>
              <Text style={[styles.doneBtnText, { color: theme.primary }]}>
                {t('common.button.done')}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setShowAddModal(true)}
              style={styles.addBtn}
              accessibilityRole="button"
            >
              <Plus size={18} color={theme.primary} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.chipsWrap, { paddingHorizontal: ds.size.paddingH }]}>
        {artisan.competences.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>—</Text>
        ) : (
          artisan.competences.map((key) => (
            <Pressable
              key={key}
              style={[
                styles.chip,
                { borderColor: isDeleting ? theme.error : theme.border, backgroundColor: theme.surface },
              ]}
              onLongPress={() => setIsDeleting(true)}
              onPress={isDeleting ? () => void handleRemove(key) : undefined}
              delayLongPress={500}
              accessibilityRole="button"
            >
              <Text
                style={[styles.chipText, { color: isDeleting ? theme.error : theme.foreground }]}
                numberOfLines={1}
              >
                {translateDynamic(`artisan.competences.${key}`)}
              </Text>
              {isDeleting && <X size={13} color={theme.error} />}
            </Pressable>
          ))
        )}
      </View>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable
            style={[styles.modalBox, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.foreground }]}>
                {t('artisan.profile.competences.addTitle')}
              </Text>
              <Pressable onPress={() => setShowAddModal(false)} accessibilityRole="button">
                <X size={20} color={theme.mutedForeground} />
              </Pressable>
            </View>
            {available.length === 0 ? (
              <Text style={[styles.allAdded, { color: theme.mutedForeground }]}>
                {t('artisan.profile.competences.allAdded')}
              </Text>
            ) : (
              <ScrollView
                contentContainerStyle={styles.modalChips}
                showsVerticalScrollIndicator={false}
              >
                {available.map((key) => (
                  <Pressable
                    key={key}
                    style={[styles.chip, styles.chipAvailable, { borderColor: theme.primary }]}
                    onPress={() => void handleAdd(key)}
                    accessibilityRole="button"
                  >
                    <Plus size={13} color={theme.primary} />
                    <Text style={[styles.chipText, { color: theme.primary }]} numberOfLines={1}>
                      {translateDynamic(`artisan.competences.${key}`)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtn: { padding: 2 },
  doneBtn: { paddingHorizontal: 4, paddingVertical: 2 },
  doneBtnText: { fontSize: 14, fontWeight: '600' },
  emptyText: { ...ds.text.label, flex: 1, textAlign: 'left' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  chipAvailable: { backgroundColor: 'transparent' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  allAdded: {
    textAlign: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    fontSize: 14,
  },
})
