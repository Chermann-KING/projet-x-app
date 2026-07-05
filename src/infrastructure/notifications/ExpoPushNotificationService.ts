import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  INotificationService,
  InboxNotification,
  PushPayload,
} from '@/domain/repositories/INotificationService'
import { AppLogger } from '@/shared/logger/AppLogger'

export class ExpoPushNotificationService implements INotificationService {
  constructor(private readonly client: SupabaseClient) {}

  async send(userId: string, payload: PushPayload): Promise<void> {
    // Edge Function handles both DB insert (BYPASSRLS) and Expo push (server-side).
    void this.client.functions
      .invoke('create-notification', {
        body: {
          userId,
          type: payload.data?.type ?? 'message',
          quoteId: payload.data?.quoteId ?? null,
          title: payload.title,
          body: payload.body,
        },
      })
      .then(({ error }) => {
        if (error) AppLogger.error('create-notification failed', error)
      })
      .catch((err) => AppLogger.error('create-notification network error', err))
  }

  async registerToken(userId: string, token: string): Promise<void> {
    await this.client
      .from('push_tokens')
      .upsert({ user_id: userId, token }, { onConflict: 'user_id' })
  }

  async getInbox(userId: string): Promise<InboxNotification[]> {
    const { data } = await this.client
      .from('notifications')
      .select('id, type, quote_id, title, body, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!data) return []

    return data.map((row) => ({
      id: row.id as string,
      type: row.type as InboxNotification['type'],
      ...(row.quote_id != null ? { quoteId: row.quote_id as string } : {}),
      title: row.title as string,
      body: row.body as string,
      isRead: row.is_read as boolean,
      createdAt: new Date(row.created_at as string),
    }))
  }

  async countUnread(userId: string): Promise<number> {
    const { count } = await this.client
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    return count ?? 0
  }

  async markAllRead(userId: string): Promise<void> {
    await this.client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
  }
}
