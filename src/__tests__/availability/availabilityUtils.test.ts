import {
  computeAppointmentIntervalOnDay,
  computeFreeIntervals,
  minutesToTime,
  subtractInterval,
  timeToMinutes,
  toDateString,
} from '@/domain/availability/availabilityUtils'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y!, m! - 1, d!, 0, 0, 0, 0)
}

function makeDateTime(dateStr: string, hours: number, minutes = 0): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y!, m! - 1, d!, hours, minutes, 0, 0)
}

// Plage recurrente lundi 08:00-18:00
const MON_SLOT = { dayOfWeek: 1, startTime: '08:00', endTime: '18:00' }
const MONDAY = makeDay('2026-07-06')  // lundi

// ---------------------------------------------------------------------------
// timeToMinutes / minutesToTime
// ---------------------------------------------------------------------------

describe('timeToMinutes', () => {
  it('convertit 08:00 en 480', () => expect(timeToMinutes('08:00')).toBe(480))
  it('convertit 18:30 en 1110', () => expect(timeToMinutes('18:30')).toBe(1110))
  it('convertit 00:00 en 0', () => expect(timeToMinutes('00:00')).toBe(0))
})

describe('minutesToTime', () => {
  it('convertit 480 en 08:00', () => expect(minutesToTime(480)).toBe('08:00'))
  it('convertit 1110 en 18:30', () => expect(minutesToTime(1110)).toBe('18:30'))
  it('convertit 0 en 00:00', () => expect(minutesToTime(0)).toBe('00:00'))
})

// ---------------------------------------------------------------------------
// subtractInterval
// ---------------------------------------------------------------------------

describe('subtractInterval', () => {
  const base = [{ start: 480, end: 1080 }] // 08:00-18:00

  it('laisse intact si pas de chevauchement', () => {
    expect(subtractInterval(base, { start: 1080, end: 1200 })).toEqual([{ start: 480, end: 1080 }])
  })

  it('decoupe en deux parties si le busy est a l interieur', () => {
    // Bloquer 12:00-13:00 => 08:00-12:00 + 13:00-18:00
    const result = subtractInterval(base, { start: 720, end: 780 })
    expect(result).toEqual([
      { start: 480, end: 720 },
      { start: 780, end: 1080 },
    ])
  })

  it('supprime le segment si le busy couvre entierement', () => {
    const result = subtractInterval(base, { start: 480, end: 1080 })
    expect(result).toEqual([])
  })

  it('raccourcit a droite si le busy depasse la fin', () => {
    const result = subtractInterval(base, { start: 960, end: 1200 })
    expect(result).toEqual([{ start: 480, end: 960 }])
  })

  it('raccourcit a gauche si le busy commence avant le debut', () => {
    const result = subtractInterval(base, { start: 420, end: 540 })
    expect(result).toEqual([{ start: 540, end: 1080 }])
  })
})

// ---------------------------------------------------------------------------
// computeAppointmentIntervalOnDay - chevauchement de minuit
// ---------------------------------------------------------------------------

describe('computeAppointmentIntervalOnDay', () => {
  const TUESDAY = makeDay('2026-07-07')

  it('retourne null si le RDV ne touche pas ce jour', () => {
    const scheduledAt = makeDateTime('2026-07-06', 10) // lundi
    expect(computeAppointmentIntervalOnDay(scheduledAt, 60, TUESDAY)).toBeNull()
  })

  it('retourne l intervalle complet si le RDV est entierement dans la journee', () => {
    const scheduledAt = makeDateTime('2026-07-07', 14) // 14:00 mardi
    expect(computeAppointmentIntervalOnDay(scheduledAt, 120, TUESDAY))
      .toEqual({ start: 840, end: 960 }) // 14:00-16:00
  })

  it('CAS LIMITE - RDV chevauchant minuit : bloque jusqu a minuit le 1er jour', () => {
    // RDV 23:00 + 3h => finit 02:00 le lendemain
    const scheduledAt = makeDateTime('2026-07-07', 23)
    const result = computeAppointmentIntervalOnDay(scheduledAt, 180, TUESDAY)
    expect(result).toEqual({ start: 1380, end: 1440 }) // 23:00-24:00
  })

  it('CAS LIMITE - RDV chevauchant minuit : bloque depuis minuit le 2eme jour', () => {
    const WEDNESDAY = makeDay('2026-07-08')
    const scheduledAt = makeDateTime('2026-07-07', 23)
    const result = computeAppointmentIntervalOnDay(scheduledAt, 180, WEDNESDAY)
    expect(result).toEqual({ start: 0, end: 120 }) // 00:00-02:00
  })

  it('retourne null pour le lendemain si le RDV finit exactement a minuit', () => {
    const WEDNESDAY = makeDay('2026-07-08')
    const scheduledAt = makeDateTime('2026-07-07', 22)
    const result = computeAppointmentIntervalOnDay(scheduledAt, 120, WEDNESDAY)
    expect(result).toBeNull() // finit a 00:00 (exclusif)
  })
})

// ---------------------------------------------------------------------------
// computeFreeIntervals - cas limites
// ---------------------------------------------------------------------------

describe('computeFreeIntervals', () => {
  // CAS 1 : artisan sans plage
  it('CAS 1 - artisan sans plages => retourne []', () => {
    expect(computeFreeIntervals([], [], [], MONDAY)).toEqual([])
  })

  // CAS 2 : exception journee entiere
  it('CAS 2 - exception journee entiere => retourne []', () => {
    // startTime et endTime absents = journee entiere bloquee
    const exception = {} as { startTime?: string; endTime?: string }
    expect(computeFreeIntervals([MON_SLOT], [exception], [], MONDAY)).toEqual([])
  })

  // CAS 3 : exception partielle
  it('CAS 3 - exception partielle 12:00-14:00 => deux creneaux libres', () => {
    const exception = { startTime: '12:00', endTime: '14:00' }
    const result = computeFreeIntervals([MON_SLOT], [exception], [], MONDAY)
    expect(result).toEqual([
      { start: 480, end: 720 },  // 08:00-12:00
      { start: 840, end: 1080 }, // 14:00-18:00
    ])
  })

  // CAS 4 : duree > creneau restant
  it('CAS 4 - RDV laisse < 60 min libres en fin de journee', () => {
    // RDV 16:00-17:30 (90 min) => libre : 08:00-16:00 + 17:30-18:00 (30 min)
    const scheduledAt = makeDateTime('2026-07-06', 16)
    const result = computeFreeIntervals([MON_SLOT], [], [{ scheduledAt, durationMinutes: 90 }], MONDAY)
    expect(result).toEqual([
      { start: 480, end: 960 },   // 08:00-16:00 (480 min)
      { start: 1050, end: 1080 }, // 17:30-18:00 (30 min)
    ])
    expect(result.some((i) => i.end - i.start >= 60)).toBe(true)  // 480 min disponibles
    expect(result.some((i) => i.end - i.start < 60)).toBe(true)   // 30 min insuffisant
  })

  // CAS 5 : RDV sans durationMinutes => DEFAULT 120 min
  it('CAS 5 - RDV sans durationMinutes utilise 120 min par defaut', () => {
    const scheduledAt = makeDateTime('2026-07-06', 10) // 10:00
    const result = computeFreeIntervals([MON_SLOT], [], [{ scheduledAt }], MONDAY)
    expect(result).toEqual([
      { start: 480, end: 600 },  // 08:00-10:00
      { start: 720, end: 1080 }, // 12:00-18:00
    ])
  })

  // CAS 6 : jour non travaille
  it('CAS 6 - dimanche non defini comme jour travaille => retourne []', () => {
    const SUNDAY = makeDay('2026-07-05')
    expect(computeFreeIntervals([MON_SLOT], [], [], SUNDAY)).toEqual([])
  })

  // CAS 7 : deux plages, RDV dans le trou
  it('CAS 7 - deux plages matin/aprem, RDV dans le trou => les deux plages restent libres', () => {
    const morning = { dayOfWeek: 1, startTime: '08:00', endTime: '12:00' }
    const afternoon = { dayOfWeek: 1, startTime: '14:00', endTime: '18:00' }
    const scheduledAt = makeDateTime('2026-07-06', 12, 30) // 12:30
    const result = computeFreeIntervals([morning, afternoon], [], [{ scheduledAt, durationMinutes: 60 }], MONDAY)
    expect(result).toEqual([
      { start: 480, end: 720 },  // 08:00-12:00
      { start: 840, end: 1080 }, // 14:00-18:00
    ])
  })

  // CAS 8 : RDV de la veille chevauchant minuit ne bloque pas les plages du lundi
  it('CAS 8 - RDV 23:00+3h la veille bloque seulement 00:00-02:00 le lundi', () => {
    const scheduledAt = makeDateTime('2026-07-05', 23) // dimanche 23:00
    const result = computeFreeIntervals([MON_SLOT], [], [{ scheduledAt, durationMinutes: 180 }], MONDAY)
    // Plage 08:00-18:00 non impactee (00:00-02:00 est en dehors)
    expect(result).toEqual([{ start: 480, end: 1080 }])
  })

  // CAS 9 : RDV du meme jour chevauchant minuit
  it('CAS 9 - RDV 17:00+3h bloque 17:00-18:00 ce jour-la', () => {
    const scheduledAt = makeDateTime('2026-07-06', 17)
    const result = computeFreeIntervals([MON_SLOT], [], [{ scheduledAt, durationMinutes: 180 }], MONDAY)
    expect(result).toEqual([{ start: 480, end: 1020 }]) // 08:00-17:00
  })
})

// ---------------------------------------------------------------------------
// toDateString
// ---------------------------------------------------------------------------

describe('toDateString', () => {
  it('formate correctement une date locale', () => {
    expect(toDateString(makeDay('2026-07-06'))).toBe('2026-07-06')
  })
})
