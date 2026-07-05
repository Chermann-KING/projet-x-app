import type { IReportRepository } from '@/domain/repositories/IReportRepository'

export class GetPendingReportCountUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(): Promise<number> {
    return this.reportRepository.countPending()
  }
}
