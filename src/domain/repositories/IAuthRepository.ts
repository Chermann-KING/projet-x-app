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
  /** Établit une session à partir des tokens reçus dans le lien de récupération de mot de passe. */
  establishRecoverySession(accessToken: string, refreshToken: string): Promise<void>
  /** Nécessite une session active (normale ou de récupération, voir establishRecoverySession). */
  updatePassword(newPassword: string): Promise<void>
  getCurrentUser(): Promise<User | null>
  updateAvatarUrl(userId: string, url: string): Promise<void>
}
