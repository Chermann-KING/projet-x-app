import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import type { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository'
import type { IUserRepository } from '@/domain/repositories/IUserRepository'
import type { Artisan } from '@/domain/entities/Artisan'
import type { Quote } from '@/domain/entities/Quote'
import type { Appointment } from '@/domain/entities/Appointment'
import { NotFoundError } from '@/shared/errors'

export interface QuoteWithClientInfo extends Quote {
  clientName: string
  clientAvatarUrl?: string
}

export interface ArtisanDashboardData {
  artisan: Artisan
  pendingQuotes: QuoteWithClientInfo[]
  rdvTodayCount: number
  quotesThisMonth: number
}

function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

function isThisMonth(date: Date): boolean {
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

export class GetArtisanDashboardUseCase {
  constructor(
    private readonly artisanRepository: IArtisanRepository,
    private readonly quoteRepository: IQuoteRepository,
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<ArtisanDashboardData> {
    const artisan = await this.artisanRepository.findByUserId(userId)
    if (!artisan) throw new NotFoundError('Artisan', userId)

    const [quotes, appointments] = await Promise.all([
      this.quoteRepository.findByArtisanId(artisan.id),
      this.appointmentRepository.findByArtisanId(artisan.id),
    ])

    const pending = quotes.filter((q) => q.status === 'pending').slice(0, 3)
    const clientIds = [...new Set(pending.map((q) => q.clientId))]
    const clients = await this.userRepository.findManyByIds(clientIds)
    const clientMap = new Map(clients.map((c) => [c.id, c]))

    const pendingQuotes: QuoteWithClientInfo[] = pending.map((q) => ({
      ...q,
      clientName:
        clientMap.get(q.clientId)?.fullName ??
        `Client ${q.clientId.slice(0, 6).toUpperCase()}`,
      ...(clientMap.get(q.clientId)?.avatarUrl
        ? { clientAvatarUrl: clientMap.get(q.clientId)!.avatarUrl }
        : {}),
    }))

    const rdvTodayCount = (appointments as Appointment[]).filter((a) =>
      isToday(new Date(a.scheduledAt)),
    ).length

    const quotesThisMonth = quotes.filter((q) =>
      isThisMonth(new Date(q.createdAt)),
    ).length

    return { artisan, pendingQuotes, rdvTodayCount, quotesThisMonth }
  }
}
