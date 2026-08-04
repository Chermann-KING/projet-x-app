import type { IAuthRepository } from '@/domain/repositories/IAuthRepository'
import { ValidationError } from '@/shared/errors'

export class UpdatePasswordUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(newPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new ValidationError('Le mot de passe doit contenir au moins 8 caractères')
    }
    return this.authRepository.updatePassword(newPassword)
  }
}
