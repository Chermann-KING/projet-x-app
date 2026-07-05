interface DistanceParts {
  unit: 'km' | 'm'
  value: string
}

export function formatDistanceParts(distanceKm: number): DistanceParts {
  if (distanceKm < 1) {
    return { unit: 'm', value: String(Math.round(distanceKm * 1000)) }
  }
  return { unit: 'km', value: distanceKm.toFixed(1) }
}
