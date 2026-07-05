import type { User, UserRole } from '@/domain/entities/User'

export interface SignUpData {
  fullName: string
  email: string
  phone: string
  password: string
  role: UserRole
}

export interface IAuthRepository {
  signIn(email: string, password: string): Promise<User>
  signUp(data: SignUpData): Promise<User>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
  getCurrentUser(): Promise<User | null>
  updateAvatarUrl(userId: string, url: string): Promise<void>
}
