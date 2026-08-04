import type { SupabaseClient } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import type { IAuthRepository, SignUpData } from '@/domain/repositories/IAuthRepository'
import type { User } from '@/domain/entities/User'
import { AuthError, NetworkError } from '@/shared/errors'
import { AppLogger } from '@/shared/logger/AppLogger'

export class SupabaseAuthRepository implements IAuthRepository {
  constructor(private readonly client: SupabaseClient) {}

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw new AuthError('AUTH_INVALID_CREDENTIALS', error.message)
    if (!data.user) throw new AuthError('AUTH_INVALID_CREDENTIALS', 'No user returned')

    return this.fetchProfile(data.user.id)
  }

  async signUp(data: SignUpData): Promise<User> {
    const { data: authData, error: authError } = await this.client.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone,
          role: data.role,
        },
      },
    })

    if (authError) {
      const isAlreadyExists =
        authError.message.toLowerCase().includes('already registered') ||
        authError.message.toLowerCase().includes('already_exists') ||
        authError.code === 'user_already_exists'
      throw new AuthError(
        isAlreadyExists ? 'USER_ALREADY_EXISTS' : 'SIGN_UP_ERROR',
        authError.message,
      )
    }
    if (!authData.user) throw new AuthError('NO_USER', 'No user returned')

    const { error: profileError } = await this.client.from('profiles').insert({
      id: authData.user.id,
      email: data.email,
      full_name: data.fullName,
      phone: data.phone,
      role: data.role,
    })

    if (profileError) {
      AppLogger.error(profileError)
      throw new NetworkError()
    }

    return {
      id: authData.user.id,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      role: data.role,
      createdAt: new Date(authData.user.created_at),
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut()
    if (error) throw new NetworkError()
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL('reset-password'),
    })
    if (error) throw new NetworkError()
  }

  async establishRecoverySession(accessToken: string, refreshToken: string): Promise<void> {
    const { error } = await this.client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (error) throw new AuthError('AUTH_SESSION_EXPIRED', error.message)
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.client.auth.updateUser({ password: newPassword })
    if (error) throw new NetworkError()
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.client.auth.getUser()
    if (!user) return null
    return this.fetchProfile(user.id)
  }

  async updateAvatarUrl(userId: string, url: string): Promise<void> {
    const { error } = await this.client
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', userId)

    if (error) throw new NetworkError()
  }

  private async fetchProfile(userId: string): Promise<User> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) throw new AuthError('PROFILE_NOT_FOUND', 'Profile not found')

    return {
      id: data.id as string,
      email: data.email as string,
      fullName: data.full_name as string,
      phone: data.phone as string,
      role: data.role as User['role'],
      createdAt: new Date(data.created_at as string),
      ...(data.avatar_url != null ? { avatarUrl: data.avatar_url as string } : {}),
    }
  }
}
