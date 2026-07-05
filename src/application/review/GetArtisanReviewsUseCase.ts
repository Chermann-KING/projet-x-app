import type { IReviewRepository } from '@/domain/repositories/IReviewRepository'
import type { Review, Rating } from '@/domain/entities/Review'

export interface ArtisanReviewsSummary {
  reviews: Review[]
  averageRating: number
  totalCount: number
  ratingDistribution: Record<Rating, number>
}

export class GetArtisanReviewsUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(artisanId: string): Promise<ArtisanReviewsSummary> {
    const reviews = await this.reviewRepository.findByArtisanId(artisanId)

    const distribution: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let total = 0
    for (const review of reviews) {
      distribution[review.rating] += 1
      total += review.rating
    }

    const averageRating = reviews.length > 0 ? total / reviews.length : 0

    return {
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalCount: reviews.length,
      ratingDistribution: distribution,
    }
  }
}
