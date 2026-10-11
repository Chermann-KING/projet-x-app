import type { SupabaseClient } from '@supabase/supabase-js'
import type { IMessageRepository } from '@/domain/repositories/IMessageRepository'
import type { Message } from '@/domain/entities/Message'
import { NetworkError } from '@/shared/errors'
import { mapMessageRow, type MessageRow } from './mappers/MessageRowMapper'

export class SupabaseMessageRepository implements IMessageRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByQuoteId(quoteId: string): Promise<Message[]> {
    const { data, error } = await this.client
      .from('messages')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true })
      .overrideTypes<MessageRow[], { merge: false }>()

    if (error) throw new NetworkError()
    return (data ?? []).map(mapMessageRow)
  }

  async findConversations(
    userId: string,
  ): Promise<{ quoteId: string; lastMessage: Message }[]> {
    const { data, error } = await this.client
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(500)
      .overrideTypes<MessageRow[], { merge: false }>()

    if (error) throw new NetworkError()

    const byQuote = new Map<string, Message>()
    for (const row of data ?? []) {
      const quoteId = row.quote_id
      if (!byQuote.has(quoteId)) {
        byQuote.set(quoteId, mapMessageRow(row))
      }
    }

    return Array.from(byQuote.entries()).map(([quoteId, lastMessage]) => ({
      quoteId,
      lastMessage,
    }))
  }

  async create(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const { data: created, error } = await this.client
      .from('messages')
      .insert({
        sender_id: data.senderId,
        receiver_id: data.receiverId,
        quote_id: data.quoteId,
        content: data.content,
        is_read: data.isRead,
      })
      .select()
      .single<MessageRow>()

    if (error || !created) throw new NetworkError()
    return mapMessageRow(created)
  }

  async markAsRead(messageId: string): Promise<void> {
    const { error } = await this.client
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)

    if (error) throw new NetworkError()
  }

  async countUnread(receiverId: string): Promise<number> {
    const { count, error } = await this.client
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', receiverId)
      .eq('is_read', false)

    if (error) throw new NetworkError()
    return count ?? 0
  }

  subscribeToConversation(quoteId: string, onMessage: (msg: Message) => void): () => void {
    const channel = this.client
      .channel(`chat:${quoteId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `quote_id=eq.${quoteId}` },
        (payload) => {
          onMessage(mapMessageRow(payload.new as MessageRow))
        },
      )
      .subscribe()

    return () => { void this.client.removeChannel(channel) }
  }
}
