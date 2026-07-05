import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { INotificationService } from '@/domain/repositories/INotificationService'
import type { Quote } from '@/domain/entities/Quote'
import { ValidationError } from '@/shared/errors'
import { sanitizeText } from '@/shared/utils/sanitize'

const DESCRIPTION_MIN_LENGTH = 10
const DESCRIPTION_MAX_LENGTH = 1000
const ADDRESS_MAX_LENGTH = 300

interface RequestQuoteInput {
  clientId: string
  artisanId: string
  description: string
  adresse: string
  disponibiliteSouhaitee?: Date
  /** Libellés traduits fournis par la couche présentation (respect i18n). */
  notification: { title: string; body: string }
}

export class RequestQuoteUseCase {
  constructor(
    private readonly quoteRepository: IQuoteRepository,
    private readonly artisanRepository: IArtisanRepository,
    private readonly notificationService: INotificationService,
  ) {}

  async execute(input: RequestQuoteInput): Promise<Quote> {
    const description = sanitizeText(input.description, DESCRIPTION_MAX_LENGTH).trim()
    const adresse = sanitizeText(input.adresse, ADDRESS_MAX_LENGTH).trim()

    if (description.length < DESCRIPTION_MIN_LENGTH) {
      throw new ValidationError(`Description must be at least ${DESCRIPTION_MIN_LENGTH} characters`)
    }
    if (!adresse) {
      throw new ValidationError('Address is required')
    }

    if (input.disponibiliteSouhaitee !== undefined) {
      const ts = input.disponibiliteSouhaitee.getTime()
      if (isNaN(ts)) {
        throw new ValidationError('Invalid availability date')
      }
      if (ts < Date.now()) {
        throw new ValidationError('Availability date must be in the future')
      }
    }

    const quote = await this.quoteRepository.create({
      clientId: input.clientId,
      artisanId: input.artisanId,
      description,
      adresse,
      ...(input.disponibiliteSouhaitee !== undefined
        ? { disponibiliteSouhaitee: input.disponibiliteSouhaitee }
        : {}),
      status: 'pending',
    })

    this.artisanRepository
      .findById(input.artisanId)
      .then((artisan) => {
        if (!artisan) return
        return this.notificationService.send(artisan.userId, {
          title: input.notification.title,
          body: input.notification.body,
          data: { type: 'quote_request', quoteId: quote.id, role: 'artisan' },
        })
      })
      .catch(() => {})

    return quote
  }
}
