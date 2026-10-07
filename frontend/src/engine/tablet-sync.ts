import { applyBackup, asBackup, buildBackup, type HausBackup } from './backup.ts'
import { loadSettings, muteStand, saveSettings, setStandAt, standAt, type Settings } from './store.ts'
import { compareStands, syncAction, type SyncVerdict } from './sync-compare.ts'
import { hausDiscover, hausPull, hausPush, hausServerStart, hausServerUpdate } from '../native/haus.ts'

const EPOCH = '1970-01-01T00:00:00.000Z'

export type SyncOutcome =
  | { kind: 'skip'; line: string }
  | { kind: 'none'; line: string }
  | { kind: 'pulled'; line: string }
  | { kind: 'pushed'; line: string }
  | { kind: 'error'; line: string }

export function normalizeStand(raw: string): string {
  return raw && Number.isFinite(Date.parse(raw)) ? raw : EPOCH
}

export function verdictFor(localAt: string, remoteAt: string): SyncVerdict {
  return compareStands(normalizeStand(localAt), normalizeStand(remoteAt))
}

/** Kopplungscode des Tablets: jarvis-haus:v2|http://ip:port|token */
export function parsePairCode(raw: string): { url: string; token: string; port: number } | null {
  const m = /^jarvis-haus:v2\|(https?:\/\/[^\s|]+)\|([0-9a-f]{16,64})$/i.exec(raw.trim())
  if (!m) return null
  try {
    const u = new URL(m[1])
    if (u.protocol !== 'http:') return null
    return { url: `http://${u.host}`, token: m[2], port: Number(u.port) || 8765 }
  } catch {
    return null
  }
}

export function savePairing(url: string, token: string): void {
  saveSettings({ sync_url: url, sync_token: token })
}

export function isPaired(): boolean {
  const s = loadSettings()
  return Boolean(s.sync_token && s.sync_token.length >= 12)
}

const LOCAL_KEYS = ['tablet_mode', 'sync_url', 'sync_token', 'wake_word', 'hud_force', 'hud_hidden', 'hud_view', 'tischplatte_on'] as const

/** Geräteeigene Schalter bleiben, auch wenn der Hausstand sonst ersetzt wird. */
export function pickLocal(s: Settings): Partial<Settings> {
  const out: Record<string, unknown> = {}
  for (const k of LOCAL_KEYS) out[k] = s[k]
  return out as Partial<Settings>
}

/** Fremden Stand sicher einspielen; bei einem Fehler kommt der eigene Stand zurück. */
export async function applyRemoteStand(data: HausBackup): Promise<boolean> {
  const before = await buildBackup(true)
  const keep = loadSettings()
  const local = pickLocal(keep)
  muteStand(true)
  try {
    await applyBackup(data)
    saveSettings(local)
    setStandAt(data.stand_at || new Date().toISOString())
    return true
  } catch {
    try {
      await applyBackup(before)
      saveSettings(local)
      setStandAt(before.stand_at || '')
    } catch {
      /* Rückfall war nicht möglich */
    }
    return false
  } finally {
    muteStand(false)
  }
}

/** Handy: Server suchen, Stände vergleichen, nur bei klarem Unterschied schreiben. */
export async function syncWithTablet(): Promise<SyncOutcome> {
  const s = loadSettings()
  if (s.tablet_mode) return { kind: 'skip', line: '' }
  if (!isPaired()) return { kind: 'skip', line: '' }
  const port = Number(/:(\d+)$/.exec(s.sync_url)?.[1]) || 8765
  const hint = /^http:\/\/([^:/]+)/.exec(s.sync_url)?.[1] || ''
  const found = await hausDiscover(s.sync_token, hint, port)
  if (!found.ok || !found.url) return { kind: 'skip', line: '' }
  if (found.url !== s.sync_url) saveSettings({ sync_url: found.url })
  const verdict = verdictFor(standAt(), found.standAt || '')
  const action = syncAction(verdict)
  const dataUrl = `${found.url}/hausstand?t=${s.sync_token}`
  if (action === 'none') return { kind: 'none', line: 'Hausstand ist aktuell.' }
  if (action === 'blocked') return { kind: 'error', line: 'Hausstand-Alter unklar. Nichts geändert.' }
  if (action === 'ask_replace') {
    const got = await hausPull(dataUrl)
    const data = got.ok && got.json ? asBackup(safeJson(got.json)) : null
    if (!data) return { kind: 'error', line: 'Hausstand vom Tablet ist nicht lesbar. Nichts geändert.' }
    const ok = await applyRemoteStand(data)
    return ok
      ? { kind: 'pulled', line: 'Hausstand vom Tablet übernommen.' }
      : { kind: 'error', line: 'Übernahme fehlgeschlagen. Alter Stand ist zurück.' }
  }
  const mine = await buildBackup(true)
  const sent = await hausPush(dataUrl, JSON.stringify(mine))
  return sent.ok
    ? { kind: 'pushed', line: 'Neuerer Hausstand ans Tablet geschickt.' }
    : { kind: 'error', line: sent.message || 'Senden ans Tablet ging nicht.' }
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
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
export async function acceptIncomingStand(json: string): Promise<'applied' | 'ignored' | 'failed'> {
  const data = asBackup(safeJson(json))
  if (!data) return 'failed'
  if (verdictFor(standAt(), data.stand_at || '') !== 'remote_newer') return 'ignored'
  return (await applyRemoteStand(data)) ? 'applied' : 'failed'
}
