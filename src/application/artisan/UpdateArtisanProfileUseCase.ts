import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { Artisan, TarifUnit } from '@/domain/entities/Artisan'
import { sanitizeText } from '@/shared/utils/sanitize'
import { ValidationError } from '@/shared/errors'

const MAX_FULL_NAME = 100
const MAX_PHONE = 20
const MAX_ZONE = 200
const MAX_BIO = 500

// E.164 : + suivi de 1-15 chiffres (hors code pays nul)
const PHONE_E164 = /^\+[1-9]\d{1,14}$/

// Capitalise la première lettre de chaque mot (séparateurs : espace et tiret)
function toTitleCase(text: string): string {
  return text.replace(/(^|[\s-])(\S)/gu, (_: string, sep: string, char: string) => sep + char.toUpperCase())
}

export interface UpdateArtisanProfileInput {
  artisanId: string
  fullName?: string
  phone?: string
  zoneGeographique?: string
  tarifIndicatif?: number
  tarifUnit?: TarifUnit
  bio?: string
  competences?: string[]
}

export class UpdateArtisanProfileUseCase {
  constructor(private readonly artisanRepository: IArtisanRepository) {}

  async execute(input: UpdateArtisanProfileInput): Promise<Artisan> {
    const updates = this.buildUpdates(input)

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('Aucun champ à mettre à jour')
    }

    return this.artisanRepository.update(input.artisanId, updates)
  }

  private buildUpdates(input: UpdateArtisanProfileInput): Partial<Artisan> {
    const updates: Partial<Artisan> = {}

    if (input.fullName !== undefined) {
      const fullName = sanitizeText(input.fullName, MAX_FULL_NAME)
      if (fullName.length === 0) throw new ValidationError('Le nom ne peut pas être vide')
      updates.fullName = fullName
    }

    if (input.phone !== undefined) {
      const phone = sanitizeText(input.phone, MAX_PHONE)
      if (!PHONE_E164.test(phone)) throw new ValidationError('Format de téléphone invalide (E.164 attendu)')
      updates.phone = phone
    }

    if (input.zoneGeographique !== undefined) {
      const zone = toTitleCase(sanitizeText(input.zoneGeographique, MAX_ZONE))
      if (zone.length === 0) throw new ValidationError('La zone géographique ne peut pas être vide')
      updates.zoneGeographique = zone
    }

    if (input.tarifIndicatif !== undefined) {
      if (!Number.isFinite(input.tarifIndicatif) || input.tarifIndicatif < 0) {
        throw new ValidationError('Le tarif doit être un nombre positif')
      }
      updates.tarifIndicatif = input.tarifIndicatif
    }

    if (input.tarifUnit !== undefined) {
      updates.tarifUnit = input.tarifUnit
    }

    if (input.bio !== undefined) {
      // Permet la bio vide (l'artisan peut effacer sa description)
      updates.bio = sanitizeText(input.bio, MAX_BIO)
    }

    if (input.competences !== undefined) {
      updates.competences = input.competences
    }

    return updates
  }
}
