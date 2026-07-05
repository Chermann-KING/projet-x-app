import type { IArtisanRepository, ArtisanSearchFilters } from '@/domain/repositories/IArtisanRepository'
import type { Artisan } from '@/domain/entities/Artisan'

export type ArtisanSearchResult = Artisan & { distanceKm?: number | undefined }

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Minuscules + suppression des accents pour comparaison tolerante */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function matchesQuery(artisan: Artisan, query: string): boolean {
  const q = normalize(query.trim())
  if (!q) return true
  return (
    normalize(artisan.fullName).includes(q) ||
    normalize(artisan.metier).includes(q) ||
    normalize(artisan.zoneGeographique ?? '').includes(q) ||
    artisan.competences.some((c) => normalize(c).includes(q))
  )
}

export class SearchArtisansUseCase {
  constructor(private readonly artisanRepository: IArtisanRepository) {}

  async execute(filters: ArtisanSearchFilters): Promise<ArtisanSearchResult[]> {
    const artisans = await this.artisanRepository.search(filters)

    const withoutSelf = filters.excludeUserId
      ? artisans.filter((a) => a.userId !== filters.excludeUserId)
      : artisans

    // Filtrage texte multi-champs cote client (nom, metier, zone, competences)
    const queried = filters.query
      ? withoutSelf.filter((a) => matchesQuery(a, filters.query!))
      : withoutSelf

    const { lat, lng, radiusKm } = filters
    if (lat === undefined || lng === undefined) return queried

    return queried
      .map((a) => ({
        a,
        dist:
          a.lat !== undefined && a.lng !== undefined
            ? haversineKm(lat, lng, a.lat, a.lng)
            : Infinity,
      }))
      .filter(({ dist }) => radiusKm === undefined || dist <= radiusKm)
      .sort((x, y) => x.dist - y.dist)
      .map(({ a, dist }) => ({ ...a, distanceKm: Number.isFinite(dist) ? dist : undefined }))
  }
}
