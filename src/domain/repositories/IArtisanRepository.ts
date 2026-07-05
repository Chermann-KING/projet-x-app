import type { Artisan, ArtisanPhoto, VerificationStatus } from '../entities/Artisan'
import type { Metier } from '../../shared/constants/metiers'

export interface ArtisanSearchFilters {
  metier?: Metier
  query?: string
  lat?: number
  lng?: number
  radiusKm?: number
  minRating?: number
  /** userId à exclure des résultats (ex: un artisan en mode client ne se voit pas) */
  excludeUserId?: string
}

export interface IArtisanRepository {
  findById(id: string): Promise<Artisan | null>
  findByIds(ids: string[]): Promise<Artisan[]>
  findByUserId(userId: string): Promise<Artisan | null>
  search(filters: ArtisanSearchFilters): Promise<Artisan[]>
  create(data: Omit<Artisan, 'id' | 'createdAt' | 'averageRating' | 'reviewCount' | 'photos'>): Promise<Artisan>
  update(id: string, data: Partial<Artisan>): Promise<Artisan>
  updateVerificationStatus(id: string, status: VerificationStatus): Promise<void>
  findPendingVerification(): Promise<Artisan[]>
  findAll(): Promise<Artisan[]>
  addPhoto(artisanId: string, url: string, storagePath: string): Promise<ArtisanPhoto>
  deletePhoto(artisanId: string, photoId: string): Promise<void>
}
