import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Clock } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { translateDynamic } from '@/i18n'
import { getReports, markReportTreated, suspendArtisan } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { useAdminBreakpoint } from '@/presentation/hooks/useAdminBreakpoint'
import type { Report } from '@/domain/entities/Report'

const CONTENT_BG = '#F8F8F7'
const TABLE_BORDER = '#E5E5E4'
const TEXT_ACCENT = '#860101'

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function avatarBg(name: string): string {
  const colors = ['#5B4FCF', '#2E86AB', '#4CAF50', '#FF7043', '#9C27B0']
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx] ?? TEXT_ACCENT
}

function calendarDayDiff(date: Date): number {
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((todayMidnight.getTime() - dateMidnight.getTime()) / 86_400_000)
}

function formatReportDate(date: Date): string {
  const diffDays = calendarDayDiff(date)
  const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  if (diffDays === 0) return translateDynamic('common.date.todayAt', { time })
  if (diffDays === 1) return translateDynamic('common.date.yesterdayAt', { time })
  return translateDynamic('admin.validation.daysAgo', { count: String(diffDays) })
}

/** AD03 — Signalements · Référence : figma/screenshots/05-espace-admin/02-arisans-signalements.png */
export default function SignalementsScreen() {
  const { t } = useTranslation()
  const { isMobile, isTablet } = useAdminBreakpoint()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load(): Promise<void> {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getReports.execute()
      setReports(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      AppLogger.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMarkTreated(report: Report): Promise<void> {
    setProcessingId(report.id)
    try {
      await markReportTreated.execute(report.id)
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: 'treated' } : r)),
      )
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleSuspend(report: Report): Promise<void> {
    setProcessingId(report.id)
    try {
      await suspendArtisan.execute(report.artisanId)
      await markReportTreated.execute(report.id)
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: 'treated' } : r)),
      )
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setProcessingId(null)
    }
  }

  const pending = reports.filter((r) => r.status === 'pending')
  const treated = reports.filter((r) => r.status === 'treated')

  return (
    <View style={[styles.page, { backgroundColor: CONTENT_BG }]}>
      <View style={[styles.pageHeader, { paddingHorizontal: isMobile ? 16 : isTablet ? 24 : 32 }]}>
        <Text style={[styles.pageTitle, isMobile && styles.pageTitleMobile]}>{t('admin.reports.title')}</Text>
        {!isLoading && !error && (
          <Text style={styles.pageSubtitle}>
            {t('admin.reports.subtitle', {
              pending: String(pending.length),
              treated: String(treated.length),
            })}
          </Text>
        )}
        {error && (
          <Text style={[styles.pageSubtitle, { color: '#D40923' }]}>
            {`Erreur : ${error}. Vérifiez docs/migrations/004_reports.sql`}
          </Text>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={TEXT_ACCENT} size="large" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Section À traiter */}
          {pending.length > 0 && (
            <View style={[styles.section, { paddingHorizontal: isMobile ? 16 : isTablet ? 24 : 32 }]}>
              <Text style={styles.sectionLabel}>
                {t('admin.reports.sections.toProcess', { count: String(pending.length) })}
              </Text>
              {pending.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  isProcessing={processingId === r.id}
                  onMarkTreated={() => void handleMarkTreated(r)}
                  onSuspend={() => void handleSuspend(r)}
                  isMobile={isMobile}
                />
              ))}
            </View>
          )}

          {/* Section Traités */}
          {treated.length > 0 && (
            <View style={[styles.section, { paddingHorizontal: isMobile ? 16 : isTablet ? 24 : 32 }]}>
              <Text style={styles.sectionLabel}>
                {t('admin.reports.sections.treated', { count: String(treated.length) })}
              </Text>
              {treated.map((r) => (
                <ReportCard key={r.id} report={r} dimmed isMobile={isMobile} />
              ))}
            </View>
          )}

          {!isLoading && reports.length === 0 && !error && (
            <View style={[styles.emptyState, { paddingHorizontal: isMobile ? 16 : isTablet ? 24 : 32 }]}>
              <Text style={styles.emptyTitle}>{t('admin.reports.empty.title')}</Text>
              <Text style={styles.emptyDesc}>{t('admin.reports.empty.description')}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

type ReportCardProps = {
  report: Report
  dimmed?: boolean
  isProcessing?: boolean
  isMobile?: boolean
  onMarkTreated?: () => void
  onSuspend?: () => void
}

function ReportCard({ report, dimmed = false, isProcessing = false, isMobile = false, onMarkTreated, onSuspend }: ReportCardProps) {
  const { t } = useTranslation()
  const isPending = report.status === 'pending'

  return (
    <View style={[styles.card, dimmed && styles.cardDimmed, isMobile && styles.cardMobile]}>
      {/* Double avatar : artisan (grand) + reporter (petit, en bas à droite) */}
      <View style={styles.avatarStack}>
        <View
          style={[
            styles.avatarMain,
            { backgroundColor: avatarBg(report.artisanName) },
            dimmed && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.avatarText}>{initials(report.artisanName)}</Text>
        </View>
        <View
          style={[
            styles.avatarReporter,
            { backgroundColor: '#696968' },
            dimmed && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.avatarReporterText}>{initials(report.reporterName)}</Text>
        </View>
      </View>

      {/* Contenu */}
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={[styles.artisanName, dimmed && { color: '#696968' }]}>
            {report.artisanName}
          </Text>
          <Text style={styles.signalePar}>{t('admin.reports.reportedBy')}</Text>
          <Text style={[styles.reporterName, dimmed && { color: '#696968' }]}>
            {report.reporterName}
          </Text>
        </View>
        <Text style={[styles.reason, dimmed && { color: '#696968' }]}>{report.reason}</Text>
        <View style={styles.cardMeta}>
          <Clock size={12} color="#696968" />
          <Text style={styles.dateText}>{formatReportDate(report.createdAt)}</Text>
          {isPending ? (
            <View style={[styles.statusBadge, { backgroundColor: '#FFF4CC' }]}>
              <Text style={[styles.statusText, { color: '#B87A00' }]}>
                {t('admin.reports.statuses.pending')}
              </Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: '#D6FAD5' }]}>
              <Text style={[styles.statusText, { color: '#008B1B' }]}>
                {t('admin.reports.statuses.treated')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Boutons d'action (seulement pour les signalements en attente) */}
      {isPending && onMarkTreated && onSuspend && (
        <View style={[styles.cardActions, isMobile && styles.cardActionsMobile]}>
          <Pressable
            style={[styles.actionBtn, { borderColor: '#008B1B' }, isProcessing && { opacity: 0.5 }, isMobile && styles.actionBtnFull]}
            onPress={onMarkTreated}
            disabled={isProcessing}
          >
            <Text style={[styles.actionBtnText, { color: '#008B1B' }]}>
              {t('admin.reports.markTreated')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { borderColor: '#D40923' }, isProcessing && { opacity: 0.5 }, isMobile && styles.actionBtnFull]}
            onPress={onSuspend}
            disabled={isProcessing}
          >
            <Text style={[styles.actionBtnText, { color: '#D40923' }]}>
              {t('admin.reports.suspend')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageHeader: { paddingTop: 32, paddingBottom: 8, gap: 4 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  pageTitleMobile: { fontSize: 22 },
  pageSubtitle: { fontSize: 15, color: '#696968' },
  loader: { flex: 1 },
  scroll: { paddingBottom: 32 },
  section: { paddingTop: 24, gap: 12 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_ACCENT,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  emptyState: { paddingTop: 48, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  emptyDesc: { fontSize: 14, color: '#696968', textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TABLE_BORDER,
  },
  cardMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
  },
  cardDimmed: { backgroundColor: '#FAFAF9' },
  avatarStack: { width: 52, height: 44, position: 'relative' },
  avatarMain: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
  },
  avatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  avatarReporter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 3,
  },
  avatarReporterText: { fontSize: 8, fontWeight: '700', color: '#fff' },
  cardContent: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  artisanName: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  signalePar: { fontSize: 13, color: '#696968' },
  reporterName: { fontSize: 13, fontWeight: '600', color: '#333' },
  reason: { fontSize: 14, color: '#333' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, color: '#696968' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'column', gap: 8 },
  cardActionsMobile: { flexDirection: 'row', gap: 8, width: '100%' },
  actionBtnFull: { flex: 1 },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
})
