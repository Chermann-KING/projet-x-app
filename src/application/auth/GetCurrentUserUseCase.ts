import type { IAuthRepository } from '@/domain/repositories/IAuthRepository'
import type { User } from '@/domain/entities/User'

export class GetCurrentUserUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<User | null> {
    return this.authRepository.getCurrentUser()
  }
}
