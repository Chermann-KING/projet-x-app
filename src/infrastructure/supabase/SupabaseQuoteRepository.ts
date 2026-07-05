import type { SupabaseClient } from '@supabase/supabase-js'
import type { IQuoteRepository } from '@/domain/repositories/IQuoteRepository'
import type { Quote, QuoteStatus } from '@/domain/entities/Quote'
import { NetworkError, NotFoundError } from '@/shared/errors'

export class SupabaseQuoteRepository implements IQuoteRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<Quote | null> {
    const { data, error } = await this.client
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new NetworkError()
    }
    return data ? this.toQuote(data) : null
  }

  async findByClientId(clientId: string): Promise<Quote[]> {
    const { data, error } = await this.client
      .from('quotes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw new NetworkError()
    return (data ?? []).map((row) => this.toQuote(row))
  }

  async findByArtisanId(artisanId: string): Promise<Quote[]> {
    const { data, error } = await this.client
      .from('quotes')
      .select('*')
      .eq('artisan_id', artisanId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw new NetworkError()
    return (data ?? []).map((row) => this.toQuote(row))
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
      .single()

    if (error || !created) throw new NetworkError()
    return this.toQuote(created)
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
      .single()

    if (error) throw new NetworkError()
    if (!updated) throw new NotFoundError('Quote', id)
    return this.toQuote(updated)
  }

  async updateStatus(id: string, status: QuoteStatus): Promise<void> {
    const { error } = await this.client
      .from('quotes')
      .update({ status })
      .eq('id', id)

    if (error) throw new NetworkError()
  }

  private toQuote(row: Record<string, unknown>): Quote {
    return {
      id: row.id as string,
      clientId: row.client_id as string,
      artisanId: row.artisan_id as string,
      description: row.description as string,
      adresse: row.adresse as string,
      ...(row.disponibilite_souhaitee ? { disponibiliteSouhaitee: new Date(row.disponibilite_souhaitee as string) } : {}),
      status: row.status as QuoteStatus,
      ...(row.prix !== null && row.prix !== undefined ? { prix: row.prix as number } : {}),
      ...(row.delai_propose ? { delaiPropose: row.delai_propose as string } : {}),
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    }
  }
}
