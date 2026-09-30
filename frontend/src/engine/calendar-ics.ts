import { listEvents, type CalendarEvent } from './store.ts'
import { eventDurationMs, isCalendarRecur } from './calendar-occur.ts'
import { Capacitor } from '@capacitor/core'

/** RFC 5545 Teilmenge, inspiriert von Mozilla ical.js (libical) — ohne npm-Gewicht. */
const PRODID = '-//Jarvis//DE'
const UID_HOST = 'local.jarvis.app'

function pad(n: number, w = 2): string {
  return String(n).padStart(w, '0')
}

function stampLocal(d: Date, allDay: boolean): string {
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  if (allDay) return `${y}${m}${day}`
  return `${y}${m}${day}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function escapeText(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function unescapeText(raw: string): string {
  return raw.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}

function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  let rest = line
  parts.push(rest.slice(0, 75))
  rest = rest.slice(75)
  while (rest.length) {
    parts.push(` ${rest.slice(0, 74)}`)
    rest = rest.slice(74)
  }
  return parts.join('\r\n')
}

function unfold(ics: string): string {
  return ics.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
}

function alarmBlock(minutes: number[]): string[] {
  const out: string[] = []
  for (const m of minutes) {
    const trig = m <= 0 ? 'PT0S' : `-PT${m}M`
    out.push('BEGIN:VALARM', `TRIGGER:${trig}`, 'ACTION:DISPLAY', 'DESCRIPTION:Jarvis · Termin', 'END:VALARM')
  }
  return out
}

export function eventUid(id: string): string {
  const clean = id.replace(/@.*$/, '')
  return `${clean}@${UID_HOST}`
}

export function uidToId(uid: string): string {
  const t = uid.trim()
  if (t.endsWith(`@${UID_HOST}`)) return t.slice(0, -(UID_HOST.length + 1))
  return t.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || t.slice(0, 40)
}

export function eventsToIcs(events: CalendarEvent[], now = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${PRODID}`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']
  const stamp = stampLocal(now, false)
  for (const row of events) {
    const start = new Date(row.start_at)
    if (Number.isNaN(start.getTime())) continue
    const allDay = Boolean(row.all_day)
    const end = row.end_at ? new Date(row.end_at) : new Date(start.getTime() + eventDurationMs(row))
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${eventUid(row.id)}`)
    lines.push(`DTSTAMP:${stamp}`)
    if (allDay) {
      lines.push(`DTSTART;VALUE=DATE:${stampLocal(start, true)}`)
      lines.push(`DTEND;VALUE=DATE:${stampLocal(end, true)}`)
    } else {
      lines.push(`DTSTART:${stampLocal(start, false)}`)
      lines.push(`DTEND:${stampLocal(end, false)}`)
    }
    lines.push(`SUMMARY:${escapeText(row.title || 'Termin')}`)
    if (row.place) lines.push(`LOCATION:${escapeText(row.place)}`)
    if (row.recur === 'weekly') lines.push('RRULE:FREQ=WEEKLY;INTERVAL=1')
    if (row.recur === 'monthly') lines.push('RRULE:FREQ=MONTHLY;INTERVAL=1')
    if (row.recur === 'yearly') lines.push('RRULE:FREQ=YEARLY;INTERVAL=1')
    const mins = row.remind_offsets_min
    if (mins && mins.length) lines.push(...alarmBlock(mins))
    else if (mins === undefined) lines.push(...alarmBlock([0]))
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

function parseStamp(raw: string, allDay: boolean): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(raw.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  if (allDay || !m[4]) return new Date(y, mo, d, 0, 0, 0, 0)
  const h = Number(m[4])
  const mi = Number(m[5] || 0)
  const s = Number(m[6] || 0)
  if (m[7] === 'Z') return new Date(Date.UTC(y, mo, d, h, mi, s))
  return new Date(y, mo, d, h, mi, s)
}

function propsOf(block: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of block.split(/\r?\n/)) {
    const cut = line.indexOf(':')
    if (cut < 1) continue
    const key = line.slice(0, cut).split(';')[0].toUpperCase()
    out[key] = line.slice(cut + 1)
    if (key === 'DTSTART' && /VALUE=DATE/i.test(line.slice(0, cut))) out.DTSTART_ALLDAY = '1'
    if (key === 'RRULE') out.RRULE = line.slice(cut + 1)
  }
  return out
}

function recurFromRrule(raw: string | undefined): CalendarEvent['recur'] {
  if (!raw) return undefined
  const u = raw.toUpperCase()
  if (/\bFREQ=WEEKLY\b/.test(u)) return 'weekly'
  if (/\bFREQ=MONTHLY\b/.test(u)) return 'monthly'
  if (/\bFREQ=YEARLY\b/.test(u)) return 'yearly'
  return undefined
}

function alarmsFromBlock(block: string): number[] | undefined {
  const mins: number[] = []
  const chunks = block.split(/BEGIN:VALARM/i).slice(1)
  for (const chunk of chunks) {
    const trig = /TRIGGER:([^\r\n]+)/i.exec(chunk)?.[1]?.trim() || ''
    if (/^-?P/.test(trig)) {
      const neg = trig.startsWith('-')
      const h = /(?:PT|P).*?(\d+)H/i.exec(trig)
      const m = /(?:PT|P).*?(\d+)M/i.exec(trig)
      const d = /P(\d+)D/i.exec(trig)
      let n = 0
      if (d) n += Number(d[1]) * 24 * 60
      if (h) n += Number(h[1]) * 60
      if (m) n += Number(m[1])
      if (!neg) n = 0
      mins.push(n)
    }
  }
  return mins.length ? [...new Set(mins)].sort((a, b) => b - a).slice(0, 5) : undefined
}

export function icsToEvents(raw: string, now = new Date()): CalendarEvent[] {
  const text = unfold(String(raw || ''))
  if (!/BEGIN:VCALENDAR/i.test(text)) return []
  const blocks = text.split(/BEGIN:VEVENT/i).slice(1)
  const out: CalendarEvent[] = []
  for (const part of blocks) {
    const end = part.search(/END:VEVENT/i)
    const block = end >= 0 ? part.slice(0, end) : part
    const p = propsOf(block)
    const title = unescapeText(p.SUMMARY || '').trim() || 'Termin'
    const allDay = p.DTSTART_ALLDAY === '1' || /^\d{8}$/.test(p.DTSTART || '')
    const start = p.DTSTART ? parseStamp(p.DTSTART.replace(/^[A-Z0-9=-]+?:/, ''), allDay) : null
    if (!start) continue
    const endAt = p.DTEND ? parseStamp(p.DTEND, allDay || /^\d{8}$/.test(p.DTEND)) : null
    const id = uidToId(p.UID || `ics-${out.length}-${start.getTime()}`)
    const place = unescapeText(p.LOCATION || '').trim()
    const recur = recurFromRrule(p.RRULE)
    const row: CalendarEvent = {
      id,
      title,
      start_at: start.toISOString(),
      place,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }
    row.end_at = (endAt || new Date(start.getTime() + (allDay ? 24 * 3600_000 : 3600_000))).toISOString()
    if (allDay) row.all_day = true
    if (isCalendarRecur(recur)) row.recur = recur
    const alarms = alarmsFromBlock(block)
    if (alarms) row.remind_offsets_min = alarms
    out.push(row)
  }
  return out
}

export function looksLikeIcs(raw: string): boolean {
  return /BEGIN:VCALENDAR/i.test(raw) && /BEGIN:VEVENT/i.test(raw)
}

export function icsFilename(at = new Date()): string {
  const y = at.getFullYear()
  const m = String(at.getMonth() + 1).padStart(2, '0')
  const d = String(at.getDate()).padStart(2, '0')
  return `jarvis-kalender-${y}${m}${d}.ics`
}

export async function shareOrDownloadIcs(): Promise<string> {
  const events = await listEvents()
  const name = icsFilename()
  const text = eventsToIcs(events)
  const { saveToDownloads } = await import('../native/device.ts')
  const native = await saveToDownloads(name, text)
  if (native.ok) return `Kalender als ${name} in Downloads. ${events.length} Termine. Ohne Keys.`
  if (typeof document === 'undefined') {
    return `ICS bereit (${events.length} Termine): ${name}`
  }
  if (!Capacitor.isNativePlatform()) {
    const blob = new Blob([text], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
    return `Kalender als ${name} gespeichert. ${events.length} Termine.`
  }
  return native.message || 'ICS nicht geschrieben.'
}
