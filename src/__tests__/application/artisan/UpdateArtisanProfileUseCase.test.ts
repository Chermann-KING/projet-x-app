import { UpdateArtisanProfileUseCase } from '@/application/artisan/UpdateArtisanProfileUseCase'
import { ValidationError } from '@/shared/errors'
import type { IArtisanRepository } from '@/domain/repositories/IArtisanRepository'
import type { Artisan } from '@/domain/entities/Artisan'

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const BASE_ARTISAN: Artisan = {
  id: 'a1',
  userId: 'u1',
  fullName: 'Jean Dupont',
  metier: 'plombier',
  competences: [],
  zoneGeographique: 'Paris',
  tarifIndicatif: 50,
  tarifUnit: 'heure',
  bio: '',
  isVerified: false,
  verificationStatus: 'pending',
  averageRating: 0,
  reviewCount: 0,
  photos: [],
  subscriptionPlan: 'free',
  phone: '+33612345678',
  createdAt: new Date(),
}

interface RepoFixture {
  repo: IArtisanRepository
  update: jest.Mock
}

function makeRepo(overrides: Partial<Artisan> = {}): RepoFixture {
  const updated = { ...BASE_ARTISAN, ...overrides }
  const update = jest.fn().mockResolvedValue(updated)
  const repo: IArtisanRepository = {
    findById: jest.fn(),
    findByIds: jest.fn(),
    findByUserId: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update,
    updateVerificationStatus: jest.fn(),
    findPendingVerification: jest.fn(),
    findAll: jest.fn(),
    addPhoto: jest.fn(),
    deletePhoto: jest.fn(),
  }
  return { repo, update }
}

function lastPatch(update: jest.Mock): Partial<Artisan> {
  const [, patch] = update.mock.calls[0] as [string, Partial<Artisan>]
  return patch
}

// ---------------------------------------------------------------------------
// Aucun champ fourni
// ---------------------------------------------------------------------------

describe('execute — aucun champ', () => {
  it('lève ValidationError si aucun champ n\'est fourni', async () => {
    const { repo, update } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await expect(useCase.execute({ artisanId: 'a1' })).rejects.toThrow(ValidationError)
    expect(update).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// fullName
// ---------------------------------------------------------------------------

describe('fullName', () => {
  it('met à jour fullName sanitisé', async () => {
    const { repo, update } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await useCase.execute({ artisanId: 'a1', fullName: '  Marie Curie  ' })
    expect(update).toHaveBeenCalledWith('a1', expect.objectContaining({ fullName: 'Marie Curie' }))
  })

  it('lève ValidationError si fullName est vide après sanitisation', async () => {
    const { repo } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await expect(useCase.execute({ artisanId: 'a1', fullName: '   ' })).rejects.toThrow(ValidationError)
  })

  it('tronque fullName à 100 caractères', async () => {
    const { repo, update } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    const long = 'A'.repeat(120)
    await useCase.execute({ artisanId: 'a1', fullName: long })
    const patch = lastPatch(update)
    expect(patch.fullName?.length).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// phone
// ---------------------------------------------------------------------------

describe('phone', () => {
  it('accepte un numéro E.164 valide', async () => {
    const { repo, update } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await useCase.execute({ artisanId: 'a1', phone: '+32471234567' })
    expect(update).toHaveBeenCalledWith('a1', expect.objectContaining({ phone: '+32471234567' }))
  })

  it('lève ValidationError pour un numéro sans +', async () => {
    const { repo } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await expect(useCase.execute({ artisanId: 'a1', phone: '0612345678' })).rejects.toThrow(ValidationError)
  })

  it('lève ValidationError pour un numéro commençant par +0', async () => {
    const { repo } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await expect(useCase.execute({ artisanId: 'a1', phone: '+0123456789' })).rejects.toThrow(ValidationError)
  })
})

// ---------------------------------------------------------------------------
// zoneGeographique
// ---------------------------------------------------------------------------

describe('zoneGeographique', () => {
  it('met à jour la zone sanitisée', async () => {
    const { repo, update } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await useCase.execute({ artisanId: 'a1', zoneGeographique: ' Libreville ' })
    expect(update).toHaveBeenCalledWith('a1', expect.objectContaining({ zoneGeographique: 'Libreville' }))
  })

  it('lève ValidationError si la zone est vide après sanitisation', async () => {
    const { repo } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await expect(useCase.execute({ artisanId: 'a1', zoneGeographique: '  ' })).rejects.toThrow(ValidationError)
  })
})

// ---------------------------------------------------------------------------
// tarifIndicatif
// ---------------------------------------------------------------------------

describe('tarifIndicatif', () => {
  it('accepte 0 (service gratuit)', async () => {
    const { repo, update } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await useCase.execute({ artisanId: 'a1', tarifIndicatif: 0 })
    expect(update).toHaveBeenCalledWith('a1', expect.objectContaining({ tarifIndicatif: 0 }))
  })

  it('accepte un tarif positif', async () => {
    const { repo, update } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await useCase.execute({ artisanId: 'a1', tarifIndicatif: 75 })
    expect(update).toHaveBeenCalledWith('a1', expect.objectContaining({ tarifIndicatif: 75 }))
  })

  it('lève ValidationError pour un tarif négatif', async () => {
    const { repo } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await expect(useCase.execute({ artisanId: 'a1', tarifIndicatif: -10 })).rejects.toThrow(ValidationError)
  })

  it('lève ValidationError pour NaN', async () => {
    const { repo } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await expect(useCase.execute({ artisanId: 'a1', tarifIndicatif: NaN })).rejects.toThrow(ValidationError)
  })
})

// ---------------------------------------------------------------------------
// bio
// ---------------------------------------------------------------------------

describe('bio', () => {
  it('accepte une bio vide (effacement)', async () => {
    const { repo, update } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await useCase.execute({ artisanId: 'a1', bio: '' })
    expect(update).toHaveBeenCalledWith('a1', expect.objectContaining({ bio: '' }))
  })

  it('tronque la bio à 500 caractères', async () => {
    const { repo, update } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await useCase.execute({ artisanId: 'a1', bio: 'X'.repeat(600) })
    const patch = lastPatch(update)
    expect(patch.bio?.length).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// Mise à jour partielle — seuls les champs fournis sont envoyés
// ---------------------------------------------------------------------------

describe('granularité du PATCH', () => {
  it('n\'envoie que le champ bio quand seul bio est fourni', async () => {
    const { repo, update } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await useCase.execute({ artisanId: 'a1', bio: 'Disponible le week-end' })
    const patch = lastPatch(update)
    expect(Object.keys(patch)).toEqual(['bio'])
  })

  it('envoie plusieurs champs si plusieurs sont fournis', async () => {
    const { repo, update } = makeRepo()
    const useCase = new UpdateArtisanProfileUseCase(repo)
    await useCase.execute({ artisanId: 'a1', fullName: 'Paul Martin', tarifUnit: 'jour' })
    const patch = lastPatch(update)
    expect(patch).toEqual(expect.objectContaining({ fullName: 'Paul Martin', tarifUnit: 'jour' }))
    expect(patch).not.toHaveProperty('bio')
    expect(patch).not.toHaveProperty('phone')
  })
})
