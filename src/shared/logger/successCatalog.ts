import type { NotificationDisplay } from './IAppLogger'

export type SuccessCode =
  | 'AUTH_REGISTER_SUCCESS'
  | 'AUTH_LOGIN_SUCCESS'
  | 'PROFILE_UPDATED'
  | 'PHOTO_UPLOADED'
  | 'QUOTE_REQUEST_SENT'
  | 'QUOTE_SENT'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REFUSED'
  | 'REVIEW_SUBMITTED'
  | 'MESSAGE_SENT'

interface SuccessEntry {
  title: string
  message?: string
  defaultDisplay: NotificationDisplay
  duration?: number
}

export const SUCCESS_CATALOG: Record<SuccessCode, SuccessEntry> = {
  AUTH_REGISTER_SUCCESS: {
    title: 'Compte créé',
    message: 'Bienvenue ! Votre compte a été créé avec succès.',
    defaultDisplay: 'toast',
    duration: 3000,
  },
  AUTH_LOGIN_SUCCESS: {
    title: 'Connexion réussie',
    defaultDisplay: 'toast',
    duration: 2000,
  },
  PROFILE_UPDATED: {
    title: 'Profil mis à jour',
    defaultDisplay: 'toast',
    duration: 2500,
  },
  PHOTO_UPLOADED: {
    title: 'Photo ajoutée',
    defaultDisplay: 'toast',
    duration: 2000,
  },
  QUOTE_REQUEST_SENT: {
    title: 'Demande envoyée',
    message: "L'artisan a été notifié et vous répondra rapidement.",
    defaultDisplay: 'toast',
    duration: 3500,
  },
  QUOTE_SENT: {
    title: 'Devis envoyé',
    message: 'Le client a été notifié.',
    defaultDisplay: 'toast',
    duration: 3000,
  },
  QUOTE_ACCEPTED: {
    title: 'Devis accepté',
    message: "Un rendez-vous a été créé. L'artisan en a été informé.",
    defaultDisplay: 'modal',
  },
  QUOTE_REFUSED: {
    title: 'Devis refusé',
    defaultDisplay: 'toast',
    duration: 2500,
  },
  REVIEW_SUBMITTED: {
    title: 'Avis publié',
    message: 'Merci pour votre retour !',
    defaultDisplay: 'toast',
    duration: 3000,
  },
  MESSAGE_SENT: {
    title: 'Message envoyé',
    defaultDisplay: 'toast',
    duration: 1500,
  },
}
