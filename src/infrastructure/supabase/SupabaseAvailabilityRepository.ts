import type { SupabaseClient } from '@supabase/supabase-js'
import type { IAvailabilityRepository } from '@/domain/repositories/IAvailabilityRepository'
import type { ArtisanAvailability, ArtisanAvailabilityException } from '@/domain/entities/ArtisanAvailability'
import type { Appointment, AppointmentStatus } from '@/domain/entities/Appointment'
import { NetworkError } from '@/shared/errors'

export class SupabaseAvailabilityRepository implements IAvailabilityRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findSlotsByArtisan(artisanId: string): Promise<ArtisanAvailability[]> {
    const { data, error } = await this.client
      .from('artisan_availability')
      .select('*')
      .eq('artisan_id', artisanId)

    if (error) throw new NetworkError()
    return (data ?? []).map(toSlot)
  }

  async findSlotsByArtisans(artisanIds: string[]): Promise<ArtisanAvailability[]> {
    if (artisanIds.length === 0) return []

    const { data, error } = await this.client
      .from('artisan_availability')
      .select('*')
      .in('artisan_id', artisanIds)

    if (error) throw new NetworkError()
    return (data ?? []).map(toSlot)
  }

  async findExceptionsByArtisan(
    artisanId: string,
    fromDate: string,
    toDate: string,
  ): Promise<ArtisanAvailabilityException[]> {
    const { data, error } = await this.client
      .from('artisan_availability_exceptions')
      .select('*')
      .eq('artisan_id', artisanId)
      .gte('exception_date', fromDate)
      .lte('exception_date', toDate)

    if (error) throw new NetworkError()
    return (data ?? []).map(toException)
  }

  async findExceptionsByArtisans(
    artisanIds: string[],
    fromDate: string,
    toDate: string,
  ): Promise<ArtisanAvailabilityException[]> {
    if (artisanIds.length === 0) return []

    const { data, error } = await this.client
      .from('artisan_availability_exceptions')
      .select('*')
      .in('artisan_id', artisanIds)
      .gte('exception_date', fromDate)
      .lte('exception_date', toDate)

    if (error) throw new NetworkError()
    return (data ?? []).map(toException)
  }

  async findConfirmedAppointmentsByArtisan(
    artisanId: string,
    from: Date,
    to: Date,
  ): Promise<Appointment[]> {
    const { data, error } = await this.client
      .from('appointments')
      .select('*')
      .eq('artisan_id', artisanId)
      .eq('status', 'confirmed')
      .gte('scheduled_at', from.toISOString())
      .lte('scheduled_at', to.toISOString())

    if (error) throw new NetworkError()
    return (data ?? []).map(toAppointment)
  }

  async findConfirmedAppointmentsByArtisans(
    artisanIds: string[],
    from: Date,
    to: Date,
  ): Promise<Appointment[]> {
    if (artisanIds.length === 0) return []

    const { data, error } = await this.client
      .from('appointments')
      .select('*')
      .in('artisan_id', artisanIds)
      .eq('status', 'confirmed')
      .gte('scheduled_at', from.toISOString())
      .lte('scheduled_at', to.toISOString())

    if (error) throw new NetworkError()
    return (data ?? []).map(toAppointment)
  }
}

// ---------------------------------------------------------------------------
// Mappers (top-level pour éviter les problèmes de this-binding)
// ---------------------------------------------------------------------------

function toSlot(row: Record<string, unknown>): ArtisanAvailability {
  return {
    id: row.id as string,
    artisanId: row.artisan_id as string,
    dayOfWeek: row.day_of_week as ArtisanAvailability['dayOfWeek'],
    startTime: row.start_time as string,
    endTime: row.end_time as string,
  }
}

function toException(row: Record<string, unknown>): ArtisanAvailabilityException {
  return {
    id: row.id as string,
    artisanId: row.artisan_id as string,
    exceptionDate: row.exception_date as string,
    ...(row.start_time != null ? { startTime: row.start_time as string } : {}),
    ...(row.end_time != null ? { endTime: row.end_time as string } : {}),
    ...(row.reason != null ? { reason: row.reason as string } : {}),
  }
}

function toAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    quoteId: row.quote_id as string,
    clientId: row.client_id as string,
    artisanId: row.artisan_id as string,
    scheduledAt: new Date(row.scheduled_at as string),
    ...(row.duration_minutes != null ? { durationMinutes: row.duration_minutes as number } : {}),
    status: row.status as AppointmentStatus,
    createdAt: new Date(row.created_at as string),
  }
}
