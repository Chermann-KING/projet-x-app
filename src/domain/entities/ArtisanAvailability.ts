/**
 * Plage de disponibilité récurrente d'un artisan.
 * Représente un créneau travaillé pour un jour de semaine donné.
 * Un artisan peut avoir plusieurs entrées par jour (ex. matin + après-midi).
 */
export interface ArtisanAvailability {
  id: string
  artisanId: string
  /** 0 = dimanche, 1 = lundi, …, 6 = samedi */
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Format "HH:mm" — ex. "08:00" */
  startTime: string
  /** Format "HH:mm" — ex. "18:00" */
  endTime: string
}

/**
 * Blocage ponctuel d'un artisan sur une date précise.
 * Peut couvrir la journée entière (startTime / endTime absents)
 * ou un créneau partiel.
 */
export interface ArtisanAvailabilityException {
  id: string
  artisanId: string
  /** Format "YYYY-MM-DD" */
  exceptionDate: string
  /** Absent = journée entière bloquée */
  startTime?: string
  /** Absent = journée entière bloquée */
  endTime?: string
  reason?: string
}
