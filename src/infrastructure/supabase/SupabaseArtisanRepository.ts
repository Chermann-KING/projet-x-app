import type { SupabaseClient } from '@supabase/supabase-js'
import type { IArtisanRepository, ArtisanSearchFilters } from '@/domain/repositories/IArtisanRepository'
import type { Artisan, ArtisanPhoto, VerificationStatus } from '@/domain/entities/Artisan'
import { NotFoundError } from '@/shared/errors'
import {
  mapArtisanPhotoRow,
  mapArtisanRow,
  type ArtisanPhotoRow,
  type ArtisanRow,
} from './mappers/ArtisanRowMapper'

export class SupabaseArtisanRepository implements IArtisanRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Artisan | null> {
    const { data, error } = await this.client
      .from('artisan_profiles')
      .select('*, artisan_photos(*)')
      .eq('id', id)
      .single<ArtisanRow>()

    if (error) return null
    return mapArtisanRow(data)
  }

  async findByIds(ids: string[]): Promise<Artisan[]> {
    if (ids.length === 0) return []
    const { data, error } = await this.client
      .from('artisan_profiles')
      .select('*, artisan_photos(*)')
      .in('id', ids)
      .overrideTypes<ArtisanRow[], { merge: false }>()
    if (error) throw error
    return (data ?? []).map(mapArtisanRow)
  }

  async findByUserId(userId: string): Promise<Artisan | null> {
    const { data, error } = await this.client
      .from('artisan_profiles')
      .select('*, artisan_photos(*)')
      .eq('user_id', userId)
      .single<ArtisanRow>()

    if (error) return null
    return mapArtisanRow(data)
  }

  async search(filters: ArtisanSearchFilters): Promise<Artisan[]> {
    let query = this.client
      .from('artisan_profiles')
      .select('*, artisan_photos(*)')
      .eq('verification_status', 'approved')

    if (filters.metier) query = query.eq('metier', filters.metier)
    if (filters.minRating) query = query.gte('average_rating', filters.minRating)

    const { data, error } = await query.limit(50)
      .overrideTypes<ArtisanRow[], { merge: false }>()

    if (error) throw error
    return (data ?? []).map(mapArtisanRow)
  }

  async create(
    data: Omit<Artisan, 'id' | 'createdAt' | 'averageRating' | 'reviewCount' | 'photos'>,
  ): Promise<Artisan> {
    const { data: created, error } = await this.client
      .from('artisan_profiles')
      .insert({
        user_id: data.userId,
        full_name: data.fullName,
        metier: data.metier,
        competences: data.competences,
        zone_geographique: data.zoneGeographique,
        tarif_indicatif: data.tarifIndicatif,
        tarif_unit: data.tarifUnit,
        bio: data.bio,
        lat: data.lat,
        lng: data.lng,
        phone: data.phone,
        subscription_plan: data.subscriptionPlan,
        verification_status: 'pending',
        is_verified: false,
      })
      .select('*, artisan_photos(*)')
      .single<ArtisanRow>()

    if (error) throw error
    return mapArtisanRow(created)
  }

  async update(id: string, data: Partial<Artisan>): Promise<Artisan> {
    const { data: updated, error } = await this.client
      .from('artisan_profiles')
      .update({
        ...(data.fullName !== undefined && { full_name: data.fullName }),
        ...(data.metier !== undefined && { metier: data.metier }),
        ...(data.competences !== undefined && { competences: data.competences }),
        ...(data.zoneGeographique !== undefined && { zone_geographique: data.zoneGeographique }),
        ...(data.tarifIndicatif !== undefined && { tarif_indicatif: data.tarifIndicatif }),
        ...(data.tarifUnit !== undefined && { tarif_unit: data.tarifUnit }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.lat !== undefined && { lat: data.lat }),
        ...(data.lng !== undefined && { lng: data.lng }),
        ...(data.avatarUrl !== undefined && { avatar_url: data.avatarUrl }),
        ...(data.bannerUrl !== undefined && { banner_url: data.bannerUrl }),
      })
      .eq('id', id)
      .select('*, artisan_photos(*)')
      .single<ArtisanRow>()

    if (error) throw new NotFoundError('Artisan', id)
    return mapArtisanRow(updated)
  }

  async updateVerificationStatus(id: string, status: VerificationStatus): Promise<void> {
    const { error } = await this.client
      .from('artisan_profiles')
      .update({
        verification_status: status,
        is_verified: status === 'approved',
      })
      .eq('id', id)

    if (error) throw error
  }

  async findPendingVerification(): Promise<Artisan[]> {
    const { data, error } = await this.client
      .from('artisan_profiles')
      .select('*, artisan_photos(*)')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)
      .overrideTypes<ArtisanRow[], { merge: false }>()

    if (error) throw error
    return (data ?? []).map(mapArtisanRow)
  }

  async findAll(): Promise<Artisan[]> {
    const { data, error } = await this.client
      .from('artisan_profiles')
      .select('*, artisan_photos(*)')
      .order('created_at', { ascending: false })
      .limit(100)
      .overrideTypes<ArtisanRow[], { merge: false }>()

    if (error) throw error
    return (data ?? []).map(mapArtisanRow)
  }

  async addPhoto(artisanId: string, url: string, storagePath: string): Promise<ArtisanPhoto> {
    const { data, error } = await this.client
      .from('artisan_photos')
      .insert({ artisan_id: artisanId, url, storage_path: storagePath })
      .select()
      .single<ArtisanPhotoRow>()

    if (error) throw error
    return mapArtisanPhotoRow(data)
  }

  async deletePhoto(artisanId: string, photoId: string): Promise<void> {
    const { error } = await this.client
      .from('artisan_photos')
      .delete()
      .eq('id', photoId)
      .eq('artisan_id', artisanId)

    if (error) throw error
  }
}
