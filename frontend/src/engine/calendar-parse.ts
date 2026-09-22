import { formatDue, parseReminderIntent, startOfDay } from './remind-parse.ts'

export type CalendarIntent =
  | { kind: 'create'; title: string; start: Date; whenLabel: string; place?: string }
  | { kind: 'list'; day?: Date; until?: Date; label?: string }
  | { kind: 'delete'; query: string }
  | { kind: 'delete_last' }
  | { kind: 'rename'; query: string; title: string }
  | { kind: 'move'; query: string; start: Date; whenLabel: string }
  | { kind: 'open' }

const WEEKDAYS =
  'montag|dienstag|mittwoch|donnerstag|freitag|friday|samestag|samstag|sonnabend|sonntag'
const CREATE = /^\s*termin(?:e)?\s*[:-]?\s*(.+)$/is
const CREATE_NL =
  /^\s*(?:erstell(?:e)?|leg(?:e)?\s+an|mach(?:e)?)\s+(?:einen?\s+)?termin(?:\s+für)?(?:\s+den)?\s+(\d{1,2})\.(\d{1,2})\.?\s*(\d{2,4})?\s*[, ]+(?:um\s+)?(\d{1,2})(?:[:.](\d{2}))?(?:\s*uhr)?\s*[,:]?\s+(.+)$/is
const OPEN = /^\s*(?:zeig(?:e)?\s+(?:mir\s+)?(?:den\s+)?)?kalender\s*$/i
const LIST_ALL = /^\s*(?:zeig(?:e)?\s+(?:mir\s+)?(?:meine\s+)?)?termine\s*$/i
const LIST_DAY = new RegExp(
  `^\\s*(?:was\\s+habe\\s+ich|termine?|kalender|was\\s+steht)\\s+(?:so\\s+)?(?:am\\s+)?(heute|morgen|übermorgen|${WEEKDAYS})(?:\\s+so)?(?:\\s+an)?\\s*\\??\\s*$`,
  'i',
)
const LIST_NEXT = new RegExp(
  `^\\s*(?:was\\s+steht|termine?|kalender)\\s+(?:so\\s+)?(?:am\\s+)?nächste(?:n)?\\s+(${WEEKDAYS})(?:\\s+an)?\\s*\\??\\s*$`,
  'i',
)
const LIST_CAL_DAY = new RegExp(
  `^\\s*(?:zeig(?:e)?\\s+(?:mir\\s+)?)?(?:den\\s+)?kalender\\s+(heute|morgen|übermorgen|${WEEKDAYS})\\s*$`,
  'i',
)
const LIST_WEEK =
  /^\s*was\s+steht\s+(?:so\s+)?diese\s+woche(?:\s+so)?(?:\s+an)?\s*\??\s*$/i
const LIST_DAYS =
  /^\s*was\s+steht\s+(?:so\s+)?(?:die\s+)?nächste(?:n)?\s+(\d{1,2})\s+tage(?:\s+an)?\s*\??\s*$/i
const DELETE = /^\s*(?:lösch(?:e)?|streich(?:e)?)\s+(?:den\s+)?termin\s+(.+)$/is
const DELETE_LAST =
  /^\s*(?:lösch(?:e)?|streich(?:e)?)\s+(?:den\s+)?letzten\s+termin\s*$/i
const CANCEL_LAST =
  /^\s*(?:(?:den\s+)?(?:letzten\s+)?termin(?:e)?\s+absagen|sag(?:e)?\s+(?:den\s+)?(?:letzten\s+)?termin\s+ab)\s*[.!]?\s*$/i
const RENAME_IN =
  /^\s*(?:änder(?:e)?|benenn(?:e)?)\s+(?:den\s+)?(?:termin\s+)?(.+?)\s+(?:um\s+)?(?:in|auf)\s+(.+?)\s*[.!]?\s*$/i
const RENAME_HEISST =
  /^\s*(?:(?:der\s+)?termin\s+)?(.+?)\s+heißt\s+jetzt\s+(.+?)\s*[.!]?\s*$/i
const RENAME_SKIP = /^(?:das|es|der|die|er|sie|dies(?:er|e|es)?|mein|meine)$/i

const DAY_SHIFT: Record<string, number> = {
  heute: 0,
  morgen: 1,
  übermorgen: 2,
}

const WEEKDAY_JS: Record<string, number> = {
  sonntag: 0,
  sonntags: 0,
  montag: 1,
  montags: 1,
  dienstag: 2,
  dienstags: 2,
  mittwoch: 3,
  mittwochs: 3,
  donnerstag: 4,
  donnerstags: 4,
  freitag: 5,
  freitags: 5,
  friday: 5,
  samstag: 6,
  samstags: 6,
  samestag: 6,
  samestags: 6,
  sonnabend: 6,
  sonnabends: 6,
}

const WEEKDAY_TOKEN =
  'heute|morgen|übermorgen|montags?|dienstags?|mittwochs?|donnerstags?|freitags?|friday|samestags?|samstags?|sonnabends?|sonntags?'
const CLOCK_TOKEN = /(?:um\s+)?(\d{1,2})(?:[:.](\d{2}))?(?:\s*uhr)\b/i
const CLOCK_HM = /\b(\d{1,2})[:.](\d{2})\b/
const EVENT_HINT =
  /\b(?:geburtstag\w*|birthday|termin|zahnarzt|arzt|meeting|feier|party|treffen|vorlesung|klausur|training|flug|urlaub)\b/i
const STEAL_BARE =
  /^\s*(?:was|wie|wer|wo|wann|wetter|nachrichten|news|zeig(?:e)?|öffne|kalender|erinner(?:e)?\s+mich|lösch|streich|änder|benenn)\b/i
const FOREIGN_TITLE =
  /^(?:wetter|nachrichten|news|lage|flugzeuge|satelliten|taschenlampe|timer|wecker|kalender)$/i
const GLUE_WEEKDAY =
  /(?<=^|[^A-Za-zÄÖÜäöüß])(montags?|dienstags?|mittwochs?|donnerstags?|freitags?|friday|samestags?|samstags?|sonnabends?|sonntags?)(?=[A-Za-zÄÖÜäöüß])/gi
const GLUE_EVENT =
  /(?<=^|[^A-Za-zÄÖÜäöüß])(geburtstag|birthday|termin|zahnarzt)(?=[A-Za-zÄÖÜäöüß])/gi

/** STT klebt „SamestagGeburtstagJakob18Uhrher“. Idempotent bei schon getrennten Wörtern. */
export function normalizeCalendarSpeech(text: string): string {
  let t = String(text || '')
  t = t.replace(/samestags?/gi, 'Samstag')
  t = t.replace(/(\d{1,2})(?:[:.](\d{2}))?uhr(?:her|hör|h[eä]r)?/gi, (_, h, m) => (m ? `${h}:${m} Uhr` : `${h} Uhr`))
  t = t.replace(/\buhr(?:her|hör|h[eä]r)\b/gi, 'Uhr')
  t = t.replace(GLUE_WEEKDAY, '$1 ')
  t = t.replace(GLUE_EVENT, '$1 ')
  t = t.replace(/([A-Za-zÄÖÜäöüß])(\d{1,2}(?:[:.]\d{2})?\s*Uhr)\b/g, '$1 $2')
  t = t.replace(/\s+/g, ' ').trim()
  return t
}

export function dayFromWord(word: string, now = new Date()): Date {
  const w = word.toLowerCase()
  const d = startOfDay(now)
  if (w in DAY_SHIFT) {
    d.setDate(d.getDate() + DAY_SHIFT[w])
    return d
  }
  const want = WEEKDAY_JS[w]
  if (want === undefined) return d
  const add = (want - d.getDay() + 7) % 7
  d.setDate(d.getDate() + add)
  return d
}

/** „nächsten Freitag“: wenn heute Freitag ist, +7. */
export function nextNamedDay(word: string, now = new Date()): Date {
  const d = dayFromWord(word, now)
  if (startOfDay(d).getTime() === startOfDay(now).getTime()) d.setDate(d.getDate() + 7)
  return d
}

function dateFromParts(
  now: Date,
  dayStr: string,
  monthStr: string,
  yearStr?: string,
): Date | null {
  const day = Number(dayStr)
  const month = Number(monthStr)
  if (!Number.isFinite(day) || !Number.isFinite(month) || day < 1 || day > 31 || month < 1 || month > 12) {
    return null
  }
  let year = now.getFullYear()
  if (yearStr) {
    const y = Number(yearStr)
    if (!Number.isFinite(y)) return null
    year = y < 100 ? 2000 + y : y
  }
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  if (!yearStr && startOfDay(d).getTime() < startOfDay(now).getTime()) d.setFullYear(year + 1)
  return d
}

function createFromInner(raw: string, now: Date): CalendarIntent | null {
  const inner = parseReminderIntent(raw.trim(), now)
  if (inner?.kind === 'create') {
    const split = splitTitlePlace(inner.title)
    return {
      kind: 'create',
      title: split.title,
      place: split.place,
      start: inner.due,
      whenLabel: inner.whenLabel,
    }
  }
  const bare = parseBareCreate(raw, now)
  if (bare) return bare
  const title = raw.trim()
  if (!title) return null
  const split = splitTitlePlace(title)
  const start = new Date(now)
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  return { kind: 'create', title: split.title, place: split.place, start, whenLabel: formatDue(start, now) }
}

export function parseCalendarIntent(text: string, now = new Date()): CalendarIntent | null {
  const t = normalizeCalendarSpeech(text)
  if (!t || t.length > 220) return null
  if (OPEN.test(t)) return { kind: 'open' }
  if (LIST_ALL.test(t)) return { kind: 'list' }
  if (LIST_WEEK.test(t)) {
    const from = startOfDay(now)
    const until = new Date(from)
    until.setDate(until.getDate() + 7)
    return { kind: 'list', day: from, until, label: 'diese Woche' }
  }
  const days = LIST_DAYS.exec(t)
  if (days) {
    const n = Math.min(14, Math.max(1, Number(days[1]) || 1))
    const from = startOfDay(now)
    const until = new Date(from)
    until.setDate(until.getDate() + n)
    return { kind: 'list', day: from, until, label: `die nächsten ${n} Tage` }
  }
  const nxt = LIST_NEXT.exec(t)
  if (nxt) {
    const day = nextNamedDay(nxt[1], now)
    return { kind: 'list', day, label: `nächsten ${nxt[1]}` }
  }
  const calDay = LIST_CAL_DAY.exec(t)
  if (calDay) return { kind: 'list', day: dayFromWord(calDay[1], now) }
  const day = LIST_DAY.exec(t)
  if (day) return { kind: 'list', day: dayFromWord(day[1], now) }
  if (DELETE_LAST.test(t) || CANCEL_LAST.test(t)) return { kind: 'delete_last' }
  const del = DELETE.exec(t)
  if (del) return { kind: 'delete', query: del[1].replace(/[.!?]+$/, '').trim() }
  const renamed = parseRename(t)
  if (renamed) return renamed

  const nl = CREATE_NL.exec(t)
  if (nl) {
    const startDay = dateFromParts(now, nl[1], nl[2], nl[3] || undefined)
    const h = Number(nl[4])
    const m = nl[5] ? Number(nl[5]) : 0
    const split = splitTitlePlace(nl[6].replace(/[.!?]+$/, '').trim())
    if (startDay && Number.isFinite(h) && split.title) {
      startDay.setHours(h, Number.isFinite(m) ? m : 0, 0, 0)
      return {
        kind: 'create',
        title: split.title,
        place: split.place,
        start: startDay,
        whenLabel: formatDue(startDay, now),
      }
    }
  }

  const created = CREATE.exec(t)
  if (created) return createFromInner(created[1], now)
  const merk = /^\s*merk(?:e)?\s*dir\s+(?:bitte\s*)?(?:dass\s+)?(.+)$/is.exec(t)
  if (merk && /\b(?:zahnarzt|arzt|termin|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|morgen)\b/i.test(merk[1])) {
    const inner = merk[1].replace(/^ich\s+/i, '').replace(/\s+habe\.?$/i, '').trim()
    return createFromInner(inner, now)
  }
  const moved = parseMove(t, now)
  if (moved) return moved
  return parseBareCreate(t, now)
}

function parseRename(text: string): CalendarIntent | null {
  const hit = RENAME_IN.exec(text) || RENAME_HEISST.exec(text)
  if (!hit) return null
  const query = hit[1].replace(/\s+/g, ' ').replace(/[.!?]+$/g, '').trim()
  const title = hit[2].replace(/\s+/g, ' ').replace(/[.!?]+$/g, '').trim()
  if (!query || !title || query.length < 2 || title.length < 2) return null
  if (RENAME_SKIP.test(query) || RENAME_SKIP.test(title)) return null
  if (query.toLowerCase() === title.toLowerCase()) return null
  return { kind: 'rename', query, title }
}

export function splitTitlePlace(raw: string): { title: string; place?: string } {
  const t = raw.replace(/\s+/g, ' ').trim()
  if (!t) return { title: 'Termin' }
  if (/\b(?:geburtstag\w*|birthday)\b/i.test(t)) return { title: t }
  const inPlace = t.match(/^(.+?)\s+(?:in|an der|am|auf der)\s+(.+)$/i)
  if (inPlace && inPlace[1].trim().length >= 2) {
    return { title: inPlace[1].trim(), place: inPlace[2].trim() }
  }
  const street = t.match(/^(.+?)\s+(\S*(?:straße|strasse|weg|platz|gasse|ring|allee)(?:\s+\d+[a-z]?)?)$/i)
  if (street && street[1].trim().length >= 2) {
    return { title: street[1].trim(), place: street[2].trim() }
  }
  const numbered = t.match(/^(.+?)\s+((?:[A-ZÄÖÜ][\wÄÖÜäöüß.-]{2,})\s+\d+[a-z]?)$/)
  if (numbered && numbered[1].trim().length >= 2) {
    return { title: numbered[1].trim(), place: numbered[2].trim() }
  }
  return { title: t }
}

function takeClock(raw: string): { h: number; m: number; span: string } | null {
  const a = CLOCK_TOKEN.exec(raw)
  if (a) {
    const h = Number(a[1])
    const m = a[2] ? Number(a[2]) : 0
    if (Number.isFinite(h) && h >= 0 && h <= 23 && Number.isFinite(m) && m >= 0 && m <= 59) {
      return { h, m, span: a[0] }
    }
  }
  const b = CLOCK_HM.exec(raw)
  if (b) {
    const h = Number(b[1])
    const m = Number(b[2])
    if (Number.isFinite(h) && h >= 0 && h <= 23 && Number.isFinite(m) && m >= 0 && m <= 59) {
      return { h, m, span: b[0] }
    }
  }
  return null
}

function takeWeekday(raw: string): { word: string; span: string } | null {
  const re = new RegExp(`\\b(${WEEKDAY_TOKEN})\\b`, 'i')
  const m = re.exec(raw)
  if (!m) return null
  return { word: m[1].toLowerCase(), span: m[0] }
}

function leftoverTitle(raw: string, ...spans: string[]): string {
  let t = raw
  for (const s of spans) {
    if (!s) continue
    t = t.replace(s, ' ')
  }
  t = t
    .replace(/\b(?:am|um|den|der|die|das|ein|einen|für|termin(?:e)?)\b/gi, ' ')
    .replace(/[.,;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return t
}

function parseWhenBlob(raw: string, now: Date): { start: Date; whenLabel: string; rest: string } | null {
  const blob = raw.replace(/\s+/g, ' ').trim()
  if (!blob) return null
  const clock = takeClock(blob)
  const day = takeWeekday(blob)
  const dated = /^(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?/.exec(blob)
  let start: Date | null = null
  const used: string[] = []
  if (dated) {
    start = dateFromParts(now, dated[1], dated[2], dated[3] || undefined)
    if (start) used.push(dated[0])
  }
  if (!start && day) {
    start = dayFromWord(day.word, now)
    used.push(day.span)
  }
  if (!start) return null
  if (clock) {
    start.setHours(clock.h, clock.m, 0, 0)
    used.push(clock.span)
    if (day && WEEKDAY_JS[day.word] !== undefined && start.getTime() <= now.getTime()) {
      start.setDate(start.getDate() + 7)
    }
  } else {
    start.setHours(18, 0, 0, 0)
  }
  const rest = leftoverTitle(blob, ...used)
  return { start, whenLabel: formatDue(start, now), rest }
}

/** „Samstag Geburtstag Jakob 18 Uhr“ — ohne Pflicht-Präfix „Termin“. */
export function parseBareCreate(text: string, now = new Date()): CalendarIntent | null {
  const t = normalizeCalendarSpeech(text)
  if (!t || t.length > 180) return null
  if (STEAL_BARE.test(t)) return null
  const when = parseWhenBlob(t, now)
  if (!when) return null
  if (!EVENT_HINT.test(t)) return null
  const split = splitTitlePlace(when.rest)
  const title = split.title
  if (!title || title.length < 2 || FOREIGN_TITLE.test(title)) return null
  if (/^\d+$/.test(title)) return null
  return { kind: 'create', title, place: split.place, start: when.start, whenLabel: when.whenLabel }
}

const MOVE =
  /^\s*(?:verschieb(?:e)?|verleg(?:e)?)\s+(?:den\s+)?(?:termin\s+)?(.+?)\s+auf\s+(.+)$/is

function parseMove(text: string, now: Date): CalendarIntent | null {
  const hit = MOVE.exec(text)
  if (!hit) return null
  const query = hit[1].replace(/\s+/g, ' ').replace(/[.!?]+$/g, '').trim()
  const when = parseWhenBlob(hit[2], now)
  if (!query || query.length < 2 || !when) return null
  return { kind: 'move', query, start: when.start, whenLabel: when.whenLabel }
}

const WORD_NUM: Record<string, number> = {
  ein: 1,
  eine: 1,
  einem: 1,
  einer: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,
  elf: 11,
  zwölf: 12,
  fünfzehn: 15,
  zwanzig: 20,
  vierundzwanzig: 24,
  dreißig: 30,
  sechzig: 60,
}

const OFFSET_TOKEN =
  /(?:(\d+)|(ein(?:e[mr]?|e)?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|fünfzehn|zwanzig|vierundzwanzig|dreißig|sechzig))\s*(minuten?|min\.?|stunden?|tag(?:en|e)?)\s*(?:davor|vorher|vor\s+(?:dem\s+)?termin)/gi

const NONE_REMIND =
  /^\s*(?:keine(?:\s+extra)?\s+erinnerung|nicht\s+erinnern|ohne\s+erinnerung|nein,?\s*nicht\s+erinnern)\s*[.!]?\s*$/i
const AT_START =
  /^\s*(?:am\s+termin|zum\s+termin|nur\s+(?:am|zum)\s+(?:termin|start)|nur\s+dann)\s*[.!]?\s*$/i

export type RemindOffsetHit =
  | { kind: 'offsets'; minutes: number[] }
  | { kind: 'none' }
  | { kind: 'at_start' }

function tokenToMinutes(n: number, unit: string): number {
  const u = unit.toLowerCase()
  if (u.startsWith('min')) return n
  if (u.startsWith('stund')) return n * 60
  return n * 24 * 60
}

/** Fristen nach „Wann soll ich Sie erinnern?“. Sonst null — dann kein Kalender-Diebstahl. */
export function parseRemindOffsets(text: string): RemindOffsetHit | null {
  const raw = text.replace(/\s+/g, ' ').trim()
  if (!raw) return null
  if (NONE_REMIND.test(raw)) return { kind: 'none' }
  if (AT_START.test(raw)) return { kind: 'at_start' }
  const minutes: number[] = []
  OFFSET_TOKEN.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = OFFSET_TOKEN.exec(raw))) {
    const n = m[1] ? Number(m[1]) : WORD_NUM[(m[2] || '').toLowerCase()]
    if (!Number.isFinite(n) || n <= 0) continue
    minutes.push(tokenToMinutes(n, m[3] || 'minuten'))
  }
  if (!minutes.length) return null
  const uniq = [...new Set(minutes)].sort((a, b) => b - a).slice(0, 5)
  return { kind: 'offsets', minutes: uniq }
}

export function formatRemindOffsets(minutes: number[]): string {
  if (!minutes.length) return 'keine extra Erinnerung'
  const parts = minutes.map((m) => {
    if (m === 0) return 'am Termin'
    if (m % (24 * 60) === 0) {
      const d = m / (24 * 60)
      return d === 1 ? '1 Tag davor' : `${d} Tage davor`
    }
    if (m % 60 === 0) {
      const h = m / 60
      return h === 1 ? '1 Stunde davor' : `${h} Stunden davor`
    }
    return m === 1 ? '1 Minute davor' : `${m} Minuten davor`
  })
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} und ${parts[parts.length - 1]}`
}
