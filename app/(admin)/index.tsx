import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { ChevronRight, MapPin, X } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { translateDynamic } from '@/i18n'
import { getPendingArtisans, approveArtisan, suspendArtisan } from '@/di/container'
import { getCurrencyFromPhone } from '@/shared/constants/PhoneConstants'
import { AppLogger } from '@/shared/logger/AppLogger'
import { Avatar, Button, PhotoViewer } from '@/presentation/components/ui'
import { useAdminBreakpoint } from '@/presentation/hooks/useAdminBreakpoint'
import type { Artisan } from '@/domain/entities/Artisan'

const CONTENT_BG = '#F8F8F7'
const TABLE_HEADER_BG = '#F0F0EF'
const TABLE_BORDER = '#E5E5E4'
const TEXT_ACCENT = '#860101'

function calendarDayDiff(date: Date): number {
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((todayMidnight.getTime() - dateMidnight.getTime()) / 86_400_000)
}

function formatSubmittedAt(date: Date): string {
  const diffDays = calendarDayDiff(date)
  const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  if (diffDays === 0) return translateDynamic('common.date.todayAt', { time })
  if (diffDays === 1) return translateDynamic('common.date.yesterdayAt', { time })
  const diffLabel = translateDynamic('admin.validation.daysAgo', { count: String(diffDays) })
  return diffLabel || `Il y a ${diffDays} jours`
}

/** AD01 — File de validation · Référence : figma/screenshots/05-espace-admin/01-arisans-a-valider.png */
export default function AdminValidationScreen() {
  const { t } = useTranslation()
  const { isMobile, isTablet } = useAdminBreakpoint()
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Artisan | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerVisible, setViewerVisible] = useState(false)

  const horizontalPadding = isMobile ? 16 : isTablet ? 24 : 32

  useEffect(() => {
    void load()
  }, [])

  async function load(): Promise<void> {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getPendingArtisans.execute()
      setArtisans(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      AppLogger.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleApprove(artisan: Artisan): Promise<void> {
    setProcessingId(artisan.id)
    try {
      await approveArtisan.execute(artisan.id)
      setArtisans((prev) => prev.filter((a) => a.id !== artisan.id))
      setSelected(null)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(artisan: Artisan): Promise<void> {
    setProcessingId(artisan.id)
    try {
      await suspendArtisan.execute(artisan.id)
      setArtisans((prev) => prev.filter((a) => a.id !== artisan.id))
      setSelected(null)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <View style={[styles.page, { backgroundColor: CONTENT_BG }]}>
      {/* Header */}
      <View style={[styles.pageHeader, { paddingHorizontal: horizontalPadding }]}>
        <Text style={[styles.pageTitle, isMobile && styles.pageTitleMobile]}>
          {t('admin.validation.title')}
        </Text>
        {!isLoading && !error && (
          <Text style={styles.pageSubtitle}>
            {artisans.length === 0
              ? t('admin.validation.empty.description')
              : t(artisans.length === 1
                  ? 'admin.validation.subtitle_one'
                  : 'admin.validation.subtitle_other',
                  { count: String(artisans.length) })}
          </Text>
        )}
        {error && (
          <Text style={[styles.pageSubtitle, { color: '#D40923' }]}>
            {`Erreur Supabase : ${error}. Vérifiez la migration docs/migrations/003_admin_rls.sql`}
          </Text>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={TEXT_ACCENT} size="large" />
      ) : isMobile ? (
        /* ── Vue mobile : liste de cards ── */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {artisans.length === 0 && !error && (
            <View style={[styles.emptyRow, { marginHorizontal: horizontalPadding }]}>
              <Text style={styles.emptyText}>{t('admin.validation.empty.title')}</Text>
            </View>
          )}
          {artisans.map((artisan) => (
            <ArtisanCard
              key={artisan.id}
              artisan={artisan}
              horizontalPadding={horizontalPadding}
              onPress={() => setSelected(artisan)}
            />
          ))}
        </ScrollView>
      ) : (
        /* ── Vue tablette / desktop : table ── */
        <ScrollView showsVerticalScrollIndicator={false}>
          {isTablet ? (
            /* Tablette : table pleine largeur sans scroll horizontal */
            <View style={[styles.tableWrap, { marginHorizontal: horizontalPadding, marginBottom: 32 }]}>
              <TableContent
                artisans={artisans}
                error={error}
                onSelect={setSelected}
                t={t}
                compact
              />
            </View>
          ) : (
            /* Desktop : table avec scroll horizontal si besoin */
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.tableWrap, styles.tableMinWidth, { marginHorizontal: horizontalPadding, marginBottom: 32 }]}>
                <TableContent
                  artisans={artisans}
                  error={error}
                  onSelect={setSelected}
                  t={t}
                  compact={false}
                />
              </View>
            </ScrollView>
          )}
        </ScrollView>
      )}

      {/* Modal profil + validation */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: '#fff', width: isMobile ? '95%' : 480 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Avatar
                  name={selected?.fullName ?? ''}
                  size="sm"
                  {...(selected?.avatarUrl !== undefined && { uri: selected.avatarUrl })}
                />
                <Text style={styles.modalTitle}>{selected?.fullName}</Text>
              </View>
              <Pressable onPress={() => setSelected(null)} accessibilityRole="button">
                <X size={20} color="#333" />
              </Pressable>
            </View>
            {selected && (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* ── Hero banner ─────────────────────────────────────── */}
                {selected.bannerUrl ? (
                  <Image
                    source={{ uri: selected.bannerUrl }}
                    style={styles.heroBanner}
                    resizeMode="cover"
                  />
                ) : null}

                <View style={styles.modalBody}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>{t('admin.modal.metier')}</Text>
                    <Text style={styles.modalValue}>
                      {translateDynamic(`metier.${selected.metier}`)}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>{t('admin.modal.zone')}</Text>
                    <Text style={styles.modalValue}>{selected.zoneGeographique}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>{t('admin.modal.tarif')}</Text>
                    <Text style={styles.modalValue}>
                      {selected.tarifIndicatif != null
                        ? `${selected.tarifIndicatif.toLocaleString('fr-FR')} ${getCurrencyFromPhone(selected.phone)} / ${selected.tarifUnit ?? 'heure'}`
                        : '—'}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>{t('admin.modal.telephone')}</Text>
                    <Text style={styles.modalValue}>{selected.phone}</Text>
                  </View>
                  {selected.bio ? (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>{t('admin.modal.bio')}</Text>
                      <Text style={styles.modalValue}>{selected.bio}</Text>
                    </View>
                  ) : null}

                  {/* ── Compétences ───────────────────────────────────── */}
                  {selected.competences.length > 0 ? (
                    <View style={styles.modalSectionBlock}>
                      <Text style={styles.modalSectionLabel}>{t('admin.modal.competences')}</Text>
                      <View style={styles.chipsWrap}>
                        {selected.competences.map((key) => (
                          <View key={key} style={[styles.chip, { borderColor: TABLE_BORDER }]}>
                            <Text style={styles.chipText}>
                              {translateDynamic(`artisan.competences.${key}`)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {/* ── Portfolio ─────────────────────────────────────── */}
                  <View style={styles.modalSectionBlock}>
                    <Text style={styles.modalSectionLabel}>
                      {t('admin.modal.portfolio.title', { count: selected.photos.length })}
                    </Text>
                    {selected.photos.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.photoList}
                      >
                        {selected.photos.map((photo, index) => (
                          <Pressable
                            key={photo.id}
                            onPress={() => { setViewerIndex(index); setViewerVisible(true) }}
                            accessibilityRole="button"
                          >
                            <Image
                              source={{ uri: photo.url }}
                              style={styles.photoThumb}
                              resizeMode="cover"
                            />
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : (
                      <Text style={styles.noPhotosText}>{t('admin.modal.portfolio.empty')}</Text>
                    )}
                  </View>
                </View>
              </ScrollView>
            )}
            {selected && (
              <View style={[styles.modalActions, isMobile && styles.modalActionsMobile]}>
                <Button
                  label={t('admin.validation.approve')}
                  onPress={() => void handleApprove(selected)}
                  variant="primary"
                  loading={processingId === selected.id}
                  disabled={processingId !== null}
                  fullWidth={isMobile}
                />
                <Button
                  label={t('admin.validation.reject')}
                  onPress={() => void handleReject(selected)}
                  variant="secondary"
                  loading={false}
                  disabled={processingId !== null}
                  fullWidth={isMobile}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      <PhotoViewer
        photos={selected?.photos ?? []}
        initialIndex={viewerIndex}
        visible={viewerVisible}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageHeader: {
    paddingTop: 32,
    paddingBottom: 20,
  },
  pageTitle: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  pageTitleMobile: { fontSize: 22 },
  pageSubtitle: { fontSize: 15, color: '#696968' },
  loader: { flex: 1 },
  tableWrap: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5E4' },
  tableMinWidth: { minWidth: 760 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  colHeader: { fontSize: 11, fontWeight: '600', color: '#696968', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    backgroundColor: '#fff',
  },
  emptyRow: {
    paddingVertical: 40,
    alignItems: 'center',
    borderBottomWidth: 0,
    backgroundColor: '#fff',
  },
  emptyText: { fontSize: 14, color: '#696968' },
  colAvatar: { width: 56 },
  colName: { flex: 2, minWidth: 0, overflow: 'hidden' },
  colMetier: { flex: 1.5, minWidth: 0, overflow: 'hidden' },
  colZone: { flex: 1.5, minWidth: 0, overflow: 'hidden' },
  colDate: { flex: 2, minWidth: 0 },
  colAction: { flex: 2, alignItems: 'flex-end' },
  cellName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  metierChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  metierChipText: { fontSize: 13, color: '#333' },
  zoneCell: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cellMuted: { fontSize: 13, color: '#696968', flex: 1 },
  cellDate: { fontSize: 13, color: '#696968' },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  viewBtnText: { fontSize: 13, fontWeight: '600' },
  // Mobile card
  mobileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E4',
    backgroundColor: '#fff',
  },
  mobileCardBody: { flex: 1, gap: 2 },
  mobileCardName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  mobileCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mobileCardMetier: { fontSize: 13, color: '#696968' },
  mobileCardSep: { fontSize: 13, color: '#C0C0C0' },
  mobileCardZone: { fontSize: 13, color: '#696968', flex: 1 },
  mobileCardDate: { fontSize: 12, color: '#9a9a9a', marginTop: 2 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    maxWidth: '95%',
    maxHeight: '85%',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalScroll: { maxHeight: 400 },
  heroBanner: { width: '100%', height: 120, borderRadius: 8, marginBottom: 4 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', flex: 1 },
  modalBody: { gap: 12 },
  modalRow: { flexDirection: 'row', gap: 12 },
  modalLabel: { width: 80, fontSize: 13, color: '#696968', fontWeight: '500' },
  modalValue: { flex: 1, fontSize: 13, color: '#1a1a1a' },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalActionsMobile: { flexDirection: 'column', gap: 10 },
  modalSectionBlock: { gap: 8 },
  modalSectionLabel: { fontSize: 12, fontWeight: '600', color: '#696968', textTransform: 'uppercase', letterSpacing: 0.5 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, color: '#333' },
  photoList: { gap: 8 },
  photoThumb: { width: 100, height: 75, borderRadius: 8 },
  noPhotosText: { fontSize: 13, color: '#9a9a9a', fontStyle: 'italic' },
})

// ── Sous-composants ────────────────────────────────────────────────────────

type TFunction = ReturnType<typeof useTranslation>['t']

type TableContentProps = {
  artisans: Artisan[]
  error: string | null
  onSelect: (a: Artisan) => void
  t: TFunction
  compact: boolean
}

function TableContent({ artisans, error, onSelect, t, compact }: TableContentProps) {
  return (
    <>
      <View style={[styles.tableHeader, { backgroundColor: TABLE_HEADER_BG, borderColor: TABLE_BORDER }]}>
        {!compact && <Text style={[styles.colHeader, styles.colAvatar]}>{t('admin.validation.columns.avatar')}</Text>}
        <Text style={[styles.colHeader, styles.colName]}>{t('admin.validation.columns.name')}</Text>
        <Text style={[styles.colHeader, styles.colMetier]}>{t('admin.validation.columns.metier')}</Text>
        {!compact && <Text style={[styles.colHeader, styles.colZone]}>{t('admin.validation.columns.zone')}</Text>}
        <Text style={[styles.colHeader, styles.colDate]}>{t('admin.validation.columns.submittedAt')}</Text>
        <Text style={[styles.colHeader, styles.colAction]}>{t('admin.validation.columns.actions')}</Text>
      </View>

      {artisans.length === 0 && !error && (
        <View style={[styles.emptyRow, { borderColor: TABLE_BORDER }]}>
          <Text style={styles.emptyText}>{t('admin.validation.empty.title')}</Text>
        </View>
      )}

      {artisans.map((artisan, index) => (
        <View
          key={artisan.id}
          style={[
            styles.tableRow,
            { borderColor: TABLE_BORDER },
            index % 2 === 1 && { backgroundColor: '#FAFAF9' },
          ]}
        >
          {!compact && (
            <View style={styles.colAvatar}>
              <Avatar
                name={artisan.fullName}
                size="sm"
                {...(artisan.avatarUrl !== undefined && { uri: artisan.avatarUrl })}
              />
            </View>
          )}
          <Text style={[styles.cellName, styles.colName]} numberOfLines={1}>
            {artisan.fullName}
          </Text>
          <View style={styles.colMetier}>
            <View style={[styles.metierChip, { borderColor: TABLE_BORDER }]}>
              <Text style={styles.metierChipText}>
                {translateDynamic(`metier.${artisan.metier}`)}
              </Text>
            </View>
          </View>
          {!compact && (
            <View style={[styles.colZone, styles.zoneCell]}>
              <MapPin size={12} color="#696968" />
              <Text style={styles.cellMuted} numberOfLines={1}>
                {artisan.zoneGeographique}
              </Text>
            </View>
          )}
          <Text style={[styles.cellDate, styles.colDate]}>
            {formatSubmittedAt(artisan.createdAt)}
          </Text>
          <View style={styles.colAction}>
            <Pressable
              style={[styles.viewBtn, { borderColor: TEXT_ACCENT }]}
              onPress={() => onSelect(artisan)}
            >
              <Text style={[styles.viewBtnText, { color: TEXT_ACCENT }]}>
                {t('admin.validation.viewProfile')}
              </Text>
              <ChevronRight size={14} color={TEXT_ACCENT} />
            </Pressable>
          </View>
        </View>
      ))}
    </>
  )
}

type ArtisanCardProps = {
  artisan: Artisan
  horizontalPadding: number
  onPress: () => void
}

function ArtisanCard({ artisan, horizontalPadding, onPress }: ArtisanCardProps) {
  return (
    <Pressable
      style={[styles.mobileCard, { paddingHorizontal: horizontalPadding }]}
      onPress={onPress}
    >
      <Avatar
        name={artisan.fullName}
        size="sm"
        {...(artisan.avatarUrl !== undefined && { uri: artisan.avatarUrl })}
      />
      <View style={styles.mobileCardBody}>
        <Text style={styles.mobileCardName} numberOfLines={1}>{artisan.fullName}</Text>
        <View style={styles.mobileCardMeta}>
          <Text style={styles.mobileCardMetier} numberOfLines={1}>
            {translateDynamic(`metier.${artisan.metier}`)}
          </Text>
          <Text style={styles.mobileCardSep}>·</Text>
          <MapPin size={11} color="#696968" />
          <Text style={styles.mobileCardZone} numberOfLines={1}>
            {artisan.zoneGeographique}
          </Text>
        </View>
        <Text style={styles.mobileCardDate}>{formatSubmittedAt(artisan.createdAt)}</Text>
      </View>
      <ChevronRight size={16} color={TEXT_ACCENT} />
    </Pressable>
  )
}


