import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { IStorageRepository } from '@/domain/repositories/IStorageRepository'
import type { Artisan } from '@/domain/entities/Artisan'

export interface UpdateArtisanBannerInput {
  artisanId: string
  localUri: string
}

export class UpdateArtisanBannerUseCase {
  constructor(
    private readonly artisanRepository: IArtisanRepository,
    private readonly storageRepository: IStorageRepository,
  ) {}

  async execute(input: UpdateArtisanBannerInput): Promise<Artisan> {
    const { url } = await this.storageRepository.uploadArtisanBanner(
      input.artisanId,
      input.localUri,
    )
    return this.artisanRepository.update(input.artisanId, { bannerUrl: url })
  }
}
