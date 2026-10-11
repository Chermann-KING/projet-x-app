import type { SupabaseClient } from '@supabase/supabase-js'
import type { IReviewRepository } from '@/domain/repositories/IReviewRepository'
import type { Review } from '@/domain/entities/Review'
import { NetworkError } from '@/shared/errors'
import { mapReviewRow, type ReviewRow } from './mappers/ReviewRowMapper'

export class SupabaseReviewRepository implements IReviewRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByClientId(clientId: string): Promise<Review[]> {
    const { data, error } = await this.client
      .from('reviews')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .overrideTypes<ReviewRow[], { merge: false }>()

    if (error) throw new NetworkError()
    return (data ?? []).map(mapReviewRow)
  }

  async findByArtisanId(artisanId: string): Promise<Review[]> {
    const { data, error } = await this.client
      .from('reviews')
      .select('*')
      .eq('artisan_id', artisanId)
      .order('created_at', { ascending: false })
      .overrideTypes<ReviewRow[], { merge: false }>()

    if (error) throw new NetworkError()
    return (data ?? []).map(mapReviewRow)
  }

  async findByAppointmentId(appointmentId: string): Promise<Review | null> {
    const { data, error } = await this.client
      .from('reviews')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single<ReviewRow>()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new NetworkError()
    }
    return data ? mapReviewRow(data) : null
  }

  async create(data: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const { data: created, error } = await this.client
      .from('reviews')
      .insert({
        appointment_id: data.appointmentId,
        client_id: data.clientId,
        artisan_id: data.artisanId,
        rating: data.rating,
        comment: data.comment ?? null,
      })
      .select()
      .single<ReviewRow>()

    if (error || !created) throw new NetworkError()
    return mapReviewRow(created)
  }
}
