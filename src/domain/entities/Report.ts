export type ReportStatus = 'pending' | 'treated'

export interface Report {
  id: string
  artisanId: string
  artisanName: string
  reporterId: string
  reporterName: string
  reason: string
  status: ReportStatus
  createdAt: Date
}
