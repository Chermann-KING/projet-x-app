import type { Metier } from '../../shared/constants/metiers'

export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type SubscriptionPlan = 'free' | 'standard' | 'premium'
export type TarifUnit = 'heure' | 'jour' | 'projet'

export interface ArtisanPhoto {
  id: string
  url: string
  caption?: string
  storagePath?: string
}

export interface Artisan {
  id: string
  userId: string
  fullName: string
  metier: Metier
  competences: string[]
  zoneGeographique: string
  tarifIndicatif?: number
  tarifUnit?: TarifUnit
  bio?: string
  lat?: number
  lng?: number
  avatarUrl?: string
  bannerUrl?: string
  isVerified: boolean
  verificationStatus: VerificationStatus
  averageRating: number
  reviewCount: number
  photos: ArtisanPhoto[]
  subscriptionPlan: SubscriptionPlan
  phone: string
  createdAt: Date
  isOnline?: boolean
}
