import type { SupabaseClient } from '@supabase/supabase-js'
import type { IReportRepository } from '@/domain/repositories/IReportRepository'
import type { Report, ReportStatus } from '@/domain/entities/Report'

export class SupabaseReportRepository implements IReportRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(): Promise<Report[]> {
    const { data, error } = await this.client
      .from('reports')
      .select(`
        id,
        reason,
        status,
        created_at,
        artisan:artisan_profiles!artisan_id ( id, full_name ),
        reporter:profiles!reporter_id ( id, full_name )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => this.mapToEntity(row))
  }

  async updateStatus(id: string, status: ReportStatus): Promise<void> {
    const { error } = await this.client
      .from('reports')
      .update({ status })
      .eq('id', id)
    if (error) throw error
  }

  async countPending(): Promise<number> {
    const { count, error } = await this.client
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    if (error) return 0
    return count ?? 0
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToEntity(row: any): Report {
    const artisan = Array.isArray(row.artisan) ? row.artisan[0] : row.artisan
    const reporter = Array.isArray(row.reporter) ? row.reporter[0] : row.reporter
    return {
      id: row.id as string,
      artisanId: artisan?.id ?? '',
      artisanName: artisan?.full_name ?? 'Inconnu',
      reporterId: reporter?.id ?? '',
      reporterName: reporter?.full_name ?? 'Inconnu',
      reason: row.reason as string,
      status: row.status as ReportStatus,
      createdAt: new Date(row.created_at as string),
    }
  }
}
