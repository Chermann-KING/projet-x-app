import type { Message } from '../entities/Message'

export interface IMessageRepository {
  findByQuoteId(quoteId: string): Promise<Message[]>
  findConversations(userId: string): Promise<{ quoteId: string; lastMessage: Message }[]>
  create(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message>
  markAsRead(messageId: string): Promise<void>
  countUnread(receiverId: string): Promise<number>
  /** Subscribe to new messages for a quote. Returns an unsubscribe function. */
  subscribeToConversation(quoteId: string, onMessage: (msg: Message) => void): () => void
}
