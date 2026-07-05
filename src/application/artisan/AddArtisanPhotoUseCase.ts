import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { IStorageRepository } from '@/domain/repositories/IStorageRepository'
import type { ArtisanPhoto } from '@/domain/entities/Artisan'

export interface AddArtisanPhotoInput {
  artisanId: string
  localUri: string
}

export class AddArtisanPhotoUseCase {
  constructor(
    private readonly artisanRepository: IArtisanRepository,
    private readonly storageRepository: IStorageRepository,
  ) {}

  async execute(input: AddArtisanPhotoInput): Promise<ArtisanPhoto> {
    const { url, path } = await this.storageRepository.uploadArtisanPhoto(
      input.artisanId,
      input.localUri,
    )
    return this.artisanRepository.addPhoto(input.artisanId, url, path)
  }
}
