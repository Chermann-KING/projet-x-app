import type { IMessageRepository } from '@/domain/repositories/IMessageRepository'
import type { Message } from '@/domain/entities/Message'

export class GetConversationMessagesUseCase {
  constructor(private readonly messageRepository: IMessageRepository) {}

  async execute(quoteId: string): Promise<Message[]> {
    return this.messageRepository.findByQuoteId(quoteId)
  }
}
