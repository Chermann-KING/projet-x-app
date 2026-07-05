import type { IReviewRepository } from '@/domain/repositories/IReviewRepository'

export interface ClientReviewStats {
  avgRating: number | null
}

export class GetClientReviewStatsUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(clientId: string): Promise<ClientReviewStats> {
    const reviews = await this.reviewRepository.findByClientId(clientId)
    if (reviews.length === 0) return { avgRating: null }
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    return { avgRating: Math.round(avg * 10) / 10 }
  }
}
