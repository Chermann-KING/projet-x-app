export interface Message {
  id: string
  senderId: string
  receiverId: string
  quoteId: string
  content: string
  isRead: boolean
  createdAt: Date
}
