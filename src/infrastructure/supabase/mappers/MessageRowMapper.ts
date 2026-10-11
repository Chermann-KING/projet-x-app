import type { Message } from '@/domain/entities/Message'

export interface MessageRow {
  id: string
  sender_id: string
  receiver_id: string
  quote_id: string
  content: string
  is_read: boolean
  created_at: string
}

export function mapMessageRow(row: MessageRow): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    quoteId: row.quote_id,
    content: row.content,
    isRead: row.is_read,
    createdAt: new Date(row.created_at),
  }
}
