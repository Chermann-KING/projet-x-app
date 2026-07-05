import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { IStorageRepository } from '@/domain/repositories/IStorageRepository'

export interface DeleteArtisanPhotoInput {
  artisanId: string
  photoId: string
  storagePath?: string
}

export class DeleteArtisanPhotoUseCase {
  constructor(
    private readonly artisanRepository: IArtisanRepository,
    private readonly storageRepository: IStorageRepository,
  ) {}

  async execute(input: DeleteArtisanPhotoInput): Promise<void> {
    await this.artisanRepository.deletePhoto(input.artisanId, input.photoId)

    if (input.storagePath) {
      await this.storageRepository.deleteArtisanPhoto(input.storagePath)
    }
  }
}
