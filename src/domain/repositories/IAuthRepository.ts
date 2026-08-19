import type { User, UserRole } from '@/domain/entities/User'

export interface SignUpData {
  fullName: string
  email: string
  phone: string
  password: string
  role: UserRole
  /** Langue de l'app au moment de l'inscription (ex. 'fr') — utilisée côté serveur pour les emails transactionnels. */
  locale: string
}

export interface IAuthRepository {
  signIn(email: string, password: string): Promise<User>
  signUp(data: SignUpData): Promise<User>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
  /** Consomme le token à usage unique reçu par email et établit une session de récupération. */
  verifyRecoveryOtp(tokenHash: string): Promise<void>
  /** Nécessite une session active (normale ou de récupération, voir verifyRecoveryOtp). */
  updatePassword(newPassword: string): Promise<void>
  getCurrentUser(): Promise<User | null>
  updateAvatarUrl(userId: string, url: string): Promise<void>
}
