export type QuoteStatus =
  | 'pending'   // Client a soumis une demande
  | 'sent'      // Artisan a envoyé un devis chiffré
  | 'accepted'  // Client a accepté
  | 'refused'   // Client a refusé
  | 'done'      // Prestation terminée

export interface Quote {
  id: string
  clientId: string
  artisanId: string
  description: string
  adresse: string
  disponibiliteSouhaitee?: Date
  status: QuoteStatus
  prix?: number
  delaiPropose?: string
  createdAt: Date
  updatedAt: Date
}
