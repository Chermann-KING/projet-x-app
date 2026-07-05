import type { IAuthRepository } from '@/domain/repositories/IAuthRepository'
import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { IStorageRepository } from '@/domain/repositories/IStorageRepository'
import type { Artisan } from '@/domain/entities/Artisan'

export interface UpdateArtisanAvatarInput {
  artisanId: string
  localUri: string
  userId?: string | undefined
}

export class UpdateArtisanAvatarUseCase {
  constructor(
    private readonly artisanRepository: IArtisanRepository,
    private readonly storageRepository: IStorageRepository,
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(input: UpdateArtisanAvatarInput): Promise<Artisan> {
    const { url } = await this.storageRepository.uploadArtisanAvatar(
      input.artisanId,
      input.localUri,
    )
    const updated = await this.artisanRepository.update(input.artisanId, { avatarUrl: url })
    if (input.userId) {
      await this.authRepository.updateAvatarUrl(input.userId, url)
    }
    return updated
  }
}
