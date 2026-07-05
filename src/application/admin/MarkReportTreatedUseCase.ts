import type { IReportRepository } from '@/domain/repositories/IReportRepository'

export class MarkReportTreatedUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(reportId: string): Promise<void> {
    return this.reportRepository.updateStatus(reportId, 'treated')
  }
}
