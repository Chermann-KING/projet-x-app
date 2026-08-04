import type { IAuthRepository } from '@/domain/repositories/IAuthRepository'
import { ValidationError } from '@/shared/errors'

export class EstablishRecoverySessionUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(accessToken: string, refreshToken: string): Promise<void> {
    if (!accessToken || !refreshToken) {
      throw new ValidationError('Lien de récupération invalide')
    }
    return this.authRepository.establishRecoverySession(accessToken, refreshToken)
  }
}
