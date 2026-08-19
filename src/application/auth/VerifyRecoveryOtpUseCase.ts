import type { IAuthRepository } from '@/domain/repositories/IAuthRepository'
import { ValidationError } from '@/shared/errors'

export class VerifyRecoveryOtpUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(tokenHash: string): Promise<void> {
    if (!tokenHash) {
      throw new ValidationError('Lien de récupération invalide')
    }
    return this.authRepository.verifyRecoveryOtp(tokenHash)
  }
}
