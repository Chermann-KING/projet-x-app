import type { INotificationService } from '@/domain/repositories/INotificationService'

export class MarkNotificationsReadUseCase {
  constructor(private readonly notificationService: INotificationService) {}

  async execute(userId: string): Promise<void> {
    return this.notificationService.markAllRead(userId)
  }
}
