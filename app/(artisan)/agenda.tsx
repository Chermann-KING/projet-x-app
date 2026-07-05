import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useTranslation } from '@/i18n'
import { ds } from '@/shared/designSystem'
import { useTheme } from '@/presentation/hooks/useTheme'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getArtisanAgenda } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'
import { DEFAULT_APPOINTMENT_DURATION_MINUTES } from '@/domain/entities/Appointment'
import type { Appointment } from '@/domain/entities/Appointment'
import type { Quote } from '@/domain/entities/Quote'

// ---------------------------------------------------------------------------
// Helpers date
// ---------------------------------------------------------------------------

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  )
}

function formatHour(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6)
  const startDay = monday.getDate()
  const endDay = sunday.getDate()
  const monthLabel = sunday.toLocaleDateString('fr-FR', { month: 'short' })
  const year = sunday.getFullYear()
  return `${startDay} – ${endDay} ${monthLabel}. ${year}`
}

function dayAbbr(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3).toUpperCase()
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AgendaScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)

  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [quotesMap, setQuotesMap] = useState<Record<string, Quote>>({})
  const [clientNamesMap, setClientNamesMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void load()
  }, [])

  async function load(): Promise<void> {
    if (!user) return
    setIsLoading(true)
    try {
      const data = await getArtisanAgenda.execute(user.id)
      setAppointments(data.appointments)
      setQuotesMap(data.quotesMap)
      setClientNamesMap(data.clientNamesMap)
    } catch (err) {
      AppLogger.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const apptsByDay = (day: Date): Appointment[] =>
    appointments
      .filter((a) => isSameDay(new Date(a.scheduledAt), day))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          {t('artisan.agenda.title')}
        </Text>
      </View>

      {/* ── Navigateur de semaine ─────────────────────────────────────── */}
      <View style={[styles.weekNav, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Pressable
          style={styles.navArrow}
          onPress={() => setWeekStart((d) => addDays(d, -7))}
          accessibilityRole="button"
          accessibilityLabel={t('common.navigation.prevWeek')}
        >
          <ChevronLeft size={20} color={theme.foreground} />
        </Pressable>
        <Text style={[styles.weekLabel, { color: theme.foreground }]}>
          {formatWeekLabel(weekStart)}
        </Text>
        <Pressable
          style={styles.navArrow}
          onPress={() => setWeekStart((d) => addDays(d, 7))}
          accessibilityRole="button"
          accessibilityLabel={t('common.navigation.nextWeek')}
        >
          <ChevronRight size={20} color={theme.foreground} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} size="large" />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {weekDays.map((day) => {
            const dayAppts = apptsByDay(day)
            const hasAppts = dayAppts.length > 0
            const isToday = isSameDay(day, new Date())

            return (
              <View key={day.toISOString()} style={styles.dayBlock}>
                {/* ── Ligne du jour ─────────────────────────────────── */}
                <View style={styles.dayHeader}>
                  <View
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: hasAppts ? theme.primary : theme.muted,
                        borderWidth: isToday && !hasAppts ? 1 : 0,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayAbbr,
                        { color: hasAppts ? theme.primaryForeground : theme.mutedForeground },
                      ]}
                    >
                      {dayAbbr(day)}
                    </Text>
                    <Text
                      style={[
                        styles.dayNum,
                        { color: hasAppts ? theme.primaryForeground : theme.foreground },
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </View>

                  {hasAppts ? (
                    <Text style={[styles.rdvCount, { color: theme.foreground }]}>
                      {t('artisan.agenda.rdvCount', { count: dayAppts.length })}
                    </Text>
                  ) : (
                    <Text style={[styles.freeDay, { color: theme.mutedForeground }]}>
                      {'— ' + t('artisan.agenda.freeDay')}
                    </Text>
                  )}
                </View>

                {/* ── Cards RDV ─────────────────────────────────────── */}
                {dayAppts.map((appt) => {
                  const relatedQuote = quotesMap[appt.quoteId]
                  const clientName = clientNamesMap[appt.clientId] ?? t('artisan.agenda.appointment.unknownClient')
                  const desc = relatedQuote?.description?.slice(0, 40) ?? t('artisan.agenda.appointment.noDescription')
                  const durationMin = appt.durationMinutes ?? DEFAULT_APPOINTMENT_DURATION_MINUTES
                  const durationLabel = formatDuration(durationMin)

                  return (
                    <View
                      key={appt.id}
                      style={[styles.apptCard, { backgroundColor: theme.primary }]}
                    >
                      <Text style={styles.apptTime}>
                        {formatHour(new Date(appt.scheduledAt))}
                      </Text>
                      <View style={styles.apptInfo}>
                        <Text style={styles.apptClient} numberOfLines={1}>
                          {clientName}
                        </Text>
                        <Text style={styles.apptDesc} numberOfLines={1}>
                          {desc}
                        </Text>
                      </View>
                      <View style={styles.apptDuration}>
                        <Text style={styles.apptDurationText}>{durationLabel}</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            )
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loader: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[4],
    borderBottomWidth: 1,
  },
  title: { ...ds.text.h2 },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ds.size.paddingH,
    paddingVertical: ds.space[3],
    borderBottomWidth: 1,
  },
  navArrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: { ...ds.text.label, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: ds.space[10] },
  dayBlock: {
    paddingHorizontal: ds.size.paddingH,
    paddingTop: ds.space[4],
    gap: ds.space[2],
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: ds.space[3] },
  dayChip: {
    width: 44,
    height: 52,
    borderRadius: ds.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayAbbr: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  dayNum: { fontSize: 18, fontWeight: '700' },
  rdvCount: { ...ds.text.label, fontWeight: '600' },
  freeDay: { ...ds.text.label, fontStyle: 'italic' },
  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.space[4],
    padding: ds.space[4],
    borderRadius: ds.radius.card,
    marginLeft: 44 + ds.space[3],
  },
  apptTime: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    minWidth: 50,
  },
  apptInfo: { flex: 1, gap: 2 },
  apptClient: { color: '#fff', fontWeight: '700', fontSize: 15 },
  apptDesc: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  apptDuration: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: ds.space[2],
    paddingVertical: 3,
    borderRadius: ds.radius.avatar,
  },
  apptDurationText: { color: '#fff', fontSize: 12, fontWeight: '600' },
})
