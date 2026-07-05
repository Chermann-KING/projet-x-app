import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import { NotFoundError } from '@/shared/errors'

export class SuspendArtisanUseCase {
  constructor(private readonly artisanRepository: IArtisanRepository) {}

  async execute(artisanId: string): Promise<void> {
    const artisan = await this.artisanRepository.findById(artisanId)
    if (!artisan) throw new NotFoundError('Artisan', artisanId)
    await this.artisanRepository.updateVerificationStatus(artisanId, 'rejected')
  }
}
