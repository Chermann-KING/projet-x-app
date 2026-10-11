/**
 * Source unique de vérité pour les formats de numéros de téléphone.
 *
 * Architecture : `groups` = taille de chaque segment de chiffres, séparés par
 * des espaces. `total` = somme des groups (calculé automatiquement).
 *
 * Convention "0-prefix" :
 *   - Quand le numéro local commence par 0 (ex: Gabon "07 12 34 56"),
 *     le 0 est INCLUS dans le total et dans les groups.
 *   - `digitsToE164` retire automatiquement ce 0 avant de le souder à
 *     l'indicatif → résultat E.164 correct.
 *
 * Gabon est en première position (sélection par défaut).
 * Les 53 autres pays africains + 9 pays supplémentaires (Europe/Canada)
 * sont triés alphabétiquement par nom français.
 */

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface PhoneFormat {
  /** Testé sur les chiffres bruts. `null` = catch-all (doit être en dernier). */
  readonly detect: RegExp | null
  readonly groups: readonly number[]
  readonly total: number
}

export interface PhoneCountry {
  readonly iso: string
  readonly dialCode: string
  readonly flag: string
  readonly name: string
  readonly formats: readonly PhoneFormat[]
  readonly placeholder: string
}

// ─── Builder ─────────────────────────────────────────────────────────────────

function f(detect: RegExp | null, groups: number[]): PhoneFormat {
  return { detect, groups, total: groups.reduce((s, n) => s + n, 0) }
}

// ─── Pays ────────────────────────────────────────────────────────────────────

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // GABON — par défaut (pilote de l'application)
  // Mobile : Airtel (07), Moov/GT (04-06), Libertis (01-03)
  // Format : 0X XX XX XX — 8 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'GA', dialCode: '+241', flag: '🇬🇦', name: 'Gabon',
    formats: [
      f(/^0[3-7]/, [2, 2, 2, 2]),
      f(null,      [2, 2, 2, 2]),
    ],
    placeholder: '07 12 34 56',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AFRIQUE DU SUD — +27
  // Mobile : Vodacom (060,072,082), MTN (083), Cell C (074,084)
  // Format : 082 XXX XXXX — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'ZA', dialCode: '+27', flag: '🇿🇦', name: 'Afrique du Sud',
    formats: [f(null, [3, 3, 4])],
    placeholder: '082 456 7890',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ALGÉRIE — +213
  // Mobile : Mobilis (06X), Djezzy (07X), Ooredoo (05X)
  // Format : 06 12 34 56 78 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'DZ', dialCode: '+213', flag: '🇩🇿', name: 'Algérie',
    formats: [f(null, [2, 2, 2, 2, 2])],
    placeholder: '06 12 34 56 78',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ALLEMAGNE — +49
  // Mobile 015x : 0151 XXXX XXXX — 12 chiffres avec 0 initial
  // Mobile 016x/017x : 0176 XXX XXXX — 11 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'DE', dialCode: '+49', flag: '🇩🇪', name: 'Allemagne',
    formats: [
      f(/^015/, [4, 4, 4]),
      f(null,   [4, 3, 4]),
    ],
    placeholder: '0176 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ANGOLA — +244
  // Mobile : Unitel (92,93,94), Movicel (91,99), Africell (95)
  // Format : 912 345 678 — 9 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'AO', dialCode: '+244', flag: '🇦🇴', name: 'Angola',
    formats: [f(null, [3, 3, 3])],
    placeholder: '912 345 678',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BELGIQUE — +32
  // Mobile : Proximus (047x), Base (048x), Orange (049x)
  // Format : 0474 12 34 56 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'BE', dialCode: '+32', flag: '🇧🇪', name: 'Belgique',
    formats: [f(null, [4, 2, 2, 2])],
    placeholder: '0474 12 34 56',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BÉNIN — +229
  // Mobile : MTN (97,96,99), Moov (95,94,91)
  // Format : XX XX XX XX — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'BJ', dialCode: '+229', flag: '🇧🇯', name: 'Bénin',
    formats: [f(null, [2, 2, 2, 2])],
    placeholder: '97 12 34 56',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BOTSWANA — +267
  // Mobile : Mascom (71,74,75,76), Orange (72), BTC (73)
  // Format : 71 234 567 — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'BW', dialCode: '+267', flag: '🇧🇼', name: 'Botswana',
    formats: [f(null, [2, 3, 3])],
    placeholder: '71 234 567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BURKINA FASO — +226
  // Mobile : Orange (05,06,07), Telecel/Moov (54-58,01-03)
  // Format : XX XX XX XX — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'BF', dialCode: '+226', flag: '🇧🇫', name: 'Burkina Faso',
    formats: [f(null, [2, 2, 2, 2])],
    placeholder: '65 12 34 56',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BURUNDI — +257
  // Mobile : Viettel (61,68,69), UCOM (71,72,76,79), Onatel (77)
  // Format : 61 23 4567 — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'BI', dialCode: '+257', flag: '🇧🇮', name: 'Burundi',
    formats: [f(null, [2, 2, 4])],
    placeholder: '61 23 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CAMEROUN — +237
  // Mobile : Orange (65-69), MTN (67,68,50-52), Camtel (22X)
  // Format : 6 90 12 34 56 — 9 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'CM', dialCode: '+237', flag: '🇨🇲', name: 'Cameroun',
    formats: [
      f(/^[5-9]/, [1, 2, 2, 2, 2]),
      f(null,     [1, 2, 2, 2, 2]),
    ],
    placeholder: '6 90 12 34 56',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CANADA — +1
  // NANP : indicatifs régionaux mixtes fixe/mobile (416 Toronto, 514 Montréal…)
  // Format : 514 123 4567 — 10 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'CA', dialCode: '+1', flag: '🇨🇦', name: 'Canada',
    formats: [f(null, [3, 3, 4])],
    placeholder: '514 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CAP-VERT — +238
  // Mobile : Unitel T+ (91,92,93), CV Móvel (58,59,95,97)
  // Format : 912 3456 — 7 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'CV', dialCode: '+238', flag: '🇨🇻', name: 'Cap-Vert',
    formats: [f(null, [3, 4])],
    placeholder: '912 3456',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CENTRAFRIQUE — +236
  // Mobile : Orange (70-77), Moov (72-75)
  // Format : XX XX XX XX — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'CF', dialCode: '+236', flag: '🇨🇫', name: 'Centrafrique',
    formats: [f(null, [2, 2, 2, 2])],
    placeholder: '72 12 34 56',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // COMORES — +269
  // Mobile : Telecom Comores (32X,33X,34X)
  // Format : 321 2345 — 7 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'KM', dialCode: '+269', flag: '🇰🇲', name: 'Comores',
    formats: [f(null, [3, 4])],
    placeholder: '321 2345',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CONGO (Brazzaville) — +242
  // Mobile : MTN (06), Airtel (04,05)
  // Format : 06 123 4567 — 9 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'CG', dialCode: '+242', flag: '🇨🇬', name: 'Congo',
    formats: [
      f(/^0[4-6]/, [2, 3, 4]),
      f(null,      [2, 3, 4]),
    ],
    placeholder: '06 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CONGO (RDC) — +243
  // Mobile : Airtel (081-085), Orange/Vodacom (08X,09X)
  // Format : 812 345 678 — 9 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'CD', dialCode: '+243', flag: '🇨🇩', name: 'Congo (RDC)',
    formats: [f(null, [3, 3, 3])],
    placeholder: '812 345 678',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CÔTE D'IVOIRE — +225
  // Mobile : Orange (07), MTN (05), Moov (01) — 10 chiffres post-réforme 2021
  // Format : 07 12 34 56 78 — 10 chiffres sans 0 initial (07 = préfixe 2 chiffres)
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'CI', dialCode: '+225', flag: '🇨🇮', name: "Côte d'Ivoire",
    formats: [f(null, [2, 2, 2, 2, 2])],
    placeholder: '07 12 34 56 78',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DJIBOUTI — +253
  // Mobile : Djibouti Telecom (77XXXXXX)
  // Format : 77 12 34 56 — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'DJ', dialCode: '+253', flag: '🇩🇯', name: 'Djibouti',
    formats: [f(null, [2, 2, 2, 2])],
    placeholder: '77 12 34 56',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ÉGYPTE — +20
  // Mobile : Vodafone (010,011), Etisalat (011), Orange (012), WE (015)
  // Format : 010 1234 5678 — 11 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'EG', dialCode: '+20', flag: '🇪🇬', name: 'Égypte',
    formats: [f(null, [3, 4, 4])],
    placeholder: '010 1234 5678',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ÉRYTHRÉE — +291
  // Mobile : EriTel (7XXXXXX — opérateur unique)
  // Format : 71 23 456 — 7 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'ER', dialCode: '+291', flag: '🇪🇷', name: 'Érythrée',
    formats: [f(null, [2, 2, 3])],
    placeholder: '71 23 456',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ESPAGNE — +34
  // Mobile : 6xx (historique), 7xx (depuis 2017) — sans trunk prefix
  // Format : 612 345 678 — 9 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'ES', dialCode: '+34', flag: '🇪🇸', name: 'Espagne',
    formats: [
      f(/^[67]/, [3, 3, 3]),
      f(null,    [3, 3, 3]),
    ],
    placeholder: '612 345 678',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ESWATINI — +268
  // Mobile : MTN (76,78), Eswatini Mobile (79)
  // Format : 76 12 3456 — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'SZ', dialCode: '+268', flag: '🇸🇿', name: 'Eswatini',
    formats: [f(null, [2, 2, 4])],
    placeholder: '76 12 3456',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTHIOPIE — +251
  // Mobile : Ethio Telecom (09X), Safaricom (07X)
  // Format : 091 234 5678 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'ET', dialCode: '+251', flag: '🇪🇹', name: 'Éthiopie',
    formats: [f(null, [3, 3, 4])],
    placeholder: '091 234 5678',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FRANCE — +33
  // Mobile : 06xx (historique), 07xx (VoIP/MVNO depuis 2010)
  // Format : 06 12 34 56 78 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'FR', dialCode: '+33', flag: '🇫🇷', name: 'France',
    formats: [
      f(/^0[67]/, [2, 2, 2, 2, 2]),
      f(null,     [2, 2, 2, 2, 2]),
    ],
    placeholder: '06 12 34 56 78',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GAMBIE — +220
  // Mobile : Africell (2XX,7XX), QCell (3XX,40X), Comium (6XX)
  // Format : 710 1234 — 7 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'GM', dialCode: '+220', flag: '🇬🇲', name: 'Gambie',
    formats: [f(null, [3, 4])],
    placeholder: '710 1234',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GHANA — +233
  // Mobile : MTN (024,025,053), Vodafone (020,050), AirtelTigo (026,027)
  // Format : 024 123 4567 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'GH', dialCode: '+233', flag: '🇬🇭', name: 'Ghana',
    formats: [f(null, [3, 3, 4])],
    placeholder: '024 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GUINÉE — +224
  // Mobile : Orange (622,623,655), MTN (621,631), Cellcom (664)
  // Format : 622 12 34 56 — 9 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'GN', dialCode: '+224', flag: '🇬🇳', name: 'Guinée',
    formats: [f(null, [3, 2, 2, 2])],
    placeholder: '622 12 34 56',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GUINÉE ÉQUATORIALE — +240
  // Mobile : HiTs EG (055XXXXXXX), fixe : 222XXXXXX — 9 chiffres sans 0
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'GQ', dialCode: '+240', flag: '🇬🇶', name: 'Guinée équatoriale',
    formats: [
      f(/^222/, [3, 3, 3]),
      f(null,   [3, 3, 3]),
    ],
    placeholder: '222 123 456',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GUINÉE-BISSAU — +245
  // Mobile : Orange (95X-95X), Spacetel (96X)
  // Format : 955 123 456 — 9 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'GW', dialCode: '+245', flag: '🇬🇼', name: 'Guinée-Bissau',
    formats: [f(null, [3, 3, 3])],
    placeholder: '955 123 456',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ITALIE — +39
  // Mobile : 3xx (320, 328, 330, 347, 366, 380…) — sans trunk prefix
  // Format : 347 123 4567 — 10 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'IT', dialCode: '+39', flag: '🇮🇹', name: 'Italie',
    formats: [
      f(/^3/, [3, 3, 4]),
      f(null, [3, 3, 4]),
    ],
    placeholder: '347 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // KENYA — +254
  // Mobile : Safaricom (070X-079X), Airtel (073X,075X,078X), Telkom (077X)
  // Format : 0712 345 678 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'KE', dialCode: '+254', flag: '🇰🇪', name: 'Kenya',
    formats: [f(null, [4, 3, 3])],
    placeholder: '0712 345 678',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LESOTHO — +266
  // Mobile : Vodacom (56-59,62X), Econet (63X)
  // Format : 5812 3456 — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'LS', dialCode: '+266', flag: '🇱🇸', name: 'Lesotho',
    formats: [f(null, [4, 4])],
    placeholder: '5812 3456',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LIBERIA — +231
  // Mobile : Lonestar MTN (555,880-888), Orange (770,772,775-779)
  // Format : 555 123 4567 — 10 chiffres sans 0 initial
  // Note : certains numéros Liberia sont à 8 chiffres (anciens) ou 10 (nouveaux)
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'LR', dialCode: '+231', flag: '🇱🇷', name: 'Liberia',
    formats: [
      f(/^[578]/, [3, 3, 4]),
      f(null,     [2, 3, 3]),
    ],
    placeholder: '555 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LIBYE — +218
  // Mobile : Libyana (092,094), Al-Madar (091,093)
  // Format : 092 123 4567 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'LY', dialCode: '+218', flag: '🇱🇾', name: 'Libye',
    formats: [f(null, [3, 3, 4])],
    placeholder: '092 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LUXEMBOURG — +352
  // Mobile : POST (621), Orange (661), JOIN (671), Proximus LU (691)
  // Format : 621 123 456 — 9 chiffres sans 0 initial (pas de trunk prefix)
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'LU', dialCode: '+352', flag: '🇱🇺', name: 'Luxembourg',
    formats: [f(null, [3, 3, 3])],
    placeholder: '621 123 456',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MADAGASCAR — +261
  // Mobile : Orange (032X), Airtel (033X), Telma (034X,038X)
  // Format : 032 123 4567 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'MG', dialCode: '+261', flag: '🇲🇬', name: 'Madagascar',
    formats: [f(null, [3, 3, 4])],
    placeholder: '032 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MALAWI — +265
  // Mobile : Airtel (099XXXXXXX), TNM (088XXXXXXX) — 9 chiffres avec 0 initial
  // Format : 088 123 456
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'MW', dialCode: '+265', flag: '🇲🇼', name: 'Malawi',
    formats: [f(null, [3, 3, 3])],
    placeholder: '088 123 456',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MALI — +223
  // Mobile : Orange (70,72-76,79), Malitel (60-67,90-95)
  // Format : 7012 3456 — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'ML', dialCode: '+223', flag: '🇲🇱', name: 'Mali',
    formats: [f(null, [4, 4])],
    placeholder: '7012 3456',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MAROC — +212
  // Mobile : Maroc Telecom (060-064), Orange (061-063), Inwi (060,625-627)
  // Format : 06 12 34 56 78 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'MA', dialCode: '+212', flag: '🇲🇦', name: 'Maroc',
    formats: [f(null, [2, 2, 2, 2, 2])],
    placeholder: '06 12 34 56 78',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MAURICE — +230
  // Mobile : Mauritius Telecom (52XX), Emtel (57XX)
  // Format : 5234 5678 — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'MU', dialCode: '+230', flag: '🇲🇺', name: 'Maurice',
    formats: [f(null, [4, 4])],
    placeholder: '5234 5678',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MAURITANIE — +222
  // Mobile : Chinguitel (20-29), Mauritel (40-49), Mattel (30-39)
  // Format : 22 12 3456 — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'MR', dialCode: '+222', flag: '🇲🇷', name: 'Mauritanie',
    formats: [f(null, [2, 2, 4])],
    placeholder: '22 12 3456',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MOZAMBIQUE — +258
  // Mobile : Mcel (82,83), Vodacom (84,85), Movitel (86,87,88)
  // Format : 82 123 4567 — 9 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'MZ', dialCode: '+258', flag: '🇲🇿', name: 'Mozambique',
    formats: [f(null, [2, 3, 4])],
    placeholder: '82 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NAMIBIE — +264
  // Mobile : MTC (081), MTN (084), Telecom Namibia (085)
  // Format : 081 123 4567 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'NA', dialCode: '+264', flag: '🇳🇦', name: 'Namibie',
    formats: [f(null, [3, 3, 4])],
    placeholder: '081 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIGER — +227
  // Mobile : Airtel (96,97), Moov/Zamani (93,94)
  // Format : XX XX XX XX — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'NE', dialCode: '+227', flag: '🇳🇪', name: 'Niger',
    formats: [f(null, [2, 2, 2, 2])],
    placeholder: '93 12 34 56',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NIGERIA — +234
  // Mobile : MTN (0803-0806,0810-0814), Airtel (0701-0702,0708,0802,0808)
  //          Globacom (0703,0706,0803,0806), 9mobile (0809,0817-0819)
  // Format : 080 1234 5678 — 11 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'NG', dialCode: '+234', flag: '🇳🇬', name: 'Nigeria',
    formats: [f(null, [3, 4, 4])],
    placeholder: '080 1234 5678',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // OUGANDA — +256
  // Mobile : MTN (077,078,031,039), Airtel (070,075,074,020)
  // Format : 077 123 4567 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'UG', dialCode: '+256', flag: '🇺🇬', name: 'Ouganda',
    formats: [f(null, [3, 3, 4])],
    placeholder: '077 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PORTUGAL — +351
  // Mobile : MEO (91x), Vodafone (92x), NOS (93x, 96x)
  // Format : 912 345 678 — 9 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'PT', dialCode: '+351', flag: '🇵🇹', name: 'Portugal',
    formats: [
      f(/^9/, [3, 3, 3]),
      f(null, [3, 3, 3]),
    ],
    placeholder: '912 345 678',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RWANDA — +250
  // Mobile : Airtel (072,073), MTN (078) — 9 chiffres sans 0 initial
  // Format : 78 123 4567
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'RW', dialCode: '+250', flag: '🇷🇼', name: 'Rwanda',
    formats: [f(null, [2, 3, 4])],
    placeholder: '78 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SÃO TOMÉ-ET-PRÍNCIPE — +239
  // Mobile : Unitel STP (9XXXXXX)
  // Format : 980 1234 — 7 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'ST', dialCode: '+239', flag: '🇸🇹', name: 'São Tomé-et-Príncipe',
    formats: [f(null, [3, 4])],
    placeholder: '980 1234',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SÉNÉGAL — +221
  // Mobile : Orange (77,78), Free (76), Expresso (70,75)
  // Format : 77 123 45 67 — 9 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'SN', dialCode: '+221', flag: '🇸🇳', name: 'Sénégal',
    formats: [f(null, [2, 3, 2, 2])],
    placeholder: '77 123 45 67',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SEYCHELLES — +248
  // Mobile : Airtel (27X,27X), Cable & Wireless (25X)
  // Format : 252 3456 — 7 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'SC', dialCode: '+248', flag: '🇸🇨', name: 'Seychelles',
    formats: [f(null, [3, 4])],
    placeholder: '252 3456',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SIERRA LEONE — +232
  // Mobile : Orange (072-079), Africell (030,033,077,088,099)
  // Format : 76 12 3456 — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'SL', dialCode: '+232', flag: '🇸🇱', name: 'Sierra Leone',
    formats: [f(null, [2, 2, 4])],
    placeholder: '76 12 3456',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SOMALIE — +252
  // Mobile : Hormuud (61,77), Somtel (62,65,66), Telesom (63), Golis (90)
  // Format : 61 234 5678 — 9 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'SO', dialCode: '+252', flag: '🇸🇴', name: 'Somalie',
    formats: [f(null, [2, 3, 4])],
    placeholder: '61 234 5678',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SOUDAN — +249
  // Mobile : Zain (091,090,096), MTN (092,093,099)
  // Format : 91 234 5678 — 9 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'SD', dialCode: '+249', flag: '🇸🇩', name: 'Soudan',
    formats: [f(null, [2, 3, 4])],
    placeholder: '91 234 5678',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SOUDAN DU SUD — +211
  // Mobile : Zain (91), MTN (92), Digitel (98), Vivacel (95), Gemtel (97)
  // Format : 91 234 5678 — 9 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'SS', dialCode: '+211', flag: '🇸🇸', name: 'Soudan du Sud',
    formats: [f(null, [2, 3, 4])],
    placeholder: '91 234 5678',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SUISSE — +41
  // Mobile : Swisscom (075,076), Salt (077), Sunrise (078,079)
  // Format : 079 123 45 67 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'CH', dialCode: '+41', flag: '🇨🇭', name: 'Suisse',
    formats: [
      f(/^07/, [3, 3, 2, 2]),
      f(null,  [3, 3, 2, 2]),
    ],
    placeholder: '079 123 45 67',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TANZANIE — +255
  // Mobile : Vodacom (74,75,76), Airtel (68,69,78), Tigo (65,67,71)
  // Format : 074 123 4567 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'TZ', dialCode: '+255', flag: '🇹🇿', name: 'Tanzanie',
    formats: [f(null, [3, 3, 4])],
    placeholder: '074 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TCHAD — +235
  // Mobile : Airtel (66,67,77), Moov Africa (90-93)
  // Format : XX XX XX XX — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'TD', dialCode: '+235', flag: '🇹🇩', name: 'Tchad',
    formats: [f(null, [2, 2, 2, 2])],
    placeholder: '66 12 34 56',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TOGO — +228
  // Mobile : Togocel (70-73,90-93), Moov (78,79,96-99)
  // Format : XX XX XX XX — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'TG', dialCode: '+228', flag: '🇹🇬', name: 'Togo',
    formats: [f(null, [2, 2, 2, 2])],
    placeholder: '70 12 34 56',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TUNISIE — +216
  // Mobile : Ooredoo (2X), Orange (5X,9X), Tunisie Telecom (9X)
  // Format : 91 234 567 — 8 chiffres sans 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'TN', dialCode: '+216', flag: '🇹🇳', name: 'Tunisie',
    formats: [f(null, [2, 3, 3])],
    placeholder: '91 234 567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ZAMBIE — +260
  // Mobile : MTN (096,076), Airtel (097,077), Zamtel (095)
  // Format : 096 123 4567 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'ZM', dialCode: '+260', flag: '🇿🇲', name: 'Zambie',
    formats: [f(null, [3, 3, 4])],
    placeholder: '096 123 4567',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ZIMBABWE — +263
  // Mobile : Econet (077,078), NetOne (071), Telecel (073)
  // Format : 077 123 4567 — 10 chiffres avec 0 initial
  // ══════════════════════════════════════════════════════════════════════════
  {
    iso: 'ZW', dialCode: '+263', flag: '🇿🇼', name: 'Zimbabwe',
    formats: [f(null, [3, 3, 4])],
    placeholder: '077 123 4567',
  },
]

// ─── Défaut ──────────────────────────────────────────────────────────────────

export const DEFAULT_PHONE_COUNTRY: PhoneCountry = PHONE_COUNTRIES[0]

// ─── Utilitaires ─────────────────────────────────────────────────────────────

/** Retourne le format applicable pour les chiffres saisis. */
export function getFormat(country: PhoneCountry, digits: string): PhoneFormat {
  return (
    country.formats.find((fmt) => fmt.detect !== null && fmt.detect.test(digits)) ??
    country.formats.find((fmt) => fmt.detect === null) ??
    country.formats[0]
  )
}

/** Applique les espaces de groupe sur une chaîne de chiffres bruts. */
export function formatPhoneDigits(digits: string, format: PhoneFormat): string {
  let result = ''
  let pos = 0
  for (const size of format.groups) {
    const chunk = digits.slice(pos, pos + size)
    if (!chunk) break
    if (pos > 0) result += ' '
    result += chunk
    pos += size
  }
  return result
}

/**
 * Convertit les chiffres locaux + indicatif en E.164.
 * Retire le '0' initial si présent (convention locale).
 */
export function digitsToE164(dialCode: string, digits: string): string {
  const local = digits.startsWith('0') ? digits.slice(1) : digits
  return dialCode + local
}

/** Retourne `true` quand le nombre de chiffres correspond exactement au total du format. */
export function isFormatComplete(format: PhoneFormat, digits: string): boolean {
  return digits.length === format.total
}

/** Détecte le pays depuis un numéro E.164 (correspondance par le plus long préfixe). */
export function detectCountry(e164: string): PhoneCountry {
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length)
  return sorted.find((c) => e164.startsWith(c.dialCode)) ?? DEFAULT_PHONE_COUNTRY
}

/** Convertit un numéro E.164 en chiffres locaux avec le '0' initial restauré. */
export function e164ToLocalDigits(dialCode: string, e164: string): string {
  if (!e164.startsWith(dialCode)) return ''
  const local = e164.slice(dialCode.length)
  return local ? `0${local}` : ''
}

/**
 * Formate un numéro E.164 pour l'affichage lisible.
 * @example formatE164Display('+24177123456') → '+241 07 12 34 56'
 */
export function formatE164Display(e164: string): string {
  if (!e164) return '—'
  const country = detectCountry(e164)
  const localDigits = e164ToLocalDigits(country.dialCode, e164)
  if (!localDigits) return e164
  const format = getFormat(country, localDigits)
  const formatted = formatPhoneDigits(localDigits, format)
  return `${country.dialCode} ${formatted}`
}

const CURRENCY_BY_ISO: Record<string, string> = {
  GA: 'XAF', CM: 'XAF', CG: 'XAF', TD: 'XAF', CF: 'XAF', GQ: 'XAF',
  BE: 'EUR', FR: 'EUR', LU: 'EUR',
  SN: 'XOF', CI: 'XOF', ML: 'XOF', BF: 'XOF', TG: 'XOF', NE: 'XOF',
}

export function getCurrencyFromPhone(phone: string): string {
  if (!phone) return 'XAF'
  const iso = detectCountry(phone).iso
  return CURRENCY_BY_ISO[iso] ?? 'XAF'
}
