import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { Artisan } from '@/domain/entities/Artisan'

export class GetPendingArtisansUseCase {
  constructor(private readonly artisanRepository: IArtisanRepository) {}

  execute(): Promise<Artisan[]> {
    return this.artisanRepository.findPendingVerification()
  }
}
