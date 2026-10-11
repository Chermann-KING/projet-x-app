import type { Rating, Review } from '@/domain/entities/Review'

export interface ReviewRow {
  id: string
  appointment_id: string
  client_id: string
  artisan_id: string
  rating: Rating
  comment?: string | null
  created_at: string
}

export function mapReviewRow(row: ReviewRow): Review {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    clientId: row.client_id,
    artisanId: row.artisan_id,
    rating: row.rating,
    ...(row.comment != null ? { comment: row.comment } : {}),
    createdAt: new Date(row.created_at),
  }
}
