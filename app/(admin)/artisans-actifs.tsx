import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { MapPin, Search, Star, User } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { translateDynamic } from '@/i18n'
import { getActiveArtisans, suspendArtisan } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { Avatar } from '@/presentation/components/ui'
import { useAdminBreakpoint } from '@/presentation/hooks/useAdminBreakpoint'
import type { Artisan } from '@/domain/entities/Artisan'
import type { Metier } from '@/shared/constants/metiers'
import { METIERS } from '@/shared/constants/metiers'

const CONTENT_BG = '#F8F8F7'
const TABLE_HEADER_BG = '#F0F0EF'
const TABLE_BORDER = '#E5E5E4'
const TEXT_ACCENT = '#860101'

type PlanInfo = {
  label: string
  bg: string
  color: string
  iconVariant: 'star-filled' | 'star-outline' | 'user'
}

function getPlanInfo(plan: string): PlanInfo {
  if (plan === 'premium') {
    return { label: 'Premium', bg: '#FFF4CC', color: '#B87A00', iconVariant: 'star-filled' }
  }
  if (plan === 'standard') {
    return { label: 'Standard', bg: '#FDECEA', color: TEXT_ACCENT, iconVariant: 'star-outline' }
  }
  return { label: 'Gratuit', bg: '#F0F0EF', color: '#696968', iconVariant: 'user' }
}

function formatValidatedAt(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** AD02 — Artisans actifs · Référence : figma/screenshots/05-espace-admin/02-arisans-actifs.png */
export default function ArtisansActifsScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const { isMobile, isTablet } = useAdminBreakpoint()
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [activeMetier, setActiveMetier] = useState<Metier | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const horizontalPadding = isMobile ? 16 : isTablet ? 24 : 32

  useEffect(() => {
    void load()
  }, [])

  async function load(): Promise<void> {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getActiveArtisans.execute()
      setArtisans(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      AppLogger.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSuspend(artisan: Artisan): Promise<void> {
    setProcessingId(artisan.id)
    try {
      await suspendArtisan.execute(artisan.id)
      setArtisans((prev) => prev.filter((a) => a.id !== artisan.id))
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setProcessingId(null)
    }
  }

  const filtered = artisans.filter((a) => {
    const matchesQuery =
      !query ||
      a.fullName.toLowerCase().includes(query.toLowerCase()) ||
      a.zoneGeographique.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (!activeMetier || a.metier === activeMetier)
  })

  return (
    <View style={[styles.page, { backgroundColor: CONTENT_BG }]}>
      {/* Header */}
      <View style={[styles.pageHeader, { paddingHorizontal: horizontalPadding }]}>
        <Text style={[styles.pageTitle, isMobile && styles.pageTitleMobile]}>{t('admin.activeArtisans.title')}</Text>
        {!isLoading && !error && (
          <Text style={styles.pageSubtitle}>
            {t(
              artisans.length === 1
                ? 'admin.activeArtisans.subtitle_one'
                : 'admin.activeArtisans.subtitle_other',
              { count: String(artisans.length) },
            )}
          </Text>
        )}
        {error && (
          <Text style={[styles.pageSubtitle, { color: '#D40923' }]}>
            {`Erreur : ${error}. Vérifiez docs/migrations/003_admin_rls.sql`}
          </Text>
        )}

        {/* Barre de recherche */}
        <View style={[styles.searchBar, { backgroundColor: '#fff', borderColor: TABLE_BORDER }]}>
          <Search size={16} color="#696968" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('admin.activeArtisans.searchPlaceholder')}
            placeholderTextColor="#696968"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
        </View>
        {/* Filtres métier — scroll horizontal pour accommoder tous les métiers */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          <Pressable
            style={[styles.chip, !activeMetier && styles.chipActive]}
            onPress={() => setActiveMetier(null)}
          >
            <Text style={[styles.chipText, !activeMetier && styles.chipTextActive]}>
              {t('admin.activeArtisans.filterAll')}
            </Text>
          </Pressable>
          {METIERS.map((m) => (
            <Pressable
              key={m}
              style={[styles.chip, activeMetier === m && styles.chipActive]}
              onPress={() => setActiveMetier(activeMetier === m ? null : m)}
            >
              <Text style={[styles.chipText, activeMetier === m && styles.chipTextActive]}>
                {translateDynamic(`metier.${m}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={TEXT_ACCENT} size="large" />
      ) : isMobile ? (
        /* ── Vue mobile : liste de cards ── */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {filtered.length === 0 && (
            <View style={[styles.emptyRow, { marginHorizontal: horizontalPadding }]}>
              <Text style={styles.emptyText}>{t('admin.activeArtisans.empty.title')}</Text>
            </View>
          )}
          {filtered.map((artisan) => (
            <ArtisanActifCard
              key={artisan.id}
              artisan={artisan}
              horizontalPadding={horizontalPadding}
              isProcessing={processingId === artisan.id}
              onSuspend={() => void handleSuspend(artisan)}
              t={t as unknown as TFunction}
            />
          ))}
        </ScrollView>
      ) : (
        /* ── Vue tablette / desktop : table ── */
        <ScrollView showsVerticalScrollIndicator={false}>
          {isTablet ? (
            <View style={[styles.tableWrap, { marginHorizontal: horizontalPadding, marginBottom: 32 }]}>
              <ActifsTableContent
                artisans={filtered}
                onSuspend={handleSuspend}
                processingId={processingId}
                t={t as unknown as TFunction}
                compact
              />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.tableWrap, styles.tableMinWidth, { marginHorizontal: horizontalPadding, marginBottom: 32 }]}>
                <ActifsTableContent
                  artisans={filtered}
                  onSuspend={handleSuspend}
                  processingId={processingId}
                  t={t as unknown as TFunction}
                  compact={false}
                />
              </View>
            </ScrollView>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageHeader: { paddingTop: 32, paddingBottom: 20, gap: 8 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  pageTitleMobile: { fontSize: 22 },
  pageSubtitle: { fontSize: 15, color: '#696968' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  chipsContent: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E4',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#860101', borderColor: '#860101' },
  chipText: { fontSize: 13, color: '#696968', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  loader: { flex: 1 },
  tableWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E4',
  },
  tableMinWidth: { minWidth: 860 },
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
  emptyRow: { paddingVertical: 40, alignItems: 'center', backgroundColor: '#fff' },
  emptyText: { fontSize: 14, color: '#696968' },
  colAvatar: { width: 56 },
  colName: { flex: 2, minWidth: 0, overflow: 'hidden' },
  colMetier: { flex: 1.5, minWidth: 0, overflow: 'hidden' },
  colZone: { flex: 1.5, minWidth: 0, overflow: 'hidden' },
  colPlan: { flex: 1.5, minWidth: 0, overflow: 'hidden' },
  colDate: { flex: 2, minWidth: 0 },
  colAction: { flex: 1.5 },
  cellName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedDot: { width: 8, height: 8, borderRadius: 4 },
  verifiedText: { fontSize: 11, fontWeight: '500' },
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
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  planText: { fontSize: 12, fontWeight: '700' },
  actionCell: { alignItems: 'flex-start' },
  suspendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D40923',
  },
  suspendText: { fontSize: 13, fontWeight: '600', color: '#D40923' },
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
  mobileCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mobileCardName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  mobileCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mobileCardMetier: { fontSize: 13, color: '#696968' },
  mobileCardSep: { fontSize: 13, color: '#C0C0C0' },
  mobileCardZone: { fontSize: 13, color: '#696968', flex: 1 },
  mobileCardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  mobileCardDate: { fontSize: 12, color: '#9a9a9a' },
})

// ── Sous-composants ────────────────────────────────────────────────────────

// Signature volontairement simplifiée (pas le type i18next complet) : passer le
// TFunction typé complet en prop fait exploser la profondeur d'instanciation
// TypeScript une fois le catalogue de traductions suffisamment large. Ce
// sous-composant n'appelle t() qu'avec une clé littérale sans options.
type TFunction = (key: string) => string

type ActifsTableContentProps = {
  artisans: Artisan[]
  onSuspend: (a: Artisan) => Promise<void>
  processingId: string | null
  t: TFunction
  compact: boolean
}

function ActifsTableContent({ artisans, onSuspend, processingId, t, compact }: ActifsTableContentProps): React.JSX.Element {
  return (
    <>
      <View style={[styles.tableHeader, { backgroundColor: TABLE_HEADER_BG, borderColor: TABLE_BORDER }]}>
        {!compact && <Text style={[styles.colHeader, styles.colAvatar]}>AVATAR</Text>}
        <Text style={[styles.colHeader, styles.colName]}>NOM COMPLET</Text>
        <Text style={[styles.colHeader, styles.colMetier]}>MÉTIER</Text>
        {!compact && <Text style={[styles.colHeader, styles.colZone]}>ZONE</Text>}
        <Text style={[styles.colHeader, styles.colPlan]}>ABONNEMENT</Text>
        <Text style={[styles.colHeader, styles.colDate]}>VALIDÉ LE</Text>
        <Text style={[styles.colHeader, styles.colAction]}>ACTIONS</Text>
      </View>

      {artisans.length === 0 && (
        <View style={[styles.emptyRow, { borderColor: TABLE_BORDER }]}>
          <Text style={styles.emptyText}>{t('admin.activeArtisans.empty.title')}</Text>
        </View>
      )}

      {artisans.map((artisan, index) => {
        const plan = getPlanInfo(artisan.subscriptionPlan)
        const isProcessing = processingId === artisan.id
        return (
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
                <Avatar name={artisan.fullName} size="sm" />
              </View>
            )}
            <View style={styles.colName}>
              <Text style={styles.cellName} numberOfLines={1}>{artisan.fullName}</Text>
              <View style={styles.verifiedRow}>
                <View style={[styles.verifiedDot, { backgroundColor: '#008B1B' }]} />
                <Text style={[styles.verifiedText, { color: '#008B1B' }]}>
                  {t('admin.activeArtisans.verified')}
                </Text>
              </View>
            </View>
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
                <Text style={styles.cellMuted} numberOfLines={1}>{artisan.zoneGeographique}</Text>
              </View>
            )}
            <View style={styles.colPlan}>
              <View style={[styles.planBadge, { backgroundColor: plan.bg }]}>
                {plan.iconVariant === 'star-filled' && <Star size={11} color={plan.color} fill={plan.color} />}
                {plan.iconVariant === 'star-outline' && <Star size={11} color={plan.color} />}
                {plan.iconVariant === 'user' && <User size={11} color={plan.color} />}
                <Text style={[styles.planText, { color: plan.color }]}>{plan.label}</Text>
              </View>
            </View>
            <Text style={[styles.cellDate, styles.colDate]}>{formatValidatedAt(artisan.createdAt)}</Text>
            <View style={[styles.colAction, styles.actionCell]}>
              <Pressable
                style={[styles.suspendBtn, isProcessing && { opacity: 0.5 }]}
                onPress={() => void onSuspend(artisan)}
                disabled={isProcessing}
              >
                <Text style={styles.suspendText}>{t('admin.activeArtisans.suspend')}</Text>
              </Pressable>
            </View>
          </View>
        )
      })}
    </>
  )
}

type ArtisanActifCardProps = {
  artisan: Artisan
  horizontalPadding: number
  isProcessing: boolean
  onSuspend: () => void
  t: TFunction
}

function ArtisanActifCard({ artisan, horizontalPadding, isProcessing, onSuspend, t }: ArtisanActifCardProps): React.JSX.Element {
  const plan = getPlanInfo(artisan.subscriptionPlan)
  return (
    <View style={[styles.mobileCard, { paddingHorizontal: horizontalPadding }]}>
      <Avatar name={artisan.fullName} size="sm" />
      <View style={styles.mobileCardBody}>
        <View style={styles.mobileCardTop}>
          <Text style={styles.mobileCardName} numberOfLines={1}>{artisan.fullName}</Text>
          <View style={[styles.planBadge, { backgroundColor: plan.bg }]}>
            {plan.iconVariant === 'star-filled' && <Star size={10} color={plan.color} fill={plan.color} />}
            {plan.iconVariant === 'star-outline' && <Star size={10} color={plan.color} />}
            {plan.iconVariant === 'user' && <User size={10} color={plan.color} />}
            <Text style={[styles.planText, { color: plan.color, fontSize: 11 }]}>{plan.label}</Text>
          </View>
        </View>
        <View style={styles.mobileCardMeta}>
          <Text style={styles.mobileCardMetier} numberOfLines={1}>
            {translateDynamic(`metier.${artisan.metier}`)}
          </Text>
          <Text style={styles.mobileCardSep}>·</Text>
          <MapPin size={11} color="#696968" />
          <Text style={styles.mobileCardZone} numberOfLines={1}>{artisan.zoneGeographique}</Text>
        </View>
        <View style={styles.mobileCardActions}>
          <Text style={styles.mobileCardDate}>{formatValidatedAt(artisan.createdAt)}</Text>
          <Pressable
            style={[styles.suspendBtn, isProcessing && { opacity: 0.5 }]}
            onPress={onSuspend}
            disabled={isProcessing}
          >
            <Text style={styles.suspendText}>{t('admin.activeArtisans.suspend')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}
