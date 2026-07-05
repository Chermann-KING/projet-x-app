/**
 * Devise officielle légale pour chaque pays couvert par l'application.
 * Sources : ISO 4217, Banque Mondiale, banques centrales.
 * Couvre les 54 pays africains + 9 pays Europe/Canada inclus dans PhoneConstants.
 */

export interface CurrencyInfo {
  readonly code: string
  readonly symbol: string
  readonly symbolPosition: 'before' | 'after'
  /** Décimales significatives : 0 = FCFA, 2 = EUR/USD, 3 = DT (dinars) */
  readonly decimals: 0 | 2 | 3
  /** Séparateur de milliers */
  readonly thousandsSep: string
  /** Séparateur décimal */
  readonly decimalSep: string
}

// ─── Utilitaire de formatage ───────────────────────────────────────────────
export function formatCurrency(amount: number, info: CurrencyInfo): string {
  const fixed = amount.toFixed(info.decimals)
  const [intPart, decPart] = fixed.split('.')
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, info.thousandsSep)
  const number =
    info.decimals > 0 ? `${formattedInt}${info.decimalSep}${decPart}` : formattedInt
  return info.symbolPosition === 'before'
    ? `${info.symbol}${number}`
    : `${number} ${info.symbol}`
}

// ─── Définitions des devises ───────────────────────────────────────────────

// Franc CFA — CEMAC (Gabon, Cameroun, Congo, RCA, Tchad, Guinée éq.)
const XAF: CurrencyInfo = {
  code: 'XAF', symbol: 'FCFA', symbolPosition: 'after',
  decimals: 0, thousandsSep: ' ', decimalSep: ',',
}

// Franc CFA — UEMOA (Sénégal, CI, Bénin, Mali, Burkina, Guinée-Bissau, Niger, Togo)
const XOF: CurrencyInfo = {
  code: 'XOF', symbol: 'FCFA', symbolPosition: 'after',
  decimals: 0, thousandsSep: ' ', decimalSep: ',',
}

// Euro — Zone euro (FR, BE, ES, IT, PT, LU, DE)
const EUR: CurrencyInfo = {
  code: 'EUR', symbol: '€', symbolPosition: 'after',
  decimals: 2, thousandsSep: ' ', decimalSep: ',',
}

// Franc suisse
const CHF: CurrencyInfo = {
  code: 'CHF', symbol: 'CHF', symbolPosition: 'after',
  decimals: 2, thousandsSep: ' ', decimalSep: '.',
}

// Dollar canadien
const CAD: CurrencyInfo = {
  code: 'CAD', symbol: 'CA$', symbolPosition: 'before',
  decimals: 2, thousandsSep: ' ', decimalSep: ',',
}

// ─── Devises africaines individuelles ─────────────────────────────────────

const ZAR: CurrencyInfo = {
  code: 'ZAR', symbol: 'R', symbolPosition: 'before',
  decimals: 2, thousandsSep: ' ', decimalSep: ',',
}
const DZD: CurrencyInfo = {
  code: 'DZD', symbol: 'DA', symbolPosition: 'after',
  decimals: 2, thousandsSep: ' ', decimalSep: ',',
}
const AOA: CurrencyInfo = {
  code: 'AOA', symbol: 'Kz', symbolPosition: 'after',
  decimals: 2, thousandsSep: ' ', decimalSep: ',',
}
const BWP: CurrencyInfo = {
  code: 'BWP', symbol: 'P', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const BIF: CurrencyInfo = {
  code: 'BIF', symbol: 'Fr', symbolPosition: 'after',
  decimals: 0, thousandsSep: ' ', decimalSep: ',',
}
const CVE: CurrencyInfo = {
  code: 'CVE', symbol: '$', symbolPosition: 'after',
  decimals: 2, thousandsSep: ' ', decimalSep: ',',
}
const KMF: CurrencyInfo = {
  code: 'KMF', symbol: 'Fr', symbolPosition: 'after',
  decimals: 0, thousandsSep: ' ', decimalSep: ',',
}
const CDF: CurrencyInfo = {
  code: 'CDF', symbol: 'FC', symbolPosition: 'after',
  decimals: 2, thousandsSep: ' ', decimalSep: ',',
}
const DJF: CurrencyInfo = {
  code: 'DJF', symbol: 'Fdj', symbolPosition: 'after',
  decimals: 0, thousandsSep: ' ', decimalSep: ',',
}
const EGP: CurrencyInfo = {
  code: 'EGP', symbol: '£', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const ERN: CurrencyInfo = {
  code: 'ERN', symbol: 'Nfk', symbolPosition: 'after',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const SZL: CurrencyInfo = {
  code: 'SZL', symbol: 'L', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const ETB: CurrencyInfo = {
  code: 'ETB', symbol: 'Br', symbolPosition: 'after',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const GMD: CurrencyInfo = {
  code: 'GMD', symbol: 'D', symbolPosition: 'after',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const GHS: CurrencyInfo = {
  code: 'GHS', symbol: '₵', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const GNF: CurrencyInfo = {
  code: 'GNF', symbol: 'Fr', symbolPosition: 'after',
  decimals: 0, thousandsSep: ' ', decimalSep: ',',
}
const KES: CurrencyInfo = {
  code: 'KES', symbol: 'KSh', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const LSL: CurrencyInfo = {
  code: 'LSL', symbol: 'L', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const LRD: CurrencyInfo = {
  code: 'LRD', symbol: 'L$', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
// Dinar libyen : 3 décimales (fils)
const LYD: CurrencyInfo = {
  code: 'LYD', symbol: 'LD', symbolPosition: 'before',
  decimals: 3, thousandsSep: ',', decimalSep: '.',
}
const MGA: CurrencyInfo = {
  code: 'MGA', symbol: 'Ar', symbolPosition: 'after',
  decimals: 0, thousandsSep: ' ', decimalSep: ',',
}
const MWK: CurrencyInfo = {
  code: 'MWK', symbol: 'MK', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const MAD: CurrencyInfo = {
  code: 'MAD', symbol: 'MAD', symbolPosition: 'after',
  decimals: 2, thousandsSep: ' ', decimalSep: ',',
}
const MUR: CurrencyInfo = {
  code: 'MUR', symbol: '₨', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const MRU: CurrencyInfo = {
  code: 'MRU', symbol: 'UM', symbolPosition: 'after',
  decimals: 2, thousandsSep: ' ', decimalSep: '.',
}
const MZN: CurrencyInfo = {
  code: 'MZN', symbol: 'MT', symbolPosition: 'after',
  decimals: 2, thousandsSep: '.', decimalSep: ',',
}
const NAD: CurrencyInfo = {
  code: 'NAD', symbol: 'N$', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const NGN: CurrencyInfo = {
  code: 'NGN', symbol: '₦', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const UGX: CurrencyInfo = {
  code: 'UGX', symbol: 'USh', symbolPosition: 'before',
  decimals: 0, thousandsSep: ',', decimalSep: '.',
}
const RWF: CurrencyInfo = {
  code: 'RWF', symbol: 'Fr', symbolPosition: 'after',
  decimals: 0, thousandsSep: ' ', decimalSep: ',',
}
const STN: CurrencyInfo = {
  code: 'STN', symbol: 'Db', symbolPosition: 'after',
  decimals: 2, thousandsSep: ' ', decimalSep: ',',
}
const SCR: CurrencyInfo = {
  code: 'SCR', symbol: '₨', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
// Nouveau leone (depuis 2022, remplace SLL)
const SLE: CurrencyInfo = {
  code: 'SLE', symbol: 'Le', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const SOS: CurrencyInfo = {
  code: 'SOS', symbol: 'Sh', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const SDG: CurrencyInfo = {
  code: 'SDG', symbol: 'SD£', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const SSP: CurrencyInfo = {
  code: 'SSP', symbol: 'SSP', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
const TZS: CurrencyInfo = {
  code: 'TZS', symbol: 'TSh', symbolPosition: 'before',
  decimals: 0, thousandsSep: ',', decimalSep: '.',
}
// Dinar tunisien : 3 décimales (millimes), point pour milliers
const TND: CurrencyInfo = {
  code: 'TND', symbol: 'DT', symbolPosition: 'after',
  decimals: 3, thousandsSep: '.', decimalSep: ',',
}
const ZMW: CurrencyInfo = {
  code: 'ZMW', symbol: 'K', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}
// Zimbabwe Gold (ZiG) — devise officielle légale depuis avril 2024
const ZWG: CurrencyInfo = {
  code: 'ZWG', symbol: 'ZiG', symbolPosition: 'before',
  decimals: 2, thousandsSep: ',', decimalSep: '.',
}

// ─── Table ISO → CurrencyInfo ──────────────────────────────────────────────
export const CURRENCY_BY_ISO: Readonly<Record<string, CurrencyInfo>> = {
  // ── Gabon (par défaut) ────────────────────────────────────────────────
  GA: XAF,

  // ── CEMAC ─────────────────────────────────────────────────────────────
  CM: XAF, CG: XAF, CF: XAF, TD: XAF, GQ: XAF,

  // ── UEMOA ─────────────────────────────────────────────────────────────
  BJ: XOF, BF: XOF, CI: XOF, GW: XOF, ML: XOF, NE: XOF, SN: XOF, TG: XOF,

  // ── Zone euro ─────────────────────────────────────────────────────────
  DE: EUR, BE: EUR, ES: EUR, FR: EUR, IT: EUR, LU: EUR, PT: EUR,

  // ── Autres Europe/Canada ──────────────────────────────────────────────
  CH: CHF,
  CA: CAD,

  // ── Devises africaines individuelles ──────────────────────────────────
  ZA: ZAR,
  DZ: DZD,
  AO: AOA,
  BW: BWP,
  BI: BIF,
  CV: CVE,
  KM: KMF,
  CD: CDF,
  DJ: DJF,
  EG: EGP,
  ER: ERN,
  SZ: SZL,
  ET: ETB,
  GM: GMD,
  GH: GHS,
  GN: GNF,
  KE: KES,
  LS: LSL,
  LR: LRD,
  LY: LYD,
  MG: MGA,
  MW: MWK,
  MA: MAD,
  MU: MUR,
  MR: MRU,
  MZ: MZN,
  NA: NAD,
  NG: NGN,
  UG: UGX,
  RW: RWF,
  ST: STN,
  SC: SCR,
  SL: SLE,
  SO: SOS,
  SD: SDG,
  SS: SSP,
  TZ: TZS,
  TN: TND,
  ZM: ZMW,
  ZW: ZWG,
} as const

export const DEFAULT_CURRENCY = CURRENCY_BY_ISO['GA'] as CurrencyInfo

export function getCurrencyByIso(iso: string): CurrencyInfo {
  return CURRENCY_BY_ISO[iso] ?? DEFAULT_CURRENCY
}
