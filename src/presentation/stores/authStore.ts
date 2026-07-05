import { create } from 'zustand'
import type { User } from '@/domain/entities/User'

/** Mode actif de l'application pour un utilisateur artisan.
 *  Purement UI — non persisté en base. Réinitialisé à 'artisan' à la déconnexion. */
export type AppMode = 'artisan' | 'client'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  appMode: AppMode
  avatarUrl: string | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setAppMode: (mode: AppMode) => void
  setAvatarUrl: (url: string | null) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  appMode: 'artisan',
  avatarUrl: null,

  setUser: (user) => set({
    user,
    isAuthenticated: user !== null,
    isLoading: false,
    ...(user?.avatarUrl !== undefined ? { avatarUrl: user.avatarUrl } : {}),
  }),
  setLoading: (isLoading) => set({ isLoading }),
  setAppMode: (appMode) => set({ appMode }),
  setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
  reset: () => set({ user: null, isAuthenticated: false, isLoading: false, appMode: 'artisan', avatarUrl: null }),
}))
