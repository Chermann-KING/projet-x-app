import type { IAuthRepository } from '@/domain/repositories/IAuthRepository'
import type { User } from '@/domain/entities/User'
import { ValidationError } from '@/shared/errors'

export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(email: string, password: string): Promise<User> {
    if (!email.trim() || !password.trim()) {
      throw new ValidationError('Email et mot de passe requis')
    }
    return this.authRepository.signIn(email.trim(), password)
  }
}
