import type { IAvailabilityRepository } from '@/domain/repositories/IAvailabilityRepository'
import {
  type AvailabilitySlot,
  addDays,
  computeAppointmentIntervalOnDay,
  computeFreeIntervals,
  minutesToTime,
  startOfDay,
  timeToMinutes,
  toDateString,
} from '@/domain/availability/availabilityUtils'
import { DEFAULT_APPOINTMENT_DURATION_MINUTES } from '@/domain/entities/Appointment'

/** Nombre de jours maximum scrutés par getNextAvailableSlots. */
const SLOT_SEARCH_WINDOW_DAYS = 90

export class CheckAvailabilityUseCase {
  constructor(private readonly repo: IAvailabilityRepository) {}

  /**
   * Vérifie si un artisan est disponible pour un créneau précis.
   *
   * @param requestedAt  Date/heure de début souhaitée (heure locale).
   * @param durationMinutes  Durée de la prestation en minutes.
   */
  async isArtisanAvailable(
    artisanId: string,
    requestedAt: Date,
    durationMinutes: number,
  ): Promise<boolean> {
    const dayDate = startOfDay(requestedAt)
    const dateStr = toDateString(dayDate)

    // +/- 1 jour pour capturer les RDV qui chevauchent minuit
    const [slots, exceptions, appointments] = await Promise.all([
      this.repo.findSlotsByArtisan(artisanId),
      this.repo.findExceptionsByArtisan(artisanId, dateStr, dateStr),
      this.repo.findConfirmedAppointmentsByArtisan(
        artisanId,
        addDays(dayDate, -1),
        addDays(dayDate, 1),
      ),
    ])

    const dayAppointments = appointments.filter((a) => {
      const duration = a.durationMinutes ?? DEFAULT_APPOINTMENT_DURATION_MINUTES
      return computeAppointmentIntervalOnDay(a.scheduledAt, duration, dayDate) !== null
    })

    const freeIntervals = computeFreeIntervals(slots, exceptions, dayAppointments, dayDate)

    const reqStart = timeToMinutes(
      `${String(requestedAt.getHours()).padStart(2, '0')}:${String(requestedAt.getMinutes()).padStart(2, '0')}`,
    )
    const reqEnd = reqStart + durationMinutes

    return freeIntervals.some((i) => i.start <= reqStart && i.end >= reqEnd)
  }

  /**
   * Retourne les prochains créneaux libres d'un artisan.
   *
   * @param fromDate               Premier jour à considérer (heure locale).
   * @param count                  Nombre de créneaux souhaités.
   * @param minSlotDurationMinutes Durée minimum d'un créneau retourné (défaut 60 min).
   */
  async getNextAvailableSlots(
    artisanId: string,
    fromDate: Date,
    count: number,
    minSlotDurationMinutes = 60,
  ): Promise<AvailabilitySlot[]> {
    const windowEnd = addDays(fromDate, SLOT_SEARCH_WINDOW_DAYS)

    const [slots, exceptions, appointments] = await Promise.all([
      this.repo.findSlotsByArtisan(artisanId),
      this.repo.findExceptionsByArtisan(
        artisanId,
        toDateString(fromDate),
        toDateString(windowEnd),
      ),
      this.repo.findConfirmedAppointmentsByArtisan(
        artisanId,
        addDays(fromDate, -1),
        addDays(windowEnd, 1),
      ),
    ])

    const result: AvailabilitySlot[] = []
    let currentDate = startOfDay(fromDate)

    for (let day = 0; day < SLOT_SEARCH_WINDOW_DAYS && result.length < count; day++) {
      const dateStr = toDateString(currentDate)

      const dayExceptions = exceptions.filter((e) => e.exceptionDate === dateStr)
      const dayAppointments = appointments.filter((a) => {
        const duration = a.durationMinutes ?? DEFAULT_APPOINTMENT_DURATION_MINUTES
        return computeAppointmentIntervalOnDay(a.scheduledAt, duration, currentDate) !== null
      })

      const freeIntervals = computeFreeIntervals(slots, dayExceptions, dayAppointments, currentDate)

      for (const interval of freeIntervals) {
        if (interval.end - interval.start >= minSlotDurationMinutes) {
          result.push({ date: dateStr, start: minutesToTime(interval.start), end: minutesToTime(interval.end) })
          if (result.length >= count) break
        }
      }

      currentDate = addDays(currentDate, 1)
    }

    return result
  }

  /**
   * Filtre une liste d'artisans et retourne les IDs de ceux qui ont
   * au moins un créneau libre dans la fenêtre [fromDate, fromDate + windowDays].
   *
   * Un seul appel réseau par type de donnée (batch) quelle que soit
   * la taille de artisanIds.
   *
   * @param minSlotDurationMinutes Durée minimum du créneau libre (défaut 60 min).
   */
  async getAvailableArtisanIds(
    artisanIds: string[],
    fromDate: Date,
    windowDays: number,
    minSlotDurationMinutes = 60,
  ): Promise<string[]> {
    if (artisanIds.length === 0) return []

    const toDate = addDays(fromDate, windowDays)

    const [allSlots, allExceptions, allAppointments] = await Promise.all([
      this.repo.findSlotsByArtisans(artisanIds),
      this.repo.findExceptionsByArtisans(
        artisanIds,
        toDateString(fromDate),
        toDateString(toDate),
      ),
      this.repo.findConfirmedAppointmentsByArtisans(
        artisanIds,
        addDays(fromDate, -1),
        addDays(toDate, 1),
      ),
    ])

    const available: string[] = []

    for (const artisanId of artisanIds) {
      const slots = allSlots.filter((s) => s.artisanId === artisanId)
      if (slots.length === 0) continue // aucune plage définie → indisponible

      const exceptions = allExceptions.filter((e) => e.artisanId === artisanId)
      const appointments = allAppointments.filter((a) => a.artisanId === artisanId)

      let hasSlot = false
      let currentDate = startOfDay(fromDate)

      for (let day = 0; day <= windowDays && !hasSlot; day++) {
        const dateStr = toDateString(currentDate)

        const dayExceptions = exceptions.filter((e) => e.exceptionDate === dateStr)
        const dayAppointments = appointments.filter((a) => {
          const duration = a.durationMinutes ?? DEFAULT_APPOINTMENT_DURATION_MINUTES
          return computeAppointmentIntervalOnDay(a.scheduledAt, duration, currentDate) !== null
        })

        const freeIntervals = computeFreeIntervals(slots, dayExceptions, dayAppointments, currentDate)
        hasSlot = freeIntervals.some((i) => i.end - i.start >= minSlotDurationMinutes)

        currentDate = addDays(currentDate, 1)
      }

      if (hasSlot) available.push(artisanId)
    }

    return available
  }
}
