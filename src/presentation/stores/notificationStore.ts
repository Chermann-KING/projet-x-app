import { create } from 'zustand'
import type { AppNotification } from '@/shared/logger/IAppLogger'
import { AppLogger } from '@/shared/logger/AppLogger'

interface NotificationState {
  current: AppNotification | null
  queue: AppNotification[]
  show: (notification: AppNotification) => void
  dismiss: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  current: null,
  queue: [],

  show(notification) {
    const { current } = get()
    if (current === null) {
      set({ current: notification })
    } else {
      set((state) => ({ queue: [...state.queue, notification] }))
    }
  },

  dismiss() {
    const { queue } = get()
    const [next, ...rest] = queue
    set({ current: next ?? null, queue: rest })
  },
}))

/**
 * Connecte AppLogger au store de notifications.
 * À appeler une seule fois dans app/_layout.tsx (root layout).
 */
export function registerAppLogger(): void {
  AppLogger.register((notification) => {
    useNotificationStore.getState().show(notification)
  })
}
