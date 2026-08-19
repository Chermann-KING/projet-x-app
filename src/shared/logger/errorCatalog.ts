import type { NotificationDisplay } from './IAppLogger'

export type ErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_SESSION_EXPIRED'
  | 'AUTH_EMAIL_ALREADY_USED'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_SAME_PASSWORD'
  | 'AUTH_UPDATE_PASSWORD_FAILED'
  | 'ARTISAN_NOT_FOUND'
  | 'ARTISAN_PROFILE_INCOMPLETE'
  | 'ARTISAN_PENDING_VALIDATION'
  | 'QUOTE_NOT_FOUND'
  | 'QUOTE_INVALID_STATUS'
  | 'QUOTE_ALREADY_ACCEPTED'
  | 'MESSAGE_SEND_FAILED'
  | 'NETWORK_UNAVAILABLE'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR'

interface ErrorEntry {
  title: string
  message: string
  defaultDisplay: NotificationDisplay
}

export const ERROR_CATALOG: Record<ErrorCode, ErrorEntry> = {
  AUTH_INVALID_CREDENTIALS: {
    title: 'Identifiants incorrects',
    message: 'Email ou mot de passe invalide. Vérifiez vos informations.',
    defaultDisplay: 'popup',
  },
  AUTH_SESSION_EXPIRED: {
    title: 'Session expirée',
    message: 'Votre session a expiré. Veuillez vous reconnecter.',
    defaultDisplay: 'modal',
  },
  AUTH_EMAIL_ALREADY_USED: {
    title: 'Email déjà utilisé',
    message: 'Un compte existe déjà avec cette adresse email.',
    defaultDisplay: 'popup',
  },
  AUTH_UNAUTHORIZED: {
    title: 'Accès refusé',
    message: "Vous n'êtes pas autorisé à effectuer cette action.",
    defaultDisplay: 'toast',
  },
  AUTH_SAME_PASSWORD: {
    title: 'Mot de passe inchangé',
    message: "Le nouveau mot de passe doit être différent de l'ancien.",
    defaultDisplay: 'popup',
  },
  AUTH_UPDATE_PASSWORD_FAILED: {
    title: 'Échec de la mise à jour',
    message: "Impossible de mettre à jour le mot de passe. Réessayez.",
    defaultDisplay: 'toast',
  },
  ARTISAN_NOT_FOUND: {
    title: 'Artisan introuvable',
    message: "Ce profil n'existe pas ou a été supprimé.",
    defaultDisplay: 'toast',
  },
  ARTISAN_PROFILE_INCOMPLETE: {
    title: 'Profil incomplet',
    message: 'Complétez votre profil pour continuer.',
    defaultDisplay: 'popup',
  },
  ARTISAN_PENDING_VALIDATION: {
    title: 'Profil en attente',
    message:
      "Votre profil est en cours de vérification. Vous serez notifié dès qu'il sera validé.",
    defaultDisplay: 'modal',
  },
  QUOTE_NOT_FOUND: {
    title: 'Devis introuvable',
    message: "Ce devis n'existe pas ou a été supprimé.",
    defaultDisplay: 'toast',
  },
  QUOTE_INVALID_STATUS: {
    title: 'Action impossible',
    message: 'Ce devis ne peut pas être modifié dans son état actuel.',
    defaultDisplay: 'toast',
  },
  QUOTE_ALREADY_ACCEPTED: {
    title: 'Devis déjà accepté',
    message: 'Ce devis a déjà été accepté.',
    defaultDisplay: 'toast',
  },
  MESSAGE_SEND_FAILED: {
    title: 'Message non envoyé',
    message: 'Une erreur est survenue. Réessayez.',
    defaultDisplay: 'toast',
  },
  NETWORK_UNAVAILABLE: {
    title: 'Pas de connexion',
    message: 'Vérifiez votre connexion internet et réessayez.',
    defaultDisplay: 'modal',
  },
  SERVER_ERROR: {
    title: 'Erreur serveur',
    message: "Une erreur inattendue s'est produite. Réessayez dans quelques instants.",
    defaultDisplay: 'toast',
  },
  TIMEOUT: {
    title: 'Délai dépassé',
    message: 'La requête a pris trop de temps. Vérifiez votre connexion.',
    defaultDisplay: 'toast',
  },
  VALIDATION_ERROR: {
    title: 'Formulaire invalide',
    message: 'Vérifiez les champs en rouge et réessayez.',
    defaultDisplay: 'popup',
  },
  UNKNOWN_ERROR: {
    title: 'Erreur inattendue',
    message: 'Une erreur est survenue. Si le problème persiste, contactez le support.',
    defaultDisplay: 'toast',
  },
}
