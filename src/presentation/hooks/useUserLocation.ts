import * as Location from 'expo-location'
import { useCallback, useEffect, useState } from 'react'

export interface UserLocation {
  lat: number
  lng: number
  /** true = GPS ou réseau obtenu, false = fallback Libreville */
  granted: boolean
  /** Ville et pays obtenus par reverse geocoding (ex: "Bruxelles, Belgique") */
  city?: string
}

/** Fallback absolu si aucune source (GPS, réseau, cache) ne répond */
const LIBREVILLE_FALLBACK: UserLocation = {
  lat: 0.3924,
  lng: 9.4536,
  granted: false,
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string | undefined> {
  try {
    const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude })
    if (!geo) return undefined
    const parts = [geo.city ?? geo.subregion ?? geo.region, geo.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : undefined
  } catch {
    return undefined
  }
}

export function useUserLocation(): { location: UserLocation; isLocating: boolean } {
  const [location, setLocation] = useState<UserLocation>(LIBREVILLE_FALLBACK)
  const [isLocating, setIsLocating] = useState(true)

  const locate = useCallback(async (): Promise<void> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== Location.PermissionStatus.GRANTED) {
        const last = await Location.getLastKnownPositionAsync()
        if (last) {
          setLocation({ lat: last.coords.latitude, lng: last.coords.longitude, granted: false })
        }
        return
      }

      let coords: { latitude: number; longitude: number }
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        coords = pos.coords
      } catch {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest })
        coords = pos.coords
      }

      const city = await reverseGeocode(coords.latitude, coords.longitude)
      setLocation({ lat: coords.latitude, lng: coords.longitude, granted: true, ...(city !== undefined && { city }) })
    } catch {
      // Fallback absolu : centre Libreville
    } finally {
      setIsLocating(false)
    }
  }, [])

  useEffect(() => {
    void locate()
  }, [locate])

  return { location, isLocating }
}
