import type { SupabaseClient } from '@supabase/supabase-js'
import type { IUserRepository } from '@/domain/repositories/IUserRepository'
import type { User } from '@/domain/entities/User'
import { NetworkError } from '@/shared/errors'
import { mapUserRow, type UserRow } from './mappers/UserRowMapper'

export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single<UserRow>()

    if (error || !data) return null
    return mapUserRow(data)
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return []
    const { data } = await this.client
      .from('profiles')
      .select('*')
      .in('id', ids)
      .overrideTypes<UserRow[], { merge: false }>()
    return (data ?? []).map(mapUserRow)
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single<UserRow>()

    if (error || !data) return null
    return mapUserRow(data)
  }

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const { data: row, error } = await this.client
      .from('profiles')
      .insert({
        email: data.email,
        full_name: data.fullName,
        phone: data.phone,
        role: data.role,
      })
      .select()
      .single<UserRow>()

    if (error || !row) throw new NetworkError()
    return mapUserRow(row)
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const patch: Record<string, unknown> = {}
    if (data.fullName !== undefined) patch.full_name = data.fullName
    if (data.phone !== undefined) patch.phone = data.phone
    if (data.email !== undefined) patch.email = data.email

    const { data: row, error } = await this.client
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select()
      .single<UserRow>()

    if (error || !row) throw new NetworkError()
    return mapUserRow(row)
  }
}
