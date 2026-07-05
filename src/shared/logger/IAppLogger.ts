import type { ErrorCode } from './errorCatalog'
import type { SuccessCode } from './successCatalog'

export type NotificationLevel = 'success' | 'error' | 'warning' | 'info'
export type NotificationDisplay = 'toast' | 'modal' | 'popup'

export interface AppNotification {
  level: NotificationLevel
  display: NotificationDisplay
  title: string
  message?: string
  code?: string
  duration?: number
  action?: {
    label: string
    onPress: () => void
  }
}

export interface IAppLogger {
  notify(notification: AppNotification): void
  success(code: SuccessCode, display?: NotificationDisplay): void
  error(error: unknown, display?: NotificationDisplay): void
  warn(code: ErrorCode, display?: NotificationDisplay): void
  debug(message: string, context?: object): void
  info(message: string, context?: object): void
  log(message: string, context?: object): void
}

// Re-export des types de catalogue pour usage externe
export type { ErrorCode } from './errorCatalog'
export type { SuccessCode } from './successCatalog'
