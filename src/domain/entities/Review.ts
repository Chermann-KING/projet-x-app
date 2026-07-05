export type Rating = 1 | 2 | 3 | 4 | 5

export interface Review {
  id: string
  appointmentId: string
  clientId: string
  artisanId: string
  rating: Rating
  comment?: string
  createdAt: Date
}
