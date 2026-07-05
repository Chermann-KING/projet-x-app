import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import type { IUserRepository } from '@/domain/repositories/IUserRepository'
import type { Quote } from '@/domain/entities/Quote'
import type { User } from '@/domain/entities/User'
import { NotFoundError } from '@/shared/errors'

export interface QuoteWithClient {
  quote: Quote
  clientUser: User | null
}

export class GetQuoteWithClientUseCase {
  constructor(
    private readonly quoteRepository: IQuoteRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(quoteId: string): Promise<QuoteWithClient> {
    const quote = await this.quoteRepository.findById(quoteId)
    if (!quote) throw new NotFoundError('Quote', quoteId)

    const clientUser = await this.userRepository.findById(quote.clientId)

    return { quote, clientUser }
  }
}
