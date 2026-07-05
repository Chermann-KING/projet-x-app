export type UserRole = 'client' | 'artisan' | 'admin'

export interface User {
  id: string
  email: string
  phone: string
  fullName: string
  role: UserRole
  createdAt: Date
  avatarUrl?: string
}
