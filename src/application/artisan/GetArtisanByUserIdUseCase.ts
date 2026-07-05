import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { Artisan } from '@/domain/entities/Artisan'

export class GetArtisanByUserIdUseCase {
  constructor(private readonly artisanRepository: IArtisanRepository) {}

  async execute(userId: string): Promise<Artisan | null> {
    return this.artisanRepository.findByUserId(userId)
  }
}
