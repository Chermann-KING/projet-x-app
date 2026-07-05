import type { IMessageRepository } from '@/domain/repositories/IMessageRepository'
import type { INotificationService } from '@/domain/repositories/INotificationService'
import type { Message } from '@/domain/entities/Message'
import { ValidationError } from '@/shared/errors'
import { sanitizeText } from '@/shared/utils/sanitize'

interface SendMessageInput {
  quoteId: string
  senderId: string
  receiverId: string
  receiverRole: 'artisan' | 'client'
  content: string
  notification: { title: string; body: string }
}

export class SendMessageUseCase {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly notificationService: INotificationService,
  ) {}

  async execute(input: SendMessageInput): Promise<Message> {
    if (!input.content.trim()) {
      throw new ValidationError('Le message ne peut pas être vide')
    }

    const message = await this.messageRepository.create({
      quoteId: input.quoteId,
      senderId: input.senderId,
      receiverId: input.receiverId,
      content: sanitizeText(input.content, 2000),
      isRead: false,
    })

    this.notificationService
      .send(input.receiverId, {
        title: input.notification.title,
        body: input.notification.body,
        data: { type: 'message', quoteId: input.quoteId, role: input.receiverRole },
      })
      .catch(() => {})

    return message
  }
}
