import type { Artisan, ArtisanPhoto, TarifUnit } from '@/domain/entities/Artisan'

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

export interface ArtisanPhotoRow {
  id: string
  url: string
  caption?: string | null
  storage_path?: string | null
}

export interface ArtisanRow {
  id: string
  user_id: string
  full_name: string
  metier: Artisan['metier']
  competences: string[] | null
  zone_geographique: string
  tarif_indicatif?: number | null
  tarif_unit?: TarifUnit | null
  bio?: string | null
  lat?: number | null
  lng?: number | null
  avatar_url?: string | null
  banner_url?: string | null
  is_verified: boolean
  verification_status: Artisan['verificationStatus']
  average_rating: number | null
  review_count: number | null
  artisan_photos?: ArtisanPhotoRow[] | null
  subscription_plan: Artisan['subscriptionPlan']
  phone: string
  created_at: string
  profiles?: { last_seen_at?: string | null } | null
}

export function mapArtisanPhotoRow(photo: ArtisanPhotoRow): ArtisanPhoto {
  return {
    id: photo.id,
    url: photo.url,
    ...(photo.caption != null ? { caption: photo.caption } : {}),
    ...(photo.storage_path != null ? { storagePath: photo.storage_path } : {}),
  }
}

function isRecentlySeen(lastSeenAt: string | null | undefined): boolean {
  if (lastSeenAt == null) return false
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS
}

export function mapArtisanRow(row: ArtisanRow): Artisan {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    metier: row.metier,
    competences: row.competences ?? [],
    zoneGeographique: row.zone_geographique,
    ...(row.tarif_indicatif != null ? { tarifIndicatif: row.tarif_indicatif } : {}),
    ...(row.tarif_unit != null ? { tarifUnit: row.tarif_unit } : {}),
    ...(row.bio != null ? { bio: row.bio } : {}),
    ...(row.lat != null ? { lat: row.lat } : {}),
    ...(row.lng != null ? { lng: row.lng } : {}),
    ...(row.avatar_url != null ? { avatarUrl: row.avatar_url } : {}),
    ...(row.banner_url != null ? { bannerUrl: row.banner_url } : {}),
    isVerified: row.is_verified,
    verificationStatus: row.verification_status,
    averageRating: row.average_rating ?? 0,
    reviewCount: row.review_count ?? 0,
    photos: (row.artisan_photos ?? []).map(mapArtisanPhotoRow),
    subscriptionPlan: row.subscription_plan,
    phone: row.phone,
    createdAt: new Date(row.created_at),
    isOnline: isRecentlySeen(row.profiles?.last_seen_at),
  }
}
