import type { User } from '@/domain/entities/User'

export interface UserRow {
  id: string
  email: string
  full_name: string
  phone: string
  role: User['role']
  created_at: string
  avatar_url?: string | null
}

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    createdAt: new Date(row.created_at),
    ...(row.avatar_url ? { avatarUrl: row.avatar_url } : {}),
  }
}
