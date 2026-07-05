import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import { NotFoundError, UnauthorizedError } from '@/shared/errors'

export class RefuseQuoteUseCase {
  constructor(private readonly quoteRepository: IQuoteRepository) {}

  async execute(quoteId: string, clientId: string): Promise<void> {
    const quote = await this.quoteRepository.findById(quoteId)
    if (!quote) throw new NotFoundError('Quote', quoteId)
    if (quote.clientId !== clientId) throw new UnauthorizedError()
    if (quote.status !== 'sent') {
      throw new Error('Seuls les devis reçus peuvent être refusés')
    }

    await this.quoteRepository.updateStatus(quoteId, 'refused')
  }
}
