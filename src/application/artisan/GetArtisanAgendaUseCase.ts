import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import type { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository'
import type { IUserRepository } from '@/domain/repositories/IUserRepository'
import type { Artisan } from '@/domain/entities/Artisan'
import type { Appointment } from '@/domain/entities/Appointment'
import type { Quote } from '@/domain/entities/Quote'
import { NotFoundError } from '@/shared/errors'

export interface ArtisanAgendaData {
  artisan: Artisan
  appointments: Appointment[]
  quotesMap: Record<string, Quote>
  clientNamesMap: Record<string, string>
}

export class GetArtisanAgendaUseCase {
  constructor(
    private readonly artisanRepository: IArtisanRepository,
    private readonly quoteRepository: IQuoteRepository,
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<ArtisanAgendaData> {
    const artisan = await this.artisanRepository.findByUserId(userId)
    if (!artisan) throw new NotFoundError('Artisan', userId)

    const [appointments, quotes] = await Promise.all([
      this.appointmentRepository.findByArtisanId(artisan.id),
      this.quoteRepository.findByArtisanId(artisan.id),
    ])

    const quotesMap: Record<string, Quote> = {}
    for (const q of quotes) quotesMap[q.id] = q

    const clientIds = [...new Set(appointments.map((a) => a.clientId))]
    const clients = await this.userRepository.findManyByIds(clientIds)

    const clientNamesMap: Record<string, string> = {}
    for (const client of clients) clientNamesMap[client.id] = client.fullName

    return { artisan, appointments, quotesMap, clientNamesMap }
  }
}
