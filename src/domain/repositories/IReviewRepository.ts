import type { Review } from '../entities/Review'

export interface IReviewRepository {
  findByArtisanId(artisanId: string): Promise<Review[]>
  findByClientId(clientId: string): Promise<Review[]>
  findByAppointmentId(appointmentId: string): Promise<Review | null>
  create(data: Omit<Review, 'id' | 'createdAt'>): Promise<Review>
}
