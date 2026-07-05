import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import type { INotificationService } from '@/domain/repositories/INotificationService'
import type { Quote } from '@/domain/entities/Quote'
import { ValidationError, NotFoundError, UnauthorizedError } from '@/shared/errors'
import { sanitizeText } from '@/shared/utils/sanitize'

const DESCRIPTION_MAX_LENGTH = 2000
const DELAY_MAX_LENGTH = 100

interface RespondToQuoteInput {
  quoteId: string
  artisanId: string
  prix: number
  description: string
  delaiPropose?: string
  notification: { title: string; body: string }
}

export class RespondToQuoteUseCase {
  constructor(
    private readonly quoteRepository: IQuoteRepository,
    private readonly notificationService: INotificationService,
  ) {}

  async execute(input: RespondToQuoteInput): Promise<Quote> {
    if (input.prix <= 0) {
      throw new ValidationError('Le prix doit être supérieur à zéro')
    }

    const description = sanitizeText(input.description, DESCRIPTION_MAX_LENGTH).trim()
    if (!description) {
      throw new ValidationError('La description des travaux est requise')
    }

    const quote = await this.quoteRepository.findById(input.quoteId)
    if (!quote) throw new NotFoundError('Quote', input.quoteId)
    if (quote.artisanId !== input.artisanId) throw new UnauthorizedError()
    if (quote.status !== 'pending') {
      throw new ValidationError('Seules les demandes en attente peuvent recevoir un devis')
    }

    const updated = await this.quoteRepository.update(input.quoteId, {
      status: 'sent',
      prix: input.prix,
      description,
      ...(input.delaiPropose ? { delaiPropose: sanitizeText(input.delaiPropose, DELAY_MAX_LENGTH) } : {}),
    })

    this.notificationService
      .send(quote.clientId, {
        title: input.notification.title,
        body: input.notification.body,
        data: { type: 'quote_response', quoteId: quote.id, role: 'client' },
      })
      .catch(() => {})

    return updated
  }
}
