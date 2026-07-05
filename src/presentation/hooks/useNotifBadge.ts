import { useEffect, useState } from 'react'
import { useAuthStore } from '@/presentation/stores/authStore'
import { getUnreadCount } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'

export function useNotifBadge(): { hasUnread: boolean; refresh: () => void } {
  const userId = useAuthStore((s) => s.user?.id)
  const [hasUnread, setHasUnread] = useState(false)

  function refresh(): void {
    if (!userId) return
    getUnreadCount
      .execute(userId)
      .then((count) => setHasUnread(count > 0))
      .catch(AppLogger.error)
  }

  useEffect(() => {
    refresh()
  }, [userId])

  return { hasUnread, refresh }
}
