import type { Quote, QuoteStatus } from '@/domain/entities/Quote'

export interface QuoteRow {
  id: string
  client_id: string
  artisan_id: string
  description: string
  adresse: string
  disponibilite_souhaitee?: string | null
  status: QuoteStatus
  prix?: number | null
  delai_propose?: string | null
  created_at: string
  updated_at: string
}

export function mapQuoteRow(row: QuoteRow): Quote {
  return {
    id: row.id,
    clientId: row.client_id,
    artisanId: row.artisan_id,
    description: row.description,
    adresse: row.adresse,
    ...(row.disponibilite_souhaitee
      ? { disponibiliteSouhaitee: new Date(row.disponibilite_souhaitee) }
      : {}),
    status: row.status,
    ...(row.prix != null ? { prix: row.prix } : {}),
    ...(row.delai_propose ? { delaiPropose: row.delai_propose } : {}),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}
