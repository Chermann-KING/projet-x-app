import type { SupabaseClient } from '@supabase/supabase-js'
import type { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository'
import type { Appointment, AppointmentStatus } from '@/domain/entities/Appointment'
import { NetworkError, NotFoundError } from '@/shared/errors'
import { mapAppointmentRow, type AppointmentRow } from './mappers/AppointmentRowMapper'

export class SupabaseAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Appointment | null> {
    const { data, error } = await this.client
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single<AppointmentRow>()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new NetworkError()
    }
    return data ? mapAppointmentRow(data) : null
  }

  async findByArtisanId(artisanId: string): Promise<Appointment[]> {
    const { data, error } = await this.client
      .from('appointments')
      .select('*')
      .eq('artisan_id', artisanId)
      .order('scheduled_at', { ascending: true })
      .overrideTypes<AppointmentRow[], { merge: false }>()

    if (error) throw new NetworkError()
    return (data ?? []).map(mapAppointmentRow)
  }

  async findByClientId(clientId: string): Promise<Appointment[]> {
    const { data, error } = await this.client
      .from('appointments')
      .select('*')
      .eq('client_id', clientId)
      .order('scheduled_at', { ascending: true })
      .overrideTypes<AppointmentRow[], { merge: false }>()

    if (error) throw new NetworkError()
    return (data ?? []).map(mapAppointmentRow)
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
      .single<AppointmentRow>()

    if (error || !created) throw new NetworkError()
    return mapAppointmentRow(created)
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
}
