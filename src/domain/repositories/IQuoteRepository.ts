import type { Quote, QuoteStatus } from '../entities/Quote'

export interface IQuoteRepository {
  findById(id: string): Promise<Quote | null>
  findByClientId(clientId: string): Promise<Quote[]>
  findByArtisanId(artisanId: string): Promise<Quote[]>
  create(data: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote>
  update(id: string, data: Partial<Quote>): Promise<Quote>
  updateStatus(id: string, status: QuoteStatus): Promise<void>
}
