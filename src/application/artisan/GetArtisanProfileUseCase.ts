import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { Artisan } from '@/domain/entities/Artisan'
import { NotFoundError } from '@/shared/errors'

export class GetArtisanProfileUseCase {
  constructor(private readonly artisanRepository: IArtisanRepository) {}

  async execute(id: string): Promise<Artisan> {
    const artisan = await this.artisanRepository.findById(id)
    if (!artisan) throw new NotFoundError('Artisan', id)
    return artisan
  }
}
