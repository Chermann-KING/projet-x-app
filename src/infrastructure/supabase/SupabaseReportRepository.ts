import type { SupabaseClient } from '@supabase/supabase-js'
import type { IReportRepository } from '@/domain/repositories/IReportRepository'
import type { Report, ReportStatus } from '@/domain/entities/Report'

interface ReportPartyRow {
  id: string
  full_name: string
}

interface ReportRow {
  id: string
  reason: string
  status: ReportStatus
  created_at: string
  artisan: ReportPartyRow | ReportPartyRow[] | null
  reporter: ReportPartyRow | ReportPartyRow[] | null
}

function firstParty(party: ReportRow['artisan']): ReportPartyRow | undefined {
  return Array.isArray(party) ? party[0] : (party ?? undefined)
}

function mapReportRow(row: ReportRow): Report {
  const artisan = firstParty(row.artisan)
  const reporter = firstParty(row.reporter)
  return {
    id: row.id,
    artisanId: artisan?.id ?? '',
    artisanName: artisan?.full_name ?? 'Inconnu',
    reporterId: reporter?.id ?? '',
    reporterName: reporter?.full_name ?? 'Inconnu',
    reason: row.reason,
    status: row.status,
    createdAt: new Date(row.created_at),
  }
}

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
      .overrideTypes<ReportRow[], { merge: false }>()

    if (error) throw error
    return (data ?? []).map(mapReportRow)
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
}
