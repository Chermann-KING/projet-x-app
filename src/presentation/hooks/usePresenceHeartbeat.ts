import { useEffect } from 'react'
import { AppState } from 'react-native'
import { supabase } from '@/infrastructure/supabase/client'
import { useAuthStore } from '@/presentation/stores/authStore'
import { AppLogger } from '@/shared/logger/AppLogger'

const HEARTBEAT_INTERVAL_MS = 60_000

async function updateLastSeen(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) AppLogger.error(error)
}

/**
 * Met à jour profiles.last_seen_at toutes les 60s tant que l'app est au premier plan.
 * À monter une seule fois dans le layout racine de chaque espace (artisan / client).
 */
export function usePresenceHeartbeat(): void {
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!userId) return

    void updateLastSeen(userId)
    const interval = setInterval(() => void updateLastSeen(userId), HEARTBEAT_INTERVAL_MS)

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void updateLastSeen(userId)
    })

    return () => {
      clearInterval(interval)
      sub.remove()
    }
  }, [userId])
}
