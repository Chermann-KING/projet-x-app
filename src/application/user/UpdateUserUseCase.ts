import type { IUserRepository } from '@/domain/repositories/IUserRepository'
import type { User } from '@/domain/entities/User'
import { sanitizeText } from '@/shared/utils/sanitize'

export interface UpdateUserData {
  fullName?: string
  phone?: string
}

export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string, data: UpdateUserData): Promise<User> {
    const sanitized: UpdateUserData = {
      ...(data.fullName !== undefined ? { fullName: sanitizeText(data.fullName, 100) } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
    }
    return this.userRepository.update(id, sanitized)
  }
}
