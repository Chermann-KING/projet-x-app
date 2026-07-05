import type { SupabaseClient } from '@supabase/supabase-js'
import type { IReviewRepository } from '@/domain/repositories/IReviewRepository'
import type { Review, Rating } from '@/domain/entities/Review'
import { NetworkError } from '@/shared/errors'

export class SupabaseReviewRepository implements IReviewRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByClientId(clientId: string): Promise<Review[]> {
    const { data, error } = await this.client
      .from('reviews')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw new NetworkError()
    return (data ?? []).map((row) => this.toReview(row))
  }

  async findByArtisanId(artisanId: string): Promise<Review[]> {
    const { data, error } = await this.client
      .from('reviews')
      .select('*')
      .eq('artisan_id', artisanId)
      .order('created_at', { ascending: false })

    if (error) throw new NetworkError()
    return (data ?? []).map((row) => this.toReview(row))
  }

  async findByAppointmentId(appointmentId: string): Promise<Review | null> {
    const { data, error } = await this.client
      .from('reviews')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new NetworkError()
    }
    return data ? this.toReview(data) : null
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
      .single()

    if (error || !created) throw new NetworkError()
    return this.toReview(created)
  }

  private toReview(row: Record<string, unknown>): Review {
    return {
      id: row.id as string,
      appointmentId: row.appointment_id as string,
      clientId: row.client_id as string,
      artisanId: row.artisan_id as string,
      rating: row.rating as Rating,
      ...(row.comment !== null && row.comment !== undefined ? { comment: row.comment as string } : {}),
      createdAt: new Date(row.created_at as string),
    }
  }
}
