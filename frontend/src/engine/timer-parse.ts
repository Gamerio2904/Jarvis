import { cleanTimerTitle } from './timer-announce.ts'
import { expandZahlenworte } from './zahlenworte.ts'
import { normalizeUtterance } from './utterance.ts'

export type TimerIntent =
  | { kind: 'create'; title: string; due: Date; whenLabel: string; ms: number }
  | { kind: 'stop' }
  | { kind: 'list' }

const UNIT = 'sekunden?|minuten?|min\\.?|inuten|stunden?|std\\.?'

function relMs(n: number, unit: string): number {
  const u = unit.toLowerCase()
  if (u.startsWith('sek')) return n * 1000
  if (u.startsWith('min') || u.startsWith('inu')) return n * 60_000
  return n * 3_600_000
}

function label(ms: number): string {
  if (ms < 90_000) return `in ${Math.max(1, Math.round(ms / 1000))} Sekunden`
  if (ms <= 90 * 60_000) return `in ${Math.max(1, Math.round(ms / 60_000))} Minuten`
  return `in ${Math.round(ms / 3_600_000)} Stunden`
}

function titleOf(raw: string | undefined): string {
  return cleanTimerTitle(raw || '') || 'Timer'
}

export function parseTimerIntent(text: string, now = new Date()): TimerIntent | null {
  const t = normalizeUtterance(expandZahlenworte(text.trim()))
  if (!t || t.length > 160) return null
  if (
    /^(?:timer\s+(?:aus|stopp(?:en)?|stop|abbrechen|löschen|loeschen)|(?:stopp(?:e|en)?|lösch(?:e)?|loesch(?:e)?|brich)\s+(?:den\s+)?timer(?:\s+ab)?)$/i.test(
      t,
    )
  ) {
    return { kind: 'stop' }
  }
  if (/^\s*(?:nein|nee+),?\s+das\s+war\s+(?:der\s+|die\s+|das\s+)?timer\s*[.!]?\s*$/i.test(t)) {
    return { kind: 'list' }
  }
  if (
    /^(?:zeig(?:e)?\s+(?:mir\s+)?(?:den\s+|die\s+)?)?timer(?:s)?\s*\??$/i.test(t) ||
    /^\s*wann\s+l[aä]uft\s+(?:der\s+)?timer(?:\s+ab)?\s*\??$/i.test(t) ||
    /^\s*wie\s+lange\s+(?:l[aä]uft\s+)?(?:der\s+)?timer\s*\??$/i.test(t)
  ) {
    return { kind: 'list' }
  }
  const lead = String.raw`(?:(?:erstell(?:e)?|stell(?:e)?)\s+(?:mir\s+|bitte\s+|mal\s+)*(?:einen\s+|den\s+)?timer\s+(?:auf\s+|für\s+|fuer\s+|in\s+)?|timer\s+(?:auf\s+|für\s+|fuer\s+|in\s+)?)`
  const amount = String.raw`(\d+(?:[.,]\d+)?)\s*(${UNIT})(?:\s+(?:und\s+)?(\d+(?:[.,]\d+)?)\s*(${UNIT}))?`
  const a = new RegExp(`^${lead}${amount}(?:\\s+(?:für\\s+)?(.+))?$`, 'i').exec(t)
  const b = new RegExp(`^${amount}\\s+timer(?:\\s+(?:für\\s+)?(.+))?$`, 'i').exec(t)
  const c = new RegExp(
    `^(?:(?:erstell(?:e)?|stell(?:e)?)\\s+(?:einen\\s+|den\\s+)?)?timer\\s+für\\s+(.+?)\\s+(\\d+)\\s*(${UNIT})$`,
    'i',
  ).exec(t)
  if (c && !a && !b) {
    const n = Number(c[2])
    if (!Number.isFinite(n) || n <= 0) return null
    const ms = relMs(n, c[3])
    if (ms < 5_000 || ms > 12 * 3_600_000) return null
    const due = new Date(now.getTime() + ms)
    return { kind: 'create', title: titleOf(c[1]), due, whenLabel: label(ms), ms }
  }
  const m = a || b
  if (!m) return null
  const n = Number(String(m[1]).replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  let ms = relMs(n, m[2])
  if (m[3] && m[4]) {
    const extra = Number(String(m[3]).replace(',', '.'))
    if (Number.isFinite(extra) && extra > 0) ms += relMs(extra, m[4])
  }
  if (ms < 5_000 || ms > 12 * 3_600_000) return null
  const due = new Date(now.getTime() + ms)
  return { kind: 'create', title: titleOf(m[5]), due, whenLabel: label(ms), ms }
}
