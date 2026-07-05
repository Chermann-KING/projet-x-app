import { DEFAULT_APPOINTMENT_DURATION_MINUTES } from '@/domain/entities/Appointment'

export interface TimeInterval {
  /** Minutes depuis minuit (0–1440). */
  start: number
  end: number
}

export interface AvailabilitySlot {
  date: string  // "YYYY-MM-DD"
  start: string // "HH:mm"
  end: string   // "HH:mm"
}

// ---------------------------------------------------------------------------
// Conversions temporelles
// ---------------------------------------------------------------------------

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// ---------------------------------------------------------------------------
// Arithmétique sur les intervalles
// ---------------------------------------------------------------------------

/**
 * Soustrait un créneau occupé d'une liste de créneaux libres.
 * Découpe les intervalles si le créneau occupé est à l'intérieur.
 */
export function subtractInterval(
  freeIntervals: TimeInterval[],
  busy: TimeInterval,
): TimeInterval[] {
  return freeIntervals.flatMap((free) => {
    if (busy.end <= free.start || busy.start >= free.end) return [free]

    const result: TimeInterval[] = []
    if (busy.start > free.start) result.push({ start: free.start, end: busy.start })
    if (busy.end < free.end) result.push({ start: busy.end, end: free.end })
    return result
  })
}

/**
 * Calcule la portion d'un appointment qui tombe sur le jour donné,
 * exprimée en minutes depuis minuit de ce jour.
 *
 * Gère le chevauchement de minuit (ex. RDV 23h00 + 3h → bloque
 * [1380, 1440] le premier jour et [0, 120] le lendemain).
 *
 * Retourne null si le RDV ne touche pas ce jour.
 */
export function computeAppointmentIntervalOnDay(
  scheduledAt: Date,
  durationMinutes: number,
  dayDate: Date,
): TimeInterval | null {
  const endAt = new Date(scheduledAt.getTime() + durationMinutes * 60_000)
  const dayStart = startOfDay(dayDate)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60_000) // minuit exclusif

  if (endAt <= dayStart || scheduledAt >= dayEnd) return null

  const overlapStart = Math.max(scheduledAt.getTime(), dayStart.getTime())
  const overlapEnd = Math.min(endAt.getTime(), dayEnd.getTime())

  return {
    start: Math.round((overlapStart - dayStart.getTime()) / 60_000),
    end: Math.round((overlapEnd - dayStart.getTime()) / 60_000),
  }
}

// ---------------------------------------------------------------------------
// Calcul des créneaux libres pour un jour donné
// ---------------------------------------------------------------------------

type RecurringSlot = { dayOfWeek: number; startTime: string; endTime: string }
type ExceptionEntry = { startTime?: string; endTime?: string }
type AppointmentEntry = { scheduledAt: Date; durationMinutes?: number }

/**
 * Calcule les intervalles libres pour un artisan sur un jour précis.
 *
 * Cas limites gérés :
 * - Aucune plage récurrente pour ce jour → []
 * - Exception journée entière (startTime / endTime absents) → []
 * - RDV chevauchant minuit → traité via computeAppointmentIntervalOnDay
 * - Durée de RDV inconnue → DEFAULT_APPOINTMENT_DURATION_MINUTES (valeur sécurité)
 *
 * Note : les exceptions et appointments passés en paramètre doivent déjà
 * être filtrés pour le jour dayDate par l'appelant.
 */
export function computeFreeIntervals(
  recurringSlots: ReadonlyArray<RecurringSlot>,
  exceptions: ReadonlyArray<ExceptionEntry>,
  appointments: ReadonlyArray<AppointmentEntry>,
  dayDate: Date,
): TimeInterval[] {
  const dow = dayDate.getDay()
  const daySlots = recurringSlots.filter((s) => s.dayOfWeek === dow)
  if (daySlots.length === 0) return []

  // Exception journée entière = startTime ET endTime absents
  const hasFullDayBlock = exceptions.some(
    (e) => e.startTime === undefined && e.endTime === undefined,
  )
  if (hasFullDayBlock) return []

  // Base : convertir les plages récurrentes en intervalles libres
  let freeIntervals: TimeInterval[] = daySlots.map((s) => ({
    start: timeToMinutes(s.startTime),
    end: timeToMinutes(s.endTime),
  }))

  // Soustraire les exceptions partielles (startTime et endTime présents)
  for (const exc of exceptions) {
    if (exc.startTime !== undefined && exc.endTime !== undefined) {
      freeIntervals = subtractInterval(freeIntervals, {
        start: timeToMinutes(exc.startTime),
        end: timeToMinutes(exc.endTime),
      })
    }
  }

  // Soustraire les appointments confirmés
  for (const appt of appointments) {
    const duration = appt.durationMinutes ?? DEFAULT_APPOINTMENT_DURATION_MINUTES
    const interval = computeAppointmentIntervalOnDay(appt.scheduledAt, duration, dayDate)
    if (interval !== null) {
      freeIntervals = subtractInterval(freeIntervals, interval)
    }
  }

  return freeIntervals.filter((i) => i.end > i.start)
}
