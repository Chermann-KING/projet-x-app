export type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed'

export interface Appointment {
  id: string
  quoteId: string
  clientId: string
  artisanId: string
  scheduledAt: Date
  /**
   * Durée estimée en minutes.
   * Undefined sur les anciens enregistrements — le calcul de disponibilité
   * utilise DEFAULT_APPOINTMENT_DURATION_MINUTES comme valeur de sécurité.
   */
  durationMinutes?: number
  status: AppointmentStatus
  createdAt: Date
}

/** Durée par défaut utilisée quand duration_minutes est absent en base. */
export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 120
