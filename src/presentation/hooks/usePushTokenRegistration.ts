import { useEffect } from 'react'
import { Platform } from 'react-native'
import Constants, { AppOwnership } from 'expo-constants'
import type { ExpoPushTokenOptions } from 'expo-notifications'
import { useAuthStore } from '@/presentation/stores/authStore'
import { notificationService } from '@/di/container'
import { AppLogger } from '@/shared/logger/AppLogger'

export function usePushTokenRegistration(): void {
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!userId) return
    void registerPushToken(userId)
  }, [userId])
}

async function registerPushToken(userId: string): Promise<void> {
  // Guard AVANT l'import : DevicePushTokenAutoRegistration.fx.js
  // s'exécute au chargement du module dans Expo Go et lève une erreur
  // au niveau module. Le dynamic import empêche ce chargement.
  // SDK 53+ : Expo Go retourne 'storeClient' pour executionEnvironment.
  // appOwnership === 'expo' est le seul check fiable pour détecter Expo Go.
  if (Constants.appOwnership === AppOwnership.Expo) return

  const Notifications = await import('expo-notifications')

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== Notifications.PermissionStatus.GRANTED) return

    const projectId = (
      Constants.expoConfig?.extra as { eas?: { projectId?: string } } | null
    )?.eas?.projectId

    const tokenOptions: ExpoPushTokenOptions = {}
    if (projectId != null) tokenOptions.projectId = projectId
    const token = await Notifications.getExpoPushTokenAsync(tokenOptions)

    await notificationService.registerToken(userId, token.data)
  } catch (err) {
    AppLogger.error(err)
  }
}
