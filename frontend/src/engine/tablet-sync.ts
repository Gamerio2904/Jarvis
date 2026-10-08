import { applyBackup, asBackup, buildBackup, type HausBackup } from './backup.ts'
import { APP_VERSION, loadSettings, muteStand, saveSettings, setStandAt, type Settings } from './store.ts'
import { compareStands, type SyncVerdict } from './sync-compare.ts'
import { hausDiscover, hausPull, hausPush, hausServerStart, hausServerUpdate } from '../native/haus.ts'
import { secureDelete, secureGet, securePut } from '../native/device.ts'
import {
  adoptRevisionVector,
  compareRevisions,
  contentHash,
  localRevisionVector,
  mergedSuccessorVector,
  parseSyncRevision,
  sameRevision,
  type SyncRevision,
} from './sync-revisions.ts'

const EPOCH = '1970-01-01T00:00:00.000Z'

export type SyncOutcome =
  | { kind: 'skip'; line: string }
  | { kind: 'none'; line: string }
  | { kind: 'pulled'; line: string }
  | { kind: 'pushed'; line: string }
  | { kind: 'conflict'; line: string; ticket?: ConflictTicket }
  | { kind: 'error'; line: string }

/** Bindet die Nutzerwahl an genau diese beiden Revisionen. */
export type ConflictTicket = { local: SyncRevision; remote: SyncRevision }
export type ConflictChoice = 'local' | 'remote'

const TICKET_TTL_MS = 10 * 60_000
let pendingConflict: { ticket: ConflictTicket; at: number } | null = null

export function rememberConflict(ticket: ConflictTicket | undefined): void {
  pendingConflict = ticket ? { ticket, at: Date.now() } : null
}

export function takePendingConflict(now = Date.now()): ConflictTicket | null {
  const hit = pendingConflict
  pendingConflict = null
  return hit && now - hit.at <= TICKET_TTL_MS ? hit.ticket : null
}

export function normalizeStand(raw: string): string {
  return raw && Number.isFinite(Date.parse(raw)) ? raw : EPOCH
}

export function verdictFor(localAt: string, remoteAt: string): SyncVerdict {
  return compareStands(normalizeStand(localAt), normalizeStand(remoteAt))
}

/** Pin und Schlüssel werden nur durch den bestätigten QR-Kopplungsschritt verteilt. */
export function parsePairCode(raw: string): { url: string; token: string; port: number; fingerprint: string } | null {
  const m = /^jarvis-haus:v3\|(https:\/\/[^\s|]+)\|([0-9a-f]{16,64})\|([0-9a-f]{64})$/i.exec(raw.trim())
  if (!m) return null
  try {
    const u = new URL(m[1])
    const host = u.hostname
    const privateHost = /^10\.(?:\d{1,3}\.){2}\d{1,3}$/.test(host)
      || /^192\.168\.(?:\d{1,3}\.)\d{1,3}$/.test(host)
    if (
      u.protocol !== 'https:' ||
      !privateHost ||
      u.username ||
      u.password ||
      u.search ||
      u.hash ||
      u.pathname !== '/' ||
      !Number.isInteger(Number(u.port || 8765))
    ) return null
    return { url: `https://${u.host}`, token: m[2], port: Number(u.port) || 8765, fingerprint: m[3].toLowerCase() }
  } catch {
    return null
  }
}

const SYNC_TOKEN_KEY = 'haus-sync-token'

export async function savePairing(url: string, token: string, fingerprint: string): Promise<void> {
  await securePut(SYNC_TOKEN_KEY, token)
  saveSettings({ sync_url: url, sync_token: '', sync_fingerprint: fingerprint })
}

export async function clearPairing(): Promise<void> {
  await secureDelete(SYNC_TOKEN_KEY)
  saveSettings({ sync_url: '', sync_token: '', sync_fingerprint: '' })
}

async function syncToken(): Promise<string | null> {
  const secure = await secureGet(SYNC_TOKEN_KEY)
  if (secure) {
    if (loadSettings().sync_token) saveSettings({ sync_token: '' })
    return secure
  }
  const legacy = loadSettings().sync_token
  if (!legacy) return null
  await securePut(SYNC_TOKEN_KEY, legacy)
  saveSettings({ sync_token: '' })
  return legacy
}

export async function isPaired(): Promise<boolean> {
  const s = loadSettings()
  const token = await syncToken()
  return Boolean(token && token.length >= 12 && /^[0-9a-f]{64}$/i.test(s.sync_fingerprint))
}

const LOCAL_KEYS = ['tablet_mode', 'sync_url', 'sync_token', 'sync_fingerprint', 'wake_word', 'hud_force', 'hud_hidden', 'hud_view', 'tischplatte_on'] as const

/** Geräteeigene Schalter bleiben, auch wenn der Hausstand sonst ersetzt wird. */
export function pickLocal(s: Settings): Partial<Settings> {
  const out: Record<string, unknown> = {}
  for (const k of LOCAL_KEYS) out[k] = s[k]
  return out as Partial<Settings>
}

/** Fremden Stand sicher einspielen; bei einem Fehler kommt der eigene Stand zurück. */
export type RecoveryOutcome =
  | { ok: true }
  | { ok: false; error: string; restored: boolean; restoreError?: string }

export async function applyWithRecovery(
  apply: () => Promise<void>,
  restore: () => Promise<void>,
): Promise<RecoveryOutcome> {
  try {
    await apply()
    return { ok: true }
  } catch (error) {
    try {
      await restore()
      return { ok: false, error: errorLine(error), restored: true }
    } catch (restoreError) {
      return { ok: false, error: errorLine(error), restored: false, restoreError: errorLine(restoreError) }
    }
  }
}

export async function applyRemoteStand(data: HausBackup, vector?: SyncRevision['vector']): Promise<boolean> {
  const remoteRevision = parseSyncRevision(data.sync_revision)
  if (!remoteRevision) return false
  if ((await contentHash(backupContent(data))) !== remoteRevision.contentHash) return false
  const before = await buildBackup(true)
  const beforeVector = localRevisionVector()
  const keep = loadSettings()
  const local = pickLocal(keep)
  muteStand(true)
  try {
    const outcome = await applyWithRecovery(
      async () => {
        await applyBackup(data)
        saveSettings(local)
        adoptRevisionVector(vector || remoteRevision.vector)
        setStandAt(data.stand_at || new Date().toISOString())
      },
      async () => {
      await applyBackup(before)
      saveSettings(local)
      adoptRevisionVector(beforeVector)
      setStandAt(before.stand_at || '')
      },
    )
    if (!outcome.ok && !outcome.restored) {
      throw new Error(
        `Sync-Anwendung fehlgeschlagen (${outcome.error}); Wiederherstellung fehlgeschlagen (${outcome.restoreError || 'unbekannter Fehler'}).`,
      )
    }
    return outcome.ok
  } finally {
    muteStand(false)
  }
}

function errorLine(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Handy: Server finden und nur kausal geordnete, verifizierte Stände übertragen. */
export async function syncWithTablet(): Promise<SyncOutcome> {
  const s = loadSettings()
  if (s.tablet_mode) return { kind: 'skip', line: '' }
  const token = await syncToken()
  if (!token || token.length < 12 || !/^[0-9a-f]{64}$/i.test(s.sync_fingerprint)) return { kind: 'skip', line: '' }
  const port = Number(/:(\d+)$/.exec(s.sync_url)?.[1]) || 8765
  const hint = /^https:\/\/([^:/]+)/.exec(s.sync_url)?.[1] || ''
  const found = await hausDiscover(token, s.sync_fingerprint, hint, port)
  if (!found.ok || !found.url) return { kind: 'error', line: found.message || 'Kein sicherer Server im lokalen Netz gefunden.' }
  if (found.appVersion !== APP_VERSION || found.protocolVersion !== 3 || found.fingerprint !== s.sync_fingerprint) {
    return { kind: 'error', line: `Versions- oder Sicherheitsabweichung. Lokal ${APP_VERSION}, Server ${found.appVersion || 'unbekannt'}. Nichts übertragen.` }
  }
  if (found.url !== s.sync_url) saveSettings({ sync_url: found.url })
  const mine = await buildBackup(true)
  const localRevision = parseSyncRevision(mine.sync_revision)
  const remoteRevision = parseSyncRevision(found.syncRevision ? safeJson(found.syncRevision) : null)
  if (!localRevision || !remoteRevision) {
    return { kind: 'error', line: 'Eine Geräte-Revision fehlt oder ist ungültig. Nichts übertragen.' }
  }
  const verdict = compareRevisions(localRevision, remoteRevision)
  const dataUrl = found.url
  if (verdict === 'same') return { kind: 'none', line: 'Hausstand ist aktuell.' }
  if (verdict === 'conflict') {
    return {
      kind: 'conflict',
      line: 'Beide Geräte haben unterschiedliche Änderungen. Beide Stände bleiben erhalten; bitte Quelle und Ziel ausdrücklich wählen.',
      ticket: { local: localRevision, remote: remoteRevision },
    }
  }
  if (verdict === 'remote_newer') {
    const got = await hausPull(dataUrl, token, s.sync_fingerprint)
    const data = got.ok && got.json ? asBackup(safeJson(got.json)) : null
    if (!data?.sync_revision) return { kind: 'error', line: 'Hausstand vom Tablet oder seine Revision ist ungültig. Nichts geändert.' }
    if (
      data.sync_revision.contentHash !== remoteRevision.contentHash ||
      compareRevisions(localRevision, data.sync_revision) !== 'remote_newer' ||
      (await contentHash(backupContent(data))) !== data.sync_revision.contentHash
    ) {
      return { kind: 'error', line: 'Der Hausstand hat sich während des Abgleichs geändert oder die Prüfsumme stimmt nicht. Nichts geändert.' }
    }
    const ok = await applyRemoteStand(data)
    return ok
      ? { kind: 'pulled', line: 'Hausstand vom Tablet übernommen.' }
      : { kind: 'error', line: 'Übernahme fehlgeschlagen. Alter Stand ist zurück.' }
  }
  const sent = await hausPush(dataUrl, JSON.stringify(mine), token, s.sync_fingerprint)
  const ack = sent.ok && sent.json ? safeJson(sent.json) as { status?: string; sync_revision?: unknown } : null
  const acknowledged = parseSyncRevision(ack?.sync_revision)
  if (ack?.status === 'applied' && acknowledged?.contentHash === localRevision.contentHash &&
      compareRevisions(localRevision, acknowledged) === 'same') {
    adoptRevisionVector(acknowledged.vector)
    return { kind: 'pushed', line: 'Der neuere Hausstand wurde übertragen und bestätigt.' }
  }
  if (ack?.status === 'conflict') {
    return { kind: 'conflict', line: 'Das Tablet hat eigene Änderungen. Beide Stände bleiben erhalten; bitte Quelle und Ziel ausdrücklich wählen.' }
  }
  return { kind: 'error', line: sent.message || 'Die Übernahme auf dem Tablet wurde nicht bestätigt. Der lokale Stand bleibt erhalten.' }
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function backupContent(data: HausBackup): Record<string, unknown> {
  const content = { ...data } as Record<string, unknown>
  delete content.sync_revision
  delete content.sync_hash
  delete content.exported_at
  delete content.stand_at
  return content
}

/** Tablet: Server starten und aktuellen Stand bereitlegen. */
export async function startTabletServer(rotate = false) {
  const data = await buildBackup(true)
  return hausServerStart(JSON.stringify(data), data.stand_at || '', rotate)
}

export async function refreshTabletServer(): Promise<boolean> {
  const data = await buildBackup(true)
  return hausServerUpdate(JSON.stringify(data), data.stand_at || '')
}

/** Tablet: Handy hat einen neueren Stand geschickt. Nur dann einspielen. */
export async function acceptIncomingStand(json: string): Promise<{ status: 'applied' | 'same' | 'conflict' | 'failed'; syncRevision?: SyncRevision }> {
  const data = asBackup(safeJson(json))
  if (!data?.sync_revision) return { status: 'failed' }
  const mine = await buildBackup(true)
  const local = parseSyncRevision(mine.sync_revision)
  if (!local || (await contentHash(backupContent(data))) !== data.sync_revision.contentHash) return { status: 'failed' }
  const verdict = compareRevisions(local, data.sync_revision)
  if (verdict === 'same') return { status: 'same', syncRevision: local }
  if (verdict !== 'remote_newer') return { status: 'conflict' }
  if (!(await applyRemoteStand(data))) return { status: 'failed' }
  const applied = await buildBackup(true)
  return applied.sync_revision
    ? { status: 'applied', syncRevision: applied.sync_revision }
    : { status: 'failed' }
}

/**
 * Konflikt auflösen: nur mit Ticket aus syncWithTablet und nur, wenn beide
 * Seiten noch exakt den damals gezeigten Stand haben. Danach überholt der
 * Vektor beide Seiten, sodass kein weiterer Konflikt entsteht.
 */
export async function resolveSyncConflict(choice: ConflictChoice, ticket: ConflictTicket): Promise<SyncOutcome> {
  const s = loadSettings()
  const token = await syncToken()
  if (s.tablet_mode || !token || token.length < 12 || !/^[0-9a-f]{64}$/i.test(s.sync_fingerprint)) return { kind: 'skip', line: '' }
  const port = Number(/:(\d+)$/.exec(s.sync_url)?.[1]) || 8765
  const hint = /^https:\/\/([^:/]+)/.exec(s.sync_url)?.[1] || ''
  const found = await hausDiscover(token, s.sync_fingerprint, hint, port)
  if (!found.ok || !found.url) return { kind: 'error', line: found.message || 'Kein sicherer Server im lokalen Netz gefunden.' }
  if (found.appVersion !== APP_VERSION || found.protocolVersion !== 3 || found.fingerprint !== s.sync_fingerprint) {
    return { kind: 'error', line: 'Versions- oder Sicherheitsabweichung. Nichts übertragen.' }
  }
  const mine = await buildBackup(true)
  const localNow = parseSyncRevision(mine.sync_revision)
  const remoteNow = parseSyncRevision(found.syncRevision ? safeJson(found.syncRevision) : null)
  const stale = { kind: 'error', line: 'Einer der Stände hat sich seit der Anzeige geändert. Nichts überschrieben; bitte neu abgleichen.' } as const
  if (!localNow || !remoteNow || !sameRevision(localNow, ticket.local) || !sameRevision(remoteNow, ticket.remote)) return stale

  const previous = localRevisionVector()
  const successor = mergedSuccessorVector(ticket.local.vector, ticket.remote.vector)
  if (choice === 'remote') {
    const got = await hausPull(found.url, token, s.sync_fingerprint)
    const data = got.ok && got.json ? asBackup(safeJson(got.json)) : null
    if (!data?.sync_revision || !sameRevision(data.sync_revision, ticket.remote) ||
        (await contentHash(backupContent(data))) !== data.sync_revision.contentHash) {
      return stale
    }
    return (await applyRemoteStand(data, successor))
      ? { kind: 'pulled', line: 'Tablet-Stand übernommen. Der bisherige Handy-Stand wurde vorher gesichert.' }
      : { kind: 'error', line: 'Übernahme fehlgeschlagen. Alter Stand ist zurück.' }
  }
  adoptRevisionVector(successor)
  try {
    const next = await buildBackup(true)
    const nextRev = parseSyncRevision(next.sync_revision)
    const sent = await hausPush(found.url, JSON.stringify(next), token, s.sync_fingerprint)
    const ack = sent.ok && sent.json ? safeJson(sent.json) as { status?: string; sync_revision?: unknown } : null
    const acked = parseSyncRevision(ack?.sync_revision)
    if (ack?.status === 'applied' && nextRev && acked && sameRevision(nextRev, acked)) {
      return { kind: 'pushed', line: 'Handy-Stand auf das Tablet übertragen und bestätigt.' }
    }
    adoptRevisionVector(previous)
    return { kind: 'error', line: sent.message || 'Das Tablet hat die Übernahme nicht bestätigt. Beide Stände bleiben unverändert.' }
  } catch {
    adoptRevisionVector(previous)
    return { kind: 'error', line: 'Übertragung fehlgeschlagen. Beide Stände bleiben unverändert.' }
  }
}
