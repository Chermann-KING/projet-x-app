export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'AppError'
    // Maintient la stack trace correcte en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

export class AuthError extends AppError {
  constructor(code: string, message: string) {
    super(message, code)
    this.name = 'AuthError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} introuvable : ${id}`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("Action non autorisée", 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Données invalides') {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NetworkError extends AppError {
  constructor() {
    super('Vérifiez votre connexion internet', 'NETWORK_UNAVAILABLE')
    this.name = 'NetworkError'
  }
}

export class StorageUploadError extends AppError {
  constructor() {
    super("Erreur lors de l'envoi du fichier", 'STORAGE_UPLOAD_ERROR')
    this.name = 'StorageUploadError'
  }
}
