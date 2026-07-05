import type { SupabaseClient } from '@supabase/supabase-js'
import type { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository'
import type { Appointment, AppointmentStatus } from '@/domain/entities/Appointment'
import { NetworkError, NotFoundError } from '@/shared/errors'

export class SupabaseAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Appointment | null> {
    const { data, error } = await this.client
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new NetworkError()
    }
    return data ? this.toAppointment(data) : null
  }

  async findByArtisanId(artisanId: string): Promise<Appointment[]> {
    const { data, error } = await this.client
      .from('appointments')
      .select('*')
      .eq('artisan_id', artisanId)
      .order('scheduled_at', { ascending: true })

    if (error) throw new NetworkError()
    return (data ?? []).map((row) => this.toAppointment(row))
  }

  async findByClientId(clientId: string): Promise<Appointment[]> {
    const { data, error } = await this.client
      .from('appointments')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: true })

    if (error) throw new NetworkError()
    return (data ?? []).map((row) => this.toAppointment(row))
  }

  async create(data: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    const { data: created, error } = await this.client
      .from('appointments')
      .insert({
        quote_id: data.quoteId,
        client_id: data.clientId,
        artisan_id: data.artisanId,
        scheduled_at: data.scheduledAt.toISOString(),
        status: data.status,
      })
      .select()
      .single()

    if (error || !created) throw new NetworkError()
    return this.toAppointment(created)
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<void> {
    const { data, error } = await this.client
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select('id')

    if (error) throw new NetworkError()
    if (!data || data.length === 0) throw new NotFoundError('Appointment', id)
  }

  private toAppointment(row: Record<string, unknown>): Appointment {
    return {
      id: row.id as string,
      quoteId: row.quote_id as string,
      clientId: row.client_id as string,
      artisanId: row.artisan_id as string,
      scheduledAt: new Date(row.scheduled_at as string),
      ...(row.duration_minutes != null
        ? { durationMinutes: row.duration_minutes as number }
        : {}),
      status: row.status as AppointmentStatus,
      createdAt: new Date(row.created_at as string),
    }
  }
}
