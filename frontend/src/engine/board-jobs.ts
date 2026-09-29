/** Jobs auf der Tafel: Recherche/Plan in einem Handler. Kein Schwarm. */

export const BOARD_JOB_TTL_MS = 15 * 60 * 1000
export const BOARD_JOB_CAP = 4

export type BoardJobKind = 'research' | 'plan' | 'catalog' | 'propose'
export type BoardJobStatus = 'pending' | 'running' | 'done' | 'failed' | 'stopped'

export type BoardJob = {
  id: string
  kind: BoardJobKind
  status: BoardJobStatus
  label: string
  at: number
}

export function parseBoardJobs(raw?: string | null): BoardJob[] {
  if (!raw) return []
  try {
    const rows = JSON.parse(raw) as unknown
    if (!Array.isArray(rows)) return []
    const now = Date.now()
    const out: BoardJob[] = []
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue
      const o = row as Record<string, unknown>
      const id = String(o.id || '').trim()
      const kind = o.kind
      const status = o.status
      const label = String(o.label || '').trim().slice(0, 80)
      const at = typeof o.at === 'number' ? o.at : 0
      if (!id || !label) continue
      if (kind !== 'research' && kind !== 'plan' && kind !== 'catalog' && kind !== 'propose') continue
      if (status !== 'pending' && status !== 'running' && status !== 'done' && status !== 'failed' && status !== 'stopped') {
        continue
      }
      if (now - at > BOARD_JOB_TTL_MS && status !== 'done' && status !== 'failed' && status !== 'stopped') continue
      out.push({ id, kind, status, label, at })
      if (out.length >= BOARD_JOB_CAP) break
    }
    return out
  } catch {
    return []
  }
}

export function serializeBoardJobs(rows: BoardJob[]): string {
  return JSON.stringify(rows.slice(0, BOARD_JOB_CAP))
}

export function upsertJob(rows: BoardJob[], job: BoardJob): BoardJob[] {
  const next = rows.filter((r) => r.id !== job.id)
  next.unshift(job)
  return next.slice(0, BOARD_JOB_CAP)
}

export function stopJobs(rows: BoardJob[]): BoardJob[] {
  return rows.map((r) =>
    r.status === 'running' || r.status === 'pending' ? { ...r, status: 'stopped' as const } : r,
  )
}
