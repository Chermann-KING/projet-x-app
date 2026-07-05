import type { SupabaseClient } from '@supabase/supabase-js'
import type { IUserRepository } from '@/domain/repositories/IUserRepository'
import type { User } from '@/domain/entities/User'
import { NetworkError } from '@/shared/errors'

export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.mapRow(data)
  }

  async findManyByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return []
    const { data } = await this.client
      .from('profiles')
      .select('*')
      .in('id', ids)
    return (data ?? []).map((row) => this.mapRow(row as Record<string, unknown>))
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) return null
    return this.mapRow(data)
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
      .single()

    if (error || !row) throw new NetworkError()
    return this.mapRow(row)
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
      .single()

    if (error || !row) throw new NetworkError()
    return this.mapRow(row)
  }

  private mapRow(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      email: row.email as string,
      fullName: row.full_name as string,
      phone: row.phone as string,
      role: row.role as User['role'],
      createdAt: new Date(row.created_at as string),
      ...(row.avatar_url ? { avatarUrl: row.avatar_url as string } : {}),
    }
  }
}
