import type { INotificationService } from '@/domain/repositories/INotificationService'

export class GetUnreadCountUseCase {
  constructor(private readonly notificationService: INotificationService) {}

  async execute(userId: string): Promise<number> {
    return this.notificationService.countUnread(userId)
  }
}
