/** OSM `opening_hours` subset for DE shops. Unparsed → no invented open/closed. */

export type HoursInterval = { start: number; end: number }

export type HoursDay = HoursInterval[] | 'off' | 'always'

export type ParsedHours = {
  days: HoursDay[]
  phOff: boolean
  ph: HoursDay | null
  always: boolean
  complex: boolean
}

const DAY_TOKEN: Record<string, number> = {
  su: 0,
  mo: 1,
  tu: 2,
  we: 3,
  th: 4,
  fr: 5,
  sa: 6,
}

const COMPLEX =
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|week(?:\d)|sunrise|sunset|easter|\bsh\b)\b/i

const BW_PH = new Set([
  '2026-01-01',
  '2026-01-06',
  '2026-04-03',
  '2026-04-06',
  '2026-05-01',
  '2026-05-14',
  '2026-05-25',
  '2026-06-04',
  '2026-10-03',
  '2026-11-01',
  '2026-12-25',
  '2026-12-26',
  '2027-01-01',
  '2027-01-06',
  '2027-03-26',
  '2027-03-29',
  '2027-05-01',
  '2027-05-06',
  '2027-05-17',
  '2027-05-27',
  '2027-10-03',
  '2027-11-01',
  '2027-12-25',
  '2027-12-26',
])

export function parseOpeningHours(raw: string): ParsedHours | null {
  const src = String(raw || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!src || src.length > 280) return null
  if (/^24\s*\/\s*7$/i.test(src) || /^open$/i.test(src)) {
    return { days: fillDays('always'), phOff: false, ph: 'always', always: true, complex: false }
  }
  if (/^closed$/i.test(src) || /^off$/i.test(src)) {
    return { days: fillDays('off'), phOff: true, ph: 'off', always: false, complex: false }
  }
  const complex = COMPLEX.test(src)
  const days: HoursDay[] = fillDays('off')
  let phOff = false
  let ph: HoursDay | null = null
  let any = false
  for (const chunk of src.split(';')) {
    const rule = chunk.trim()
    if (!rule) continue
    const parsed = parseRule(rule)
    if (!parsed) continue
    any = true
    if (parsed.ph) {
      if (parsed.off) {
        phOff = true
        ph = 'off'
      } else if (parsed.always) ph = 'always'
      else if (parsed.times.length) ph = parsed.times
      if (!parsed.weekdays.length) continue
    }
    const targets = parsed.weekdays.length ? parsed.weekdays : [0, 1, 2, 3, 4, 5, 6]
    for (const d of targets) {
      if (parsed.off) days[d] = 'off'
      else if (parsed.always) days[d] = 'always'
      else if (parsed.times.length) days[d] = parsed.times
    }
  }
  if (!any) return null
  return { days, phOff, ph, always: days.every((d) => d === 'always'), complex }
}

export function isOpenAt(parsed: ParsedHours, at: Date): boolean | null {
  if (parsed.complex) return null
  if (parsed.always) return true
  const holiday = isBwHoliday(at)
  if (holiday) {
    if (parsed.phOff || parsed.ph === 'off') return false
    if (parsed.ph === 'always') return true
    if (Array.isArray(parsed.ph)) return inIntervals(parsed.ph, minutesOf(at), false)
    return openOnWeekday(parsed, at)
  }
  return openOnWeekday(parsed, at)
}

export function formatHoursSpeech(raw: string | undefined, at: Date): string {
  const src = String(raw || '').trim()
  if (!src) return 'Keine Öffnungszeiten in der Karte.'
  const parsed = parseOpeningHours(src)
  if (!parsed) return 'Öffnungszeiten in der Karte unlesbar — ich rate nicht.'
  if (parsed.always) return 'Laut Karte rund um die Uhr auf.'
  const today = daySpeech(parsed.days[at.getDay()])
  if (parsed.complex) {
    return today ? `Laut Karte ${today}. Saison nicht ausgewertet.` : 'Öffnungszeiten in der Karte, Saison nicht ausgewertet.'
  }
  const open = isOpenAt(parsed, at)
  if (open === true) return today ? `Laut Karte jetzt auf, ${today}.` : 'Laut Karte jetzt auf.'
  if (open === false) {
    if (isBwHoliday(at) && (parsed.phOff || parsed.ph === 'off')) {
      return 'Laut Karte heute Feiertag, geschlossen.'
    }
    return today ? `Laut Karte jetzt zu, ${today}.` : 'Laut Karte jetzt zu.'
  }
  return today ? `Laut Karte ${today}.` : 'Öffnungszeiten in der Karte, Status unklar.'
}

export function hoursOpenNow(raw: string | undefined, at: Date): boolean | null {
  const parsed = parseOpeningHours(String(raw || ''))
  if (!parsed) return null
  return isOpenAt(parsed, at)
}

function openOnWeekday(parsed: ParsedHours, at: Date): boolean | null {
  const day = at.getDay()
  const mins = minutesOf(at)
  const today = parsed.days[day]
  if (today === 'always') return true
  if (inIntervals(today === 'off' || !Array.isArray(today) ? [] : today, mins, false)) return true
  const prev = parsed.days[(day + 6) % 7]
  if (Array.isArray(prev) && inIntervals(prev, mins, true)) return true
  if (today === 'off' || (Array.isArray(today) && !today.length)) return false
  if (Array.isArray(today)) return false
  return null
}

function parseRule(rule: string): {
  weekdays: number[]
  times: HoursInterval[]
  off: boolean
  always: boolean
  ph: boolean
} | null {
  let t = rule.replace(/\bPH\b/gi, ' PH ').replace(/\s+/g, ' ').trim()
  const ph = /\bPH\b/i.test(t)
  t = t.replace(/\bPH\b/gi, ' ').replace(/\s+/g, ' ').trim()
  const off = /\boff\b/i.test(t)
  const always = /\b24\s*\/\s*7\b/i.test(t)
  const weekdays = parseDays(t)
  const times = always ? [{ start: 0, end: 24 * 60 }] : parseTimes(t)
  if (!off && !always && !times.length && !weekdays.length && !ph) return null
  return { weekdays, times, off, always, ph }
}

function parseDays(rule: string): number[] {
  const out: number[] = []
  const re = /\b(mo|tu|we|th|fr|sa|su)(?:\s*-\s*(mo|tu|we|th|fr|sa|su))?\b/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(rule))) {
    const a = DAY_TOKEN[m[1].toLowerCase()]
    if (a == null) continue
    if (!m[2]) {
      out.push(a)
      continue
    }
    const b = DAY_TOKEN[m[2].toLowerCase()]
    if (b == null) continue
    let d = a
    out.push(d)
    while (d !== b) {
      d = (d + 1) % 7
      out.push(d)
    }
  }
  return unique(out)
}

function parseTimes(rule: string): HoursInterval[] {
  const out: HoursInterval[] = []
  const re = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g
  let m: RegExpExecArray | null
  while ((m = re.exec(rule))) {
    const start = clampTime(Number(m[1]), Number(m[2]))
    let end = clampTime(Number(m[3]), Number(m[4]))
    if (start == null || end == null) continue
    if (end === 0 && start > 0) end = 24 * 60
    if (end <= start) end += 24 * 60
    out.push({ start, end })
  }
  return out
}

function inIntervals(rows: HoursInterval[], mins: number, overnightOnly: boolean): boolean {
  for (const row of rows) {
    if (overnightOnly) {
      if (row.end <= 24 * 60) continue
      if (mins < row.end - 24 * 60) return true
      continue
    }
    if (mins >= row.start && mins < Math.min(row.end, 24 * 60)) return true
  }
  return false
}

function daySpeech(day: HoursDay | undefined): string {
  if (day === 'always') return 'heute rund um die Uhr'
  if (day === 'off' || !day || (Array.isArray(day) && !day.length)) return 'heute geschlossen'
  if (!Array.isArray(day)) return ''
  const bits = day.map((iv) => {
    const end = iv.end > 24 * 60 ? iv.end - 24 * 60 : iv.end
    return `${fmtHour(iv.start)} bis ${fmtHour(end)} Uhr`
  })
  return `heute ${bits.join(' und ')}`
}

function fmtHour(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return m ? `${h}:${String(m).padStart(2, '0')}` : String(h)
}

function minutesOf(at: Date): number {
  return at.getHours() * 60 + at.getMinutes()
}

function fillDays(v: HoursDay): HoursDay[] {
  return [v, v, v, v, v, v, v]
}

function clampTime(h: number, m: number): number | null {
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 24 || m < 0 || m > 59) return null
  if (h === 24) return m === 0 ? 24 * 60 : null
  return h * 60 + m
}

function unique(rows: number[]): number[] {
  return [...new Set(rows)]
}

export function isBwHoliday(at: Date): boolean {
  const y = at.getFullYear()
  const mo = String(at.getMonth() + 1).padStart(2, '0')
  const d = String(at.getDate()).padStart(2, '0')
  return BW_PH.has(`${y}-${mo}-${d}`)
}
