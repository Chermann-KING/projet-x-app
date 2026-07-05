import type { IMessageRepository } from '@/domain/repositories/IMessageRepository'
import type { Message } from '@/domain/entities/Message'

export class SubscribeToConversationUseCase {
  constructor(private readonly messageRepository: IMessageRepository) {}

  execute(quoteId: string, onMessage: (msg: Message) => void): () => void {
    return this.messageRepository.subscribeToConversation(quoteId, onMessage)
  }
}
