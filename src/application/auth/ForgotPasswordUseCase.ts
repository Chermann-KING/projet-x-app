import type { IAuthRepository } from '@/domain/repositories/IAuthRepository'
import { ValidationError } from '@/shared/errors'

export class ForgotPasswordUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(email: string): Promise<void> {
    if (!email.trim()) {
      throw new ValidationError("L'adresse email est requise")
    }
    return this.authRepository.resetPassword(email.trim().toLowerCase())
  }
}
