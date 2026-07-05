export const METIERS = [
  'plombier',
  'electricien',
  'peintre',
  'maçon',
  'menuisier',
  'carreleur',
  'jardinier',
  'climatisation',
  'soudeur',
  'couvreur',
  'serrurier',
  'vitrier',
] as const

export type Metier = (typeof METIERS)[number]

export const METIER_LABELS: Record<Metier, string> = {
  plombier: 'Plombier',
  electricien: 'Électricien',
  peintre: 'Peintre',
  maçon: 'Maçon',
  menuisier: 'Menuisier',
  carreleur: 'Carreleur',
  jardinier: 'Jardinier',
  climatisation: 'Climatisation',
  soudeur: 'Soudeur',
  couvreur: 'Couvreur',
  serrurier: 'Serrurier',
  vitrier: 'Vitrier',
}

export const METIER_ICONS: Record<Metier, string> = {
  plombier: 'Droplets',
  electricien: 'Zap',
  peintre: 'Paintbrush',
  maçon: 'Hammer',
  menuisier: 'Drill',
  carreleur: 'LayoutGrid',
  jardinier: 'Leaf',
  climatisation: 'Wind',
  soudeur: 'Flame',
  couvreur: 'Home',
  serrurier: 'Lock',
  vitrier: 'Layers',
}
