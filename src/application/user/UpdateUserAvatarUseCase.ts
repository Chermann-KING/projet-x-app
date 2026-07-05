import type { IAuthRepository } from '@/domain/repositories/IAuthRepository'
import type { IStorageRepository } from '@/domain/repositories/IStorageRepository'

export interface UpdateUserAvatarInput {
  userId: string
  localUri: string
}

export class UpdateUserAvatarUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly storageRepository: IStorageRepository,
  ) {}

  async execute(input: UpdateUserAvatarInput): Promise<string> {
    const { url } = await this.storageRepository.uploadUserAvatar(input.userId, input.localUri)
    await this.authRepository.updateAvatarUrl(input.userId, url)
    return url
  }
}
