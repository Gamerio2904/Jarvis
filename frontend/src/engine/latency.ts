/** Mouth-to-ear marks. Bands from voice-agent research (~200 ms human gap). */

export type LatencyPath = 'parser' | 'gemini' | 'groq' | 'local' | 'none'

export type LatencyTurn = {
  path: LatencyPath
  msTotal: number
  msFirstToken: number | null
  msFirstAudio: number | null
  at: string
}

type OpenTurn = {
  t0: number
  path: LatencyPath
  firstToken?: number
  firstAudio?: number
}

const MAX_LOG = 24

let open: OpenTurn | null = null
let last: LatencyTurn | null = null
const log: LatencyTurn[] = []
const listeners = new Set<() => void>()

function emit() {
  for (const fn of listeners) {
    try {
      fn()
    } catch {
      /* ignore */
    }
  }
}

export function subscribeLatency(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function startLatency(path: LatencyPath = 'none') {
  open = { t0: Date.now(), path }
}

export function setLatencyPath(path: LatencyPath) {
  if (open) open.path = path
}

export function markFirstToken() {
  if (open && open.firstToken == null) open.firstToken = Date.now()
}

export function markFirstAudio() {
  if (open && open.firstAudio == null) open.firstAudio = Date.now()
}

export function finishLatency(): LatencyTurn | null {
  if (!open) return last
  const now = Date.now()
  last = {
    path: open.path,
    msTotal: now - open.t0,
    msFirstToken: open.firstToken != null ? open.firstToken - open.t0 : null,
    msFirstAudio: open.firstAudio != null ? open.firstAudio - open.t0 : null,
    at: new Date().toISOString(),
  }
  log.push(last)
  if (log.length > MAX_LOG) log.shift()
  open = null
  emit()
  return last
}

export function lastLatency(): LatencyTurn | null {
  return last
}

export function latencyP95(field: 'msTotal' | 'msFirstToken' | 'msFirstAudio' = 'msTotal'): number | null {
  const vals = log.map((t) => t[field]).filter((n): n is number => n != null)
  if (!vals.length) return null
  const s = [...vals].sort((a, b) => a - b)
  const i = Math.min(s.length - 1, Math.max(0, Math.ceil(0.95 * s.length) - 1))
  return s[i]
}

export function latencyLog(): LatencyTurn[] {
  return [...log]
}

export function latencyBand(ms: number): 'gut' | 'ok' | 'langsam' {
  if (ms <= 350) return 'gut'
  if (ms <= 800) return 'ok'
  return 'langsam'
}

const PATH_LABEL: Record<LatencyPath, string> = {
  parser: 'Parser',
  gemini: 'Gemini',
  groq: 'Groq',
  local: '0,5B',
  none: 'Hirn',
}

export function formatLatency(t: LatencyTurn | null = last): string {
  if (!t) return ''
  const parts = [PATH_LABEL[t.path]]
  if (t.msFirstToken != null) parts.push(`Hirn ${t.msFirstToken} ms`)
  if (t.msFirstAudio != null) parts.push(`Stimme ${t.msFirstAudio} ms`)
  parts.push(`gesamt ${t.msTotal} ms`)
  const probe = t.msFirstAudio ?? t.msFirstToken ?? t.msTotal
  parts.push(latencyBand(probe))
  return parts.join(' · ')
}
