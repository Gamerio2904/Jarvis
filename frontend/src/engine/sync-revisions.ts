export type RevisionVector = Record<string, number>
export type SyncRevision = { schemaVersion: 1; vector: RevisionVector; contentHash: string }
export type RevisionVerdict = 'same' | 'local_newer' | 'remote_newer' | 'conflict'

const VECTOR_KEY = 'jarvis_sync_vector_v1'
const DEVICE_KEY = 'jarvis_sync_device_v1'

function validVector(value: unknown): value is RevisionVector {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.entries(value).every(([id, n]) =>
    /^[0-9a-f-]{36}$/i.test(id) && Number.isSafeInteger(n) && n >= 0,
  )
}

export function parseSyncRevision(value: unknown): SyncRevision | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  if (row.schemaVersion !== 1 || !validVector(row.vector)) return null
  if (typeof row.contentHash !== 'string' || !/^[0-9a-f]{64}$/i.test(row.contentHash)) return null
  return { schemaVersion: 1, vector: { ...row.vector }, contentHash: row.contentHash.toLowerCase() }
}

export function compareRevisions(local: SyncRevision, remote: SyncRevision): RevisionVerdict {
  const ids = new Set([...Object.keys(local.vector), ...Object.keys(remote.vector)])
  let localAhead = false
  let remoteAhead = false
  for (const id of ids) {
    const l = local.vector[id] || 0
    const r = remote.vector[id] || 0
    if (l > r) localAhead = true
    if (r > l) remoteAhead = true
  }
  if (!localAhead && !remoteAhead) return local.contentHash === remote.contentHash ? 'same' : 'conflict'
  if (localAhead && remoteAhead) return 'conflict'
  return localAhead ? 'local_newer' : 'remote_newer'
}

function deviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY) || ''
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export function localRevisionVector(): RevisionVector {
  const raw = localStorage.getItem(VECTOR_KEY)
  if (!raw) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Die lokale Sync-Revision ist beschädigt. Sync bleibt gesperrt.')
  }
  if (!validVector(parsed)) throw new Error('Die lokale Sync-Revision ist ungültig. Sync bleibt gesperrt.')
  return { ...parsed }
}

export function recordLocalRevision(): RevisionVector {
  const vector = localRevisionVector()
  const id = deviceId()
  vector[id] = (vector[id] || 0) + 1
  localStorage.setItem(VECTOR_KEY, JSON.stringify(vector))
  return vector
}

export function mergeVectors(a: RevisionVector, b: RevisionVector): RevisionVector {
  const out: RevisionVector = { ...a }
  for (const [id, n] of Object.entries(b)) out[id] = Math.max(out[id] || 0, n)
  return out
}

export function sameRevision(a: SyncRevision, b: SyncRevision): boolean {
  return a.contentHash === b.contentHash && compareRevisions(a, b) === 'same'
}

/** Nach ausdrücklicher Quellenwahl: Vektor, der beide Seiten überholt. */
export function mergedSuccessorVector(local: RevisionVector, remote: RevisionVector): RevisionVector {
  const merged = mergeVectors(local, remote)
  const id = deviceId()
  merged[id] = (merged[id] || 0) + 1
  return merged
}

export function adoptRevisionVector(value: unknown): void {
  if (!validVector(value)) throw new Error('Die übertragene Sync-Revision ist ungültig.')
  localStorage.setItem(VECTOR_KEY, JSON.stringify(value))
}

export async function contentHash(value: unknown): Promise<string> {
  const canonical = stable(value)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(canonical)))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function revisionFor(value: Record<string, unknown>): Promise<SyncRevision> {
  const content = { ...value }
  delete content.sync_revision
  delete content.sync_hash
  delete content.exported_at
  delete content.stand_at
  return {
    schemaVersion: 1,
    vector: localRevisionVector(),
    contentHash: await contentHash(content),
  }
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) {
    const rows = value.map(stable)
    if (rows.every((row) => row && typeof row === 'object' && !Array.isArray(row) && 'id' in row)) {
      return rows.sort((a, b) => String((a as { id: unknown }).id).localeCompare(String((b as { id: unknown }).id)))
    }
    return rows
  }
  if (!value || typeof value !== 'object') return value
  const input = value as Record<string, unknown>
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stable(input[key])]))
}
