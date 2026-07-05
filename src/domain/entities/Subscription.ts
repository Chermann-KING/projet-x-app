import type { SubscriptionPlan } from './Artisan'

export interface Subscription {
  id: string
  artisanId: string
  plan: SubscriptionPlan
  startedAt: Date
  expiresAt: Date
}
