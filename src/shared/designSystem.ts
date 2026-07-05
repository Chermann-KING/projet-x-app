/**
 * Design System — source de vérité unique.
 * Toutes les valeurs statiques (non colorées) viennent d'ici.
 * Les couleurs sont dans useTheme (elles varient avec light/dark).
 *
 * Référence Figma : docs/figma/screenshots/01-config-system/
 */
import type { TextStyle } from 'react-native'

// ── Polices ────────────────────────────────────────────────────────────────────
export const font = {
  /** Titres H1 (700) */
  display: 'BricolageGrotesque-Bold',
  /** Titres H2, H3 (600) */
  displayMid: 'BricolageGrotesque',
  /** Corps de texte, labels, captions (variable : 400/500/700 via fontWeight) */
  body: 'NunitoSans',
} as const

// ── Échelle typographique — Figma 02-typographie ──────────────────────────────
// H1 28/700  H2 22/600  H3 18/600  Body 15/400  Label 13/500  Caption 12/400
export const text = {
  h1: {
    fontFamily: font.display,
    fontSize: 28,
    lineHeight: 36,
  } satisfies TextStyle,
  h2: {
    fontFamily: font.displayMid,
    fontSize: 22,
    lineHeight: 28,
  } satisfies TextStyle,
  h3: {
    fontFamily: font.displayMid,
    fontSize: 18,
    lineHeight: 24,
  } satisfies TextStyle,
  body: {
    fontFamily: font.body,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,
  label: {
    fontFamily: font.body,
    fontWeight: '500' as TextStyle['fontWeight'],
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  caption: {
    fontFamily: font.body,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontSize: 12,
    lineHeight: 16,
  } satisfies TextStyle,
  /** Boutons CTA */
  button: {
    fontFamily: font.body,
    fontWeight: '700' as TextStyle['fontWeight'],
    fontSize: 15,
  } satisfies TextStyle,
  /** Label de champ de formulaire */
  inputLabel: {
    fontFamily: font.body,
    fontWeight: '500' as TextStyle['fontWeight'],
    fontSize: 14,
  } satisfies TextStyle,
  /** Texte dans un champ de formulaire */
  inputText: {
    fontFamily: font.body,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontSize: 15,
  } satisfies TextStyle,
} as const

// ── Espacement — grille 4px (Figma 03-grille-espacement) ──────────────────────
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
} as const

// ── Border radius — Figma 03-grille-espacement ────────────────────────────────
// Radius carte 14px · Radius btn 12px · Radius badge 100px
export const radius = {
  sm: 8,
  input: 12,
  button: 12,
  card: 14,
  xl: 20,
  avatar: 9999,
  badge: 100,
} as const

// ── Tailles de composants — Figma 03-grille-espacement ───────────────────────
// Input 52px · Bouton 48px · Header 56px · Tab bar 80px · Padding H 16px
export const size = {
  paddingH: 16,
  header: 56,
  tabBar: 80,
  button: 48,
  input: 52,
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
  },
  avatar: {
    sm: 40,
    md: 48,
    lg: 56,
  },
  indicator: 11,
} as const

// ── Ombres ────────────────────────────────────────────────────────────────────
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toast: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const

/** Alias court pour l'import — usage: `import { ds } from '@/shared/designSystem'` */
export const ds = { font, text, space, radius, size, shadow } as const
