import { create } from 'zustand'
import type { Metier } from '@/shared/constants/metiers'
import type { TarifUnit } from '@/domain/entities/Artisan'

export type { TarifUnit }

export interface OnboardingPhoto {
  uri: string
  width: number
  height: number
}

interface OnboardingData {
  fullName: string
  phone: string
  phoneCountryIso: string
  zoneGeographique: string
  lat?: number
  lng?: number
  metier?: Metier
  competences: string[]
  tarifIndicatif?: number
  tarifUnit: TarifUnit
  photos: OnboardingPhoto[]
}

interface OnboardingStore extends OnboardingData {
  setStep1: (data: {
    fullName: string
    phone: string
    phoneCountryIso: string
    zoneGeographique: string
    lat?: number
    lng?: number
  }) => void
  setStep2: (data: {
    metier: Metier
    competences: string[]
    tarifIndicatif?: number
    tarifUnit: TarifUnit
  }) => void
  addPhoto: (photo: OnboardingPhoto) => void
  removePhoto: (uri: string) => void
  reset: () => void
}

const INITIAL: OnboardingData = {
  fullName: '',
  phone: '',
  phoneCountryIso: '',
  zoneGeographique: '',
  competences: [],
  tarifUnit: 'heure',
  photos: [],
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...INITIAL,

  setStep1: (data) => set((s) => ({ ...s, ...data })),

  setStep2: (data) => set((s) => ({ ...s, ...data })),

  addPhoto: (photo) =>
    set((s) => ({ photos: [...s.photos, photo] })),

  removePhoto: (uri) =>
    set((s) => ({ photos: s.photos.filter((p) => p.uri !== uri) })),

  reset: () => set(INITIAL),
}))
