/** Hierarchical Memory: Quelle, Confidence, Bereinigung. Kein Lance, kein Embedding-Router. */

export type MemoryLayer = 'sensory' | 'working' | 'episodic' | 'semantic'
export type MemoryOrigin = 'user' | 'sleep' | 'tool'

export const MEMORY_PIN_MIN = 0.55
export const MEMORY_PRUNE_CONF = 0.35
export const MEMORY_LTM_CAP = 80
export const MEMORY_STALE_MS = 14 * 24 * 60 * 60 * 1000

export function confidenceFor(origin: MemoryOrigin, category = ''): number {
  if (origin === 'sleep') return 0.4
  if (origin === 'tool') return 0.8
  if (category === 'pref') return 0.9
  return 0.95
}

export function expiresFor(origin: MemoryOrigin, category: string, now = Date.now()): string | null {
  if (origin === 'sleep') return new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString()
  if (category === 'open_loop') return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
  return null
}

export type MemoryRow = {
  id: string
  key: string
  value: string
  category: string
  confidence: number
  updated_at: string
  expires_at?: string | null
  origin?: MemoryOrigin
}

export function effectiveConfidence(row: { confidence?: number; origin?: MemoryOrigin }): number {
  if (typeof row.confidence === 'number' && row.confidence > 0) return row.confidence
  return confidenceFor(row.origin || 'user')
}

export function isPinnedKey(key: string, category = ''): boolean {
  return key === 'name' || key === 'zuhause' || category === 'boundary'
}

export function dumpLikeValue(value: string): boolean {
  const t = (value || '').replace(/\s+/g, ' ').trim()
  if (!t) return true
  if (/^\s*gefunden:/i.test(t)) return true
  const colons = (t.match(/:\s/g) || []).length
  if (colons >= 4 && t.length > 100) return true
  return false
}

export function shouldPruneRow(row: MemoryRow, now = Date.now()): boolean {
  const v = (row.value || '').trim()
  if (!v) return true
  if (dumpLikeValue(v)) return true
  if (row.expires_at && Date.parse(row.expires_at) < now) return true
  if (isPinnedKey(row.key, row.category)) return false
  const conf = effectiveConfidence(row)
  const age = now - Date.parse(row.updated_at || '')
  if (conf < MEMORY_PRUNE_CONF && Number.isFinite(age) && age > MEMORY_STALE_MS) return true
  return false
}

export function pruneMemoryItems(items: MemoryRow[], now = Date.now()): { keep: MemoryRow[]; drop: MemoryRow[] } {
  const drop: MemoryRow[] = []
  const keep: MemoryRow[] = []
  for (const row of items) {
    if (shouldPruneRow(row, now)) drop.push(row)
    else keep.push(row)
  }
  if (keep.length <= MEMORY_LTM_CAP) return { keep, drop }
  const pinned = keep.filter((r) => isPinnedKey(r.key, r.category))
  const rest = keep
    .filter((r) => !isPinnedKey(r.key, r.category))
    .sort((a, b) => {
      const dc = effectiveConfidence(b) - effectiveConfidence(a)
      if (dc) return dc
      return (b.updated_at || '').localeCompare(a.updated_at || '')
    })
  const room = Math.max(0, MEMORY_LTM_CAP - pinned.length)
  const keptRest = rest.slice(0, room)
  const overflow = rest.slice(keptRest.length)
  return { keep: [...pinned, ...keptRest], drop: [...drop, ...overflow] }
}

export function contradictionTargets<T extends { key: string; value: string }>(items: T[], needle: string): T[] {
  const n = needle.toLowerCase().replace(/[.!?,;:]+$/g, '').trim()
  if (n.length < 3) return []
  return items.filter((m) => {
    const key = m.key.toLowerCase()
    const val = m.value.toLowerCase()
    if (val.includes(n) || key.includes(n) || key === n) return true
    if ((key === 'getränk' || key === 'essen') && val.includes(n)) return true
    return false
  })
}

export type MemoryObs = {
  stored?: boolean
  removed?: boolean
  key?: string
  value?: string
  confidence?: number
  origin?: string
  hits?: number
  cited?: boolean
  remaining?: number
}

export function memoryWriteVerified(obs: MemoryObs): { ok: boolean; error?: string } {
  if (!obs.stored) return { ok: false, error: 'Nicht gespeichert.' }
  if (!String(obs.key || '').trim() || !String(obs.value || '').trim()) {
    return { ok: false, error: 'Fakt leer.' }
  }
  return { ok: true }
}

export function memoryForgetVerified(obs: MemoryObs): { ok: boolean; error?: string } {
  if (obs.removed && !obs.stored) return { ok: true }
  return { ok: false, error: 'Noch da.' }
}

export function memoryRecallVerified(obs: MemoryObs): { ok: boolean; error?: string } {
  if (Number(obs.hits) > 0 && !obs.cited) return { ok: false, error: 'Treffer ohne Quelle.' }
  return { ok: true }
}

export function semanticPins<T extends { key: string; category?: string; confidence?: number; origin?: MemoryOrigin }>(
  items: T[],
): T[] {
  return items.filter((m) => effectiveConfidence(m) >= MEMORY_PIN_MIN)
}
