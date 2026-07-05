import type { Quote } from './Quote'
import type { Metier } from '../../shared/constants/metiers'

export interface QuoteWithArtisan extends Quote {
  artisanName: string
  artisanUserId: string
  artisanAvatarUrl?: string
  artisanPhone?: string
  artisanMetier?: Metier
}
