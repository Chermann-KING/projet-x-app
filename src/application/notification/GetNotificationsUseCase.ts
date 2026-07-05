import type { INotificationService, InboxNotification } from '@/domain/repositories/INotificationService'

export class GetNotificationsUseCase {
  constructor(private readonly notificationService: INotificationService) {}

  async execute(userId: string): Promise<InboxNotification[]> {
    return this.notificationService.getInbox(userId)
  }
}
