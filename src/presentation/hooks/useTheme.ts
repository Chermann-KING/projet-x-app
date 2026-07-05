/**
 * useTheme — source de vérité pour les COULEURS uniquement.
 * Palette Figma (01-palette.png) convertie de oklch → hex pour React Native.
 * React Native ne supporte pas oklch() nativement (@react-native/normalize-colors).
 * Les tokens statiques (spacing, radius, sizes, typography) sont dans designSystem.ts.
 */
import { useColorScheme } from 'react-native'

const light = {
  // ── Arrière-plans ──────────────────────────────────────────────────────────
  background:           '#FAFAF9', // oklch(0.985 0 180)
  surface:              '#FFFFFF', // oklch(1 0 180)
  muted:                '#F0F0EF', // oklch(0.955 0 180)

  // ── Texte ──────────────────────────────────────────────────────────────────
  foreground:           '#333333', // oklch(0.321 0 180)
  mutedForeground:      '#696968', // oklch(0.52 0 180)

  // ── Contours ───────────────────────────────────────────────────────────────
  border:               '#E5E5E4', // oklch(0.923 0 164)

  // ── Couleur principale (terracotta/cuivre) ─────────────────────────────────
  primary:              '#860101', // oklch(0.39 0.159 29)
  primaryLight:         '#FF3837', // oklch(0.653 0.233 26.6)
  primaryDark:          '#590000', // oklch(0.28 0.13 29)
  primaryForeground:    '#FFFFFF', // oklch(1 0 180)

  // ── Ambre doré ─────────────────────────────────────────────────────────────
  secondary:            '#FFC100', // oklch(0.844 0.172 84.9)
  secondaryForeground:  '#121211', // oklch(0.18 0 0)

  // ── Lien, CTA secondaire ───────────────────────────────────────────────────
  accent:               '#FF3837', // oklch(0.653 0.233 26.6) = primaryLight

  // ── Feedback ───────────────────────────────────────────────────────────────
  success:              '#008B1B', // oklch(0.55 0.18 145)
  successForeground:    '#FFFFFF', // oklch(1 0 180)
  successMuted:         '#D6FAD5', // oklch(0.95 0.06 145)

  warning:              '#E89D00', // oklch(0.75 0.16 75)
  warningForeground:    '#0B0B0B', // oklch(0.15 0 0)
  warningMuted:         '#FFEECC', // oklch(0.96 0.05 75)

  error:                '#D40923', // oklch(0.55 0.22 25)
  errorForeground:      '#FFFFFF', // oklch(1 0 180)
  errorMuted:           '#FFE8E3', // oklch(0.96 0.04 25)

  // ── Alias ──────────────────────────────────────────────────────────────────
  get input()       { return this.surface },
  get card()        { return this.surface },
  get destructive() { return this.error },
}

const dark = {
  background:           '#090909', // oklch(0.14 0 180)
  surface:              '#181818', // oklch(0.21 0 180)
  muted:                '#262626', // oklch(0.27 0 180)

  foreground:           '#EEEEED', // oklch(0.95 0 180)
  mutedForeground:      '#80807F', // oklch(0.60 0 180)

  border:               '#353535', // oklch(0.33 0 180)

  primary:              '#BC4336', // oklch(0.55 0.159 29)
  primaryLight:         '#FA695B', // oklch(0.70 0.18 28)
  primaryDark:          '#860101', // oklch(0.39 0.159 29)
  primaryForeground:    '#FFFFFF', // oklch(1 0 180)

  secondary:            '#FFC100', // oklch(0.844 0.172 84.9)
  secondaryForeground:  '#0B0B0B', // oklch(0.15 0 0)

  accent:               '#FA695B', // oklch(0.70 0.18 28) = primaryLight dark

  success:              '#008B1B', // oklch(0.55 0.18 145)
  successForeground:    '#FFFFFF', // oklch(1 0 180)
  successMuted:         '#002300', // oklch(0.22 0.08 145)

  warning:              '#E89D00', // oklch(0.75 0.16 75)
  warningForeground:    '#0B0B0B', // oklch(0.15 0 0)
  warningMuted:         '#321800', // oklch(0.24 0.07 75)

  error:                '#D40923', // oklch(0.55 0.22 25)
  errorForeground:      '#FFFFFF', // oklch(1 0 180)
  errorMuted:           '#370B0B', // oklch(0.23 0.07 25)

  get input()       { return this.surface },
  get card()        { return this.surface },
  get destructive() { return this.error },
}

export type Theme = typeof light

export const useTheme = (): Theme => {
  const scheme = useColorScheme()
  return scheme === 'dark' ? dark : light
}
