export type TimerIntent =
  | { kind: 'create'; title: string; due: Date; whenLabel: string; ms: number }
  | { kind: 'stop' }
  | { kind: 'list' }

const UNIT = 'sekunden?|minuten?|stunden?'

function relMs(n: number, unit: string): number {
  const u = unit.toLowerCase()
  if (u.startsWith('sek')) return n * 1000
  if (u.startsWith('min')) return n * 60_000
  return n * 3_600_000
}

function label(ms: number): string {
  if (ms < 90_000) return `in ${Math.max(1, Math.round(ms / 1000))} Sekunden`
  if (ms < 90 * 60_000) return `in ${Math.max(1, Math.round(ms / 60_000))} Minuten`
  return `in ${Math.round(ms / 3_600_000)} Stunden`
}

function titleOf(raw: string | undefined): string {
  const t = (raw || '').replace(/^[,\s.:;-]+/, '').replace(/[.!?]+$/, '').trim()
  return t || 'Timer'
}

export function parseTimerIntent(text: string, now = new Date()): TimerIntent | null {
  const t = text.trim()
  if (!t || t.length > 160) return null
  if (/^(?:timer\s+(?:aus|stopp|stop|abbrechen)|stopp(?:e)?\s+(?:den\s+)?timer|timer\s+löschen)$/i.test(t)) {
    return { kind: 'stop' }
  }
  if (/^(?:zeig(?:e)?\s+(?:mir\s+)?(?:den\s+|die\s+)?)?timer(?:s)?\s*\??$/i.test(t)) {
    return { kind: 'list' }
  }
  const a = new RegExp(
    `^(?:stell(?:e)?\\s+(?:einen\\s+|den\\s+)?timer\\s+(?:auf\\s+|für\\s+)?|timer\\s+(?:auf\\s+|für\\s+)?)(\\d+)\\s+(${UNIT})(?:\\s+(.+))?$`,
    'i',
  ).exec(t)
  const b = new RegExp(`^(\\d+)\\s+(${UNIT})\\s+timer(?:\\s+(.+))?$`, 'i').exec(t)
  const m = a || b
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n) || n <= 0) return null
  const ms = relMs(n, m[2])
  if (ms < 5_000 || ms > 12 * 3_600_000) return null
  const due = new Date(now.getTime() + ms)
  return { kind: 'create', title: titleOf(m[3]), due, whenLabel: label(ms), ms }
}
