import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { Artisan } from '@/domain/entities/Artisan'

export class GetActiveArtisansUseCase {
  constructor(private readonly artisanRepository: IArtisanRepository) {}

  async execute(): Promise<Artisan[]> {
    const all = await this.artisanRepository.findAll()
    return all.filter((a) => a.verificationStatus === 'approved')
  }
}
