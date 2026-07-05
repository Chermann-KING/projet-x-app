import type { IReportRepository } from '@/domain/repositories/IReportRepository'
import type { Report } from '@/domain/entities/Report'

export class GetReportsUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(): Promise<Report[]> {
    return this.reportRepository.findAll()
  }
}
