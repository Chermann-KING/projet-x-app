import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import type { INotificationService } from '@/domain/repositories/INotificationService'
import { NotFoundError, UnauthorizedError, ValidationError } from '@/shared/errors'

interface MarkQuoteDoneInput {
  quoteId: string
  artisanId: string
  notification: { title: string; body: string }
}

export class MarkQuoteDoneUseCase {
  constructor(
    private readonly quoteRepository: IQuoteRepository,
    private readonly notificationService: INotificationService,
  ) {}

  async execute(input: MarkQuoteDoneInput): Promise<void> {
    const quote = await this.quoteRepository.findById(input.quoteId)
    if (!quote) throw new NotFoundError('Quote', input.quoteId)
    if (quote.artisanId !== input.artisanId) throw new UnauthorizedError()
    if (quote.status !== 'accepted') {
      throw new ValidationError('Seuls les devis acceptés peuvent être marqués comme terminés')
    }
    await this.quoteRepository.updateStatus(input.quoteId, 'done')

    this.notificationService
      .send(quote.clientId, {
        title: input.notification.title,
        body: input.notification.body,
        data: { type: 'job_done', quoteId: quote.id, role: 'client' },
      })
      .catch(() => {})
  }
}
