import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import { NotFoundError, UnauthorizedError, ValidationError } from '@/shared/errors'

export class DeclineQuoteRequestUseCase {
  constructor(private readonly quoteRepository: IQuoteRepository) {}

  async execute(quoteId: string, artisanId: string): Promise<void> {
    const quote = await this.quoteRepository.findById(quoteId)
    if (!quote) throw new NotFoundError('Quote', quoteId)
    if (quote.artisanId !== artisanId) throw new UnauthorizedError()
    if (quote.status !== 'pending') {
      throw new ValidationError('Seules les demandes en attente peuvent être déclinées')
    }
    await this.quoteRepository.updateStatus(quoteId, 'refused')
  }
}
