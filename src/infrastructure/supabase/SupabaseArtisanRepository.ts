import type { SupabaseClient } from '@supabase/supabase-js'
import type { IArtisanRepository, ArtisanSearchFilters } from '@/domain/repositories/IArtisanRepository'
import type { Artisan, ArtisanPhoto, TarifUnit, VerificationStatus } from '@/domain/entities/Artisan'
import { NotFoundError } from '@/shared/errors'

export class SupabaseArtisanRepository implements IArtisanRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Artisan | null> {
    const { data, error } = await this.client
      .from('artisan_profiles')
      .select('*, artisan_photos(*)')
      .eq('id', id)
      .single()

    if (error) return null
    return this.mapToEntity(data)
  }

  async findByIds(ids: string[]): Promise<Artisan[]> {
    if (ids.length === 0) return []
    const { data, error } = await this.client
      .from('artisan_profiles')
      .select('*, artisan_photos(*)')
      .in('id', ids)
    if (error) throw error
    return (data ?? []).map((row) => this.mapToEntity(row))
  }

  async findByUserId(userId: string): Promise<Artisan | null> {
    const { data, error } = await this.client
      .from('artisan_profiles')
      .select('*, artisan_photos(*)')
      .eq('user_id', userId)
      .single()

    if (error) return null
    return this.mapToEntity(data)
  }

  async search(filters: ArtisanSearchFilters): Promise<Artisan[]> {
    let query = this.client
      .from('artisan_profiles')
      .select('*, artisan_photos(*)')
      .eq('verification_status', 'approved')

    if (filters.metier) query = query.eq('metier', filters.metier)
    if (filters.minRating) query = query.gte('average_rating', filters.minRating)

    const { data, error } = await query.limit(50)

    if (error) throw error
    return (data ?? []).map(this.mapToEntity)
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
      .single()

    if (error) throw error
    return this.mapToEntity(created)
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
      .single()

    if (error) throw new NotFoundError('Artisan', id)
    return this.mapToEntity(updated)
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

    if (error) throw error
    return (data ?? []).map(this.mapToEntity)
  }

  async findAll(): Promise<Artisan[]> {
    const { data, error } = await this.client
      .from('artisan_profiles')
      .select('*, artisan_photos(*)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return (data ?? []).map(this.mapToEntity)
  }

  async addPhoto(artisanId: string, url: string, storagePath: string): Promise<ArtisanPhoto> {
    const { data, error } = await this.client
      .from('artisan_photos')
      .insert({ artisan_id: artisanId, url, storage_path: storagePath })
      .select()
      .single()

    if (error) throw error
    return {
      id: data.id as string,
      url: data.url as string,
      ...(data.caption != null ? { caption: data.caption as string } : {}),
      storagePath: data.storage_path as string,
    }
  }

  async deletePhoto(artisanId: string, photoId: string): Promise<void> {
    const { error } = await this.client
      .from('artisan_photos')
      .delete()
      .eq('id', photoId)
      .eq('artisan_id', artisanId)

    if (error) throw error
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToEntity(row: any): Artisan {
    const lastSeenAt: string | null = row.profiles?.last_seen_at ?? null
    const isOnline = lastSeenAt != null
      ? Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000
      : false

    return {
      id: row.id as string,
      userId: row.user_id as string,
      fullName: row.full_name as string,
      metier: row.metier,
      competences: (row.competences ?? []) as string[],
      zoneGeographique: row.zone_geographique as string,
      ...(row.tarif_indicatif != null ? { tarifIndicatif: row.tarif_indicatif as number } : {}),
      ...(row.tarif_unit != null ? { tarifUnit: row.tarif_unit as TarifUnit } : {}),
      ...(row.bio != null ? { bio: row.bio as string } : {}),
      ...(row.lat != null ? { lat: row.lat as number } : {}),
      ...(row.lng != null ? { lng: row.lng as number } : {}),
      ...(row.avatar_url != null ? { avatarUrl: row.avatar_url as string } : {}),
      ...(row.banner_url != null ? { bannerUrl: row.banner_url as string } : {}),
      isVerified: row.is_verified as boolean,
      verificationStatus: row.verification_status,
      averageRating: (row.average_rating ?? 0) as number,
      reviewCount: (row.review_count ?? 0) as number,
      photos: (row.artisan_photos ?? []).map((p: Record<string, unknown>) => ({
        id: p.id,
        url: p.url,
        ...(p.caption != null ? { caption: p.caption as string } : {}),
        ...(p.storage_path != null ? { storagePath: p.storage_path as string } : {}),
      })),
      subscriptionPlan: row.subscription_plan,
      phone: row.phone as string,
      createdAt: new Date(row.created_at as string),
      isOnline,
    }
  }
}
