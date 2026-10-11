import type { SupabaseClient } from '@supabase/supabase-js'
import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import type { Quote, QuoteStatus } from '@/domain/entities/Quote'
import { NetworkError, NotFoundError } from '@/shared/errors'
import { mapQuoteRow, type QuoteRow } from './mappers/QuoteRowMapper'

export class SupabaseQuoteRepository implements IQuoteRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Quote | null> {
    const { data, error } = await this.client
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single<QuoteRow>()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new NetworkError()
    }
    return data ? mapQuoteRow(data) : null
  }

  async findByClientId(clientId: string): Promise<Quote[]> {
    const { data, error } = await this.client
      .from('quotes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(100)
      .overrideTypes<QuoteRow[], { merge: false }>()

    if (error) throw new NetworkError()
    return (data ?? []).map(mapQuoteRow)
  }

  async findByArtisanId(artisanId: string): Promise<Quote[]> {
    const { data, error } = await this.client
      .from('quotes')
      .select('*')
      .eq('artisan_id', artisanId)
      .order('created_at', { ascending: false })
      .limit(100)
      .overrideTypes<QuoteRow[], { merge: false }>()

    if (error) throw new NetworkError()
    return (data ?? []).map(mapQuoteRow)
  }

  async create(data: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote> {
    const { data: created, error } = await this.client
      .from('quotes')
      .insert({
        client_id: data.clientId,
        artisan_id: data.artisanId,
        description: data.description,
        adresse: data.adresse,
        disponibilite_souhaitee: data.disponibiliteSouhaitee?.toISOString() ?? null,
        status: data.status,
        prix: data.prix ?? null,
        delai_propose: data.delaiPropose ?? null,
      })
      .select()
      .single<QuoteRow>()

    if (error || !created) throw new NetworkError()
    return mapQuoteRow(created)
  }

  async update(id: string, data: Partial<Quote>): Promise<Quote> {
    const patch: Record<string, unknown> = {}
    if (data.description !== undefined) patch.description = data.description
    if (data.adresse !== undefined) patch.adresse = data.adresse
    if (data.status !== undefined) patch.status = data.status
    if (data.prix !== undefined) patch.prix = data.prix
    if (data.delaiPropose !== undefined) patch.delai_propose = data.delaiPropose
    if (data.disponibiliteSouhaitee !== undefined) {
      patch.disponibilite_souhaitee = data.disponibiliteSouhaitee?.toISOString() ?? null
    }

    const { data: updated, error } = await this.client
      .from('quotes')
      .update(patch)
      .eq('id', id)
      .select()
      .single<QuoteRow>()

    if (error) throw new NetworkError()
    if (!updated) throw new NotFoundError('Quote', id)
    return mapQuoteRow(updated)
  }

  async updateStatus(id: string, status: QuoteStatus): Promise<void> {
    const { error } = await this.client
      .from('quotes')
      .update({ status })
      .eq('id', id)

    if (error) throw new NetworkError()
  }
}
