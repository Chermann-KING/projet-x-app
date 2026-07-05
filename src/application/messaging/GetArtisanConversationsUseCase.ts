import type { IMessageRepository } from '@/domain/repositories/IMessageRepository'
import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import type { Message } from '@/domain/entities/Message'
import type { Quote } from '@/domain/entities/Quote'

export interface ArtisanConversation {
  quoteId: string
  quote: Quote | null
  lastMessage: Message
  unreadCount: number
}

export class GetArtisanConversationsUseCase {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly quoteRepository: IQuoteRepository,
  ) {}

  async execute(artisanUserId: string): Promise<ArtisanConversation[]> {
    const conversations = await this.messageRepository.findConversations(artisanUserId)
    if (conversations.length === 0) return []

    const quoteIds = conversations.map((c) => c.quoteId)
    const quotes = await Promise.all(quoteIds.map((id) => this.quoteRepository.findById(id)))
    const quoteMap = new Map(quotes.map((q, i) => [quoteIds[i], q ?? null]))

    const unread = await this.messageRepository.countUnread(artisanUserId)

    return conversations.map((c, idx) => ({
      quoteId: c.quoteId,
      quote: quoteMap.get(c.quoteId) ?? null,
      lastMessage: c.lastMessage,
      unreadCount: idx === 0 ? unread : 0,
    }))
  }
}
