import type { ArtisanAvailability, ArtisanAvailabilityException } from '@/domain/entities/ArtisanAvailability'
import type { Appointment } from '@/domain/entities/Appointment'

export interface IAvailabilityRepository {
  /** Plages récurrentes d'un artisan. */
  findSlotsByArtisan(artisanId: string): Promise<ArtisanAvailability[]>

  /**
   * Plages récurrentes pour plusieurs artisans en un seul appel réseau.
   * Retourne [] si artisanIds est vide.
   */
  findSlotsByArtisans(artisanIds: string[]): Promise<ArtisanAvailability[]>

  /** Exceptions ponctuelles d'un artisan dans [fromDate, toDate] (YYYY-MM-DD inclusifs). */
  findExceptionsByArtisan(
    artisanId: string,
    fromDate: string,
    toDate: string,
  ): Promise<ArtisanAvailabilityException[]>

  /**
   * Idem pour plusieurs artisans (batch).
   * Retourne [] si artisanIds est vide.
   */
  findExceptionsByArtisans(
    artisanIds: string[],
    fromDate: string,
    toDate: string,
  ): Promise<ArtisanAvailabilityException[]>

  /** Appointments au statut "confirmed" d'un artisan dans la plage datetime [from, to]. */
  findConfirmedAppointmentsByArtisan(
    artisanId: string,
    from: Date,
    to: Date,
  ): Promise<Appointment[]>

  /**
   * Idem pour plusieurs artisans (batch).
   * Retourne [] si artisanIds est vide.
   */
  findConfirmedAppointmentsByArtisans(
    artisanIds: string[],
    from: Date,
    to: Date,
  ): Promise<Appointment[]>
}
