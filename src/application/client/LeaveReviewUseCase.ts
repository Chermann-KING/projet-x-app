import type { IReviewRepository } from '@/domain/repositories/IReviewRepository'
import type { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository'
import type { Review, Rating } from '@/domain/entities/Review'
import { NotFoundError, ValidationError } from '@/shared/errors'
import { sanitizeText } from '@/shared/utils/sanitize'

interface LeaveReviewInput {
  appointmentId: string
  clientId: string
  artisanId: string
  rating: Rating
  comment?: string
}

export class LeaveReviewUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(input: LeaveReviewInput): Promise<Review> {
    const appointment = await this.appointmentRepository.findById(input.appointmentId)
    if (!appointment) throw new NotFoundError('Appointment', input.appointmentId)
    if (appointment.status !== 'completed') {
      throw new ValidationError('Un avis ne peut être laissé que sur une prestation terminée')
    }

    const existing = await this.reviewRepository.findByAppointmentId(input.appointmentId)
    if (existing) {
      throw new ValidationError('Vous avez déjà laissé un avis pour cette prestation')
    }

    return this.reviewRepository.create({
      appointmentId: input.appointmentId,
      clientId: input.clientId,
      artisanId: input.artisanId,
      rating: input.rating,
      ...(input.comment !== undefined && { comment: sanitizeText(input.comment, 500) }),
    })
  }
}
