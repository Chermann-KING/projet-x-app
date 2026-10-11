import type { IAppLogger, AppNotification, NotificationDisplay } from '@/shared/logger/IAppLogger'
import { ERROR_CATALOG, type ErrorCode } from '@/shared/logger/errorCatalog'
import { SUCCESS_CATALOG, type SuccessCode } from '@/shared/logger/successCatalog'
import { AppError } from '@/shared/errors'

class AppLoggerImpl implements IAppLogger {
  private notifyFn: ((notification: AppNotification) => void) | null = null

  /** Appelé une seule fois au boot depuis le NotificationStore */
  register(fn: (notification: AppNotification) => void): void {
    this.notifyFn = fn
  }

  notify(notification: AppNotification): void {
    this.notifyFn?.(notification)
  }

  success(code: SuccessCode, display?: NotificationDisplay): void {
    const entry = SUCCESS_CATALOG[code]
    this.notify({
      level: 'success',
      display: display ?? entry.defaultDisplay,
      title: entry.title,
      ...(entry.message !== undefined && { message: entry.message }),
      ...(entry.duration !== undefined && { duration: entry.duration }),
      code,
    })
  }

  error(error: unknown, display?: NotificationDisplay): void {
    const entry =
      error instanceof AppError
        ? (ERROR_CATALOG[error.code as ErrorCode] ?? ERROR_CATALOG.UNKNOWN_ERROR)
        : ERROR_CATALOG.UNKNOWN_ERROR

    this.notify({
      level: 'error',
      display: display ?? entry.defaultDisplay,
      title: entry.title,
      message: entry.message,
      ...(error instanceof AppError && { code: error.code }),
    })

    if (__DEV__) {
      console.error('[AppLogger]', error)
    }
  }

  warn(code: ErrorCode, display?: NotificationDisplay): void {
    const entry = ERROR_CATALOG[code]
    this.notify({
      level: 'warning',
      display: display ?? entry.defaultDisplay,
      title: entry.title,
      message: entry.message,
      code,
    })
  }

  debug(message: string, context?: object): void {
    if (__DEV__) console.debug(`[DEBUG] ${message}`, context)
  }

  info(message: string, context?: object): void {
    if (__DEV__) console.info(`[INFO] ${message}`, context)
  }

  log(message: string, context?: object): void {
    // reason: AppLogger est l'unique point de sortie console ; log() en est la variante non niveauée.
    // eslint-disable-next-line no-console
    if (__DEV__) console.log(`[LOG] ${message}`, context)
  }
}

/** Singleton — importé partout dans l'app, jamais instancié ailleurs */
export const AppLogger = new AppLoggerImpl()
