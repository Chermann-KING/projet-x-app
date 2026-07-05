import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { QuoteWithArtisan } from '@/domain/entities/QuoteWithArtisan'
import { NotFoundError } from '@/shared/errors'

export class GetClientRequestByIdUseCase {
  constructor(
    private readonly quoteRepository: IQuoteRepository,
    private readonly artisanRepository: IArtisanRepository,
  ) {}

  async execute(quoteId: string): Promise<QuoteWithArtisan> {
    const quote = await this.quoteRepository.findById(quoteId)
    if (!quote) throw new NotFoundError('Quote', quoteId)

    const artisan = await this.artisanRepository.findById(quote.artisanId)

    return {
      ...quote,
      artisanName: artisan?.fullName ?? '',
      artisanUserId: artisan?.userId ?? '',
      ...(artisan?.avatarUrl ? { artisanAvatarUrl: artisan.avatarUrl } : {}),
      ...(artisan?.phone ? { artisanPhone: artisan.phone } : {}),
      ...(artisan != null ? { artisanMetier: artisan.metier } : {}),
    }
  }
}
