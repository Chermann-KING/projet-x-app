import type { Report, ReportStatus } from '@/domain/entities/Report'

export interface IReportRepository {
  findAll(): Promise<Report[]>
  updateStatus(id: string, status: ReportStatus): Promise<void>
  countPending(): Promise<number>
}
