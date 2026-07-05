import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import type { IUserRepository } from '@/domain/repositories/IUserRepository'
import type { QuoteWithClientInfo } from './GetArtisanDashboardUseCase'

export class GetArtisanQuotesUseCase {
  constructor(
    private readonly artisanRepository: IArtisanRepository,
    private readonly quoteRepository: IQuoteRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<QuoteWithClientInfo[]> {
    const artisan = await this.artisanRepository.findByUserId(userId)
    if (!artisan) return []

    const quotes = await this.quoteRepository.findByArtisanId(artisan.id)
    const clientIds = [...new Set(quotes.map((q) => q.clientId))]
    const clients = await this.userRepository.findManyByIds(clientIds)
    const clientMap = new Map(clients.map((c) => [c.id, c]))

    return quotes.map((q) => ({
      ...q,
      clientName: clientMap.get(q.clientId)?.fullName ?? '',
      ...(clientMap.get(q.clientId)?.avatarUrl
        ? { clientAvatarUrl: clientMap.get(q.clientId)!.avatarUrl }
        : {}),
    }))
  }
}
