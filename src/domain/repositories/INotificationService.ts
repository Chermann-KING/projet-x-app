export interface PushPayload {
  title: string
  body: string
  data?: Record<string, string>
}

export interface InboxNotification {
  id: string
  type: 'quote_request' | 'quote_response' | 'message' | 'job_done'
  quoteId?: string
  title: string
  body: string
  isRead: boolean
  createdAt: Date
}

export interface INotificationService {
  send(userId: string, payload: PushPayload): Promise<void>
  registerToken(userId: string, token: string): Promise<void>
  getInbox(userId: string): Promise<InboxNotification[]>
  countUnread(userId: string): Promise<number>
  markAllRead(userId: string): Promise<void>
}
