import type { IAuthRepository, SignUpData } from '@/domain/repositories/IAuthRepository'
import type { User } from '@/domain/entities/User'
import { ValidationError } from '@/shared/errors'
import { sanitizeText } from '@/shared/utils/sanitize'

export class RegisterUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(data: SignUpData): Promise<User> {
    if (!data.fullName.trim()) {
      throw new ValidationError('Le nom complet est requis')
    }
    if (!data.email.trim()) {
      throw new ValidationError("L'adresse email est requise")
    }
    if (data.password.length < 8) {
      throw new ValidationError('Le mot de passe doit contenir au moins 8 caractères')
    }

    return this.authRepository.signUp({
      ...data,
      email: data.email.trim().toLowerCase(),
      fullName: sanitizeText(data.fullName, 100),
    })
  }
}
