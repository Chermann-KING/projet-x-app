import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { Artisan, TarifUnit } from '@/domain/entities/Artisan'
import type { Metier } from '@/shared/constants/metiers'

export interface CreateArtisanProfileInput {
  userId: string
  fullName: string
  phone: string
  metier: Metier
  competences: string[]
  zoneGeographique: string
  tarifIndicatif?: number
  tarifUnit?: TarifUnit
  lat?: number
  lng?: number
}

export class CreateArtisanProfileUseCase {
  constructor(private readonly artisanRepository: IArtisanRepository) {}

  async execute(input: CreateArtisanProfileInput): Promise<Artisan> {
    return this.artisanRepository.create({
      userId: input.userId,
      fullName: input.fullName,
      phone: input.phone,
      metier: input.metier,
      competences: input.competences,
      zoneGeographique: input.zoneGeographique,
      isVerified: false,
      verificationStatus: 'pending',
      subscriptionPlan: 'free',
      ...(input.tarifUnit !== undefined ? { tarifUnit: input.tarifUnit } : {}),
      ...(input.tarifIndicatif !== undefined ? { tarifIndicatif: input.tarifIndicatif } : {}),
      ...(input.lat !== undefined ? { lat: input.lat } : {}),
      ...(input.lng !== undefined ? { lng: input.lng } : {}),
    })
  }
}
