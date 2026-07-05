import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { QuoteWithArtisan } from '@/domain/entities/QuoteWithArtisan'

export class GetClientRequestsUseCase {
  constructor(
    private readonly quoteRepository: IQuoteRepository,
    private readonly artisanRepository: IArtisanRepository,
  ) {}

  async execute(clientId: string): Promise<QuoteWithArtisan[]> {
    const quotes = await this.quoteRepository.findByClientId(clientId)
    if (quotes.length === 0) return []

    const uniqueArtisanIds = [...new Set(quotes.map((q) => q.artisanId))]
    const artisans = await this.artisanRepository.findByIds(uniqueArtisanIds)
    const artisanMap = new Map(artisans.map((a) => [a.id, a]))

    return quotes.map((q) => {
      const artisan = artisanMap.get(q.artisanId)
      return {
        ...q,
        artisanName: artisan?.fullName ?? '',
        artisanUserId: artisan?.userId ?? '',
        ...(artisan?.avatarUrl ? { artisanAvatarUrl: artisan.avatarUrl } : {}),
        ...(artisan?.phone ? { artisanPhone: artisan.phone } : {}),
        ...(artisan != null ? { artisanMetier: artisan.metier } : {}),
      }
    })
  }
}
