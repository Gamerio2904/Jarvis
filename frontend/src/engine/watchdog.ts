import { listEvents, loadSettings, saveSettings, type CalendarEvent } from './store.ts'
import { raiseInterrupt, readInterrupt } from './interrupt.ts'

const PLUG_GAP_MS = 5 * 60_000
let lastPlugAt = 0

export type OverlapHit = {
  a: string
  b: string
  fingerprint: string
  question: string
}

/** Two events that start within `spanMs` of each other in the next `horizonMs`. No end_at in v1. */
export function overlappingEvents(
  events: CalendarEvent[],
  now = Date.now(),
  horizonMs = 24 * 3_600_000,
  spanMs = 45 * 60_000,
): OverlapHit | null {
  const soon = events
    .map((e) => ({ title: (e.title || '').trim(), t: new Date(e.start_at).getTime() }))
    .filter((e) => e.title && Number.isFinite(e.t) && e.t >= now - 60_000 && e.t <= now + horizonMs)
    .sort((a, b) => a.t - b.t)
  for (let i = 0; i < soon.length - 1; i += 1) {
    const a = soon[i]
    const b = soon[i + 1]
    if (Math.abs(b.t - a.t) <= spanMs) {
      const fingerprint = `cal:${a.title}|${a.t}|${b.title}|${b.t}`
      const when = (ms: number) =>
        new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      return {
        a: a.title,
        b: b.title,
        fingerprint,
        question: `${a.title} ${when(a.t)} und ${b.title} ${when(b.t)} überlappen. Einen verschieben?`,
      }
    }
  }
  return null
}

function seenFp(): Set<string> {
  try {
    const raw = loadSettings().last_watchdog_fp
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

function rememberFp(fp: string) {
  const next = [...seenFp(), fp].slice(-24)
  saveSettings({ last_watchdog_fp: JSON.stringify(next) })
}

export async function tickWatchdog(force = false): Promise<void> {
  const s = loadSettings()
  if (!s.watchdog) return
  if (readInterrupt()) return

  const events = await listEvents()
  const overlap = overlappingEvents(events)
  if (overlap && !seenFp().has(overlap.fingerprint)) {
    rememberFp(overlap.fingerprint)
    await raiseInterrupt({
      kind: 'calendar',
      question: overlap.question,
      fingerprint: overlap.fingerprint,
    })
    return
  }

  const now = Date.now()
  if (!force && now - lastPlugAt < PLUG_GAP_MS) return
  lastPlugAt = now
  if (!s.plugs_enabled) return
  const { loadPlugs, probePlug } = await import('./plug.ts')
  const plugs = loadPlugs()
  for (const plug of plugs) {
    const fp = `plug:${plug.id}:down`
    if (seenFp().has(fp)) continue
    const probe = await probePlug(plug)
    if (probe.ok) continue
    rememberFp(fp)
    await raiseInterrupt({
      kind: 'plug',
      question: `Steckdose ${plug.name} nicht erreichbar.`,
      fingerprint: fp,
    })
    return
  }
}
