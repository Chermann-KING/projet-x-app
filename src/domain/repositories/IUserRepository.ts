import type { User } from '../entities/User'

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findManyByIds(ids: string[]): Promise<User[]>
  findByEmail(email: string): Promise<User | null>
  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>
  update(id: string, data: Partial<User>): Promise<User>
}
