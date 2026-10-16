/** Server-Fläche: HTTPS-Sitzung, Geräte, Protokoll. Der TLS-Dienst liegt in der App. */

import { qrImageDataUrl } from './xfer-codec.ts'
import { hausServerState, hausServerStop } from '../native/haus.ts'
import { parsePairCode, reconcilePairedStand, savePairing, startTabletServer } from './tablet-sync.ts'

const DESK_KEY = 'jarvis_server_desk_v1'
const SESSION_KEY = 'jarvis_server_session_v1'
const LOG_MAX = 40

export type ServerDevice = {
  id: string
  name: string
  url: string
  token: string
  fingerprint: string
  addedAt: string
  lastSyncAt: string
}

export type ServerLogEntry = {
  id: string
  at: string
  action: string
  ok: boolean
  detail: string
}

export type ServerSession = {
  url: string
  code: string
  token: string
  fingerprint: string
  port: number
}

export type ServerHealth = {
  running: boolean
  https: boolean
  url: string
  port: number | null
  fingerprint: string
  message: string
}

type DeskFile = { devices: ServerDevice[]; log: ServerLogEntry[] }

function emptyDesk(): DeskFile {
  return { devices: [], log: [] }
}

function readDesk(): DeskFile {
  try {
    const raw = localStorage.getItem(DESK_KEY)
    if (!raw) return emptyDesk()
    const parsed = JSON.parse(raw) as DeskFile
    return {
      devices: Array.isArray(parsed.devices) ? parsed.devices : [],
      log: Array.isArray(parsed.log) ? parsed.log : [],
    }
  } catch {
    return emptyDesk()
  }
}

function writeDesk(desk: DeskFile): void {
  localStorage.setItem(DESK_KEY, JSON.stringify(desk))
}

export function listServerDevices(): ServerDevice[] {
  return readDesk().devices
}

export function listServerLog(): ServerLogEntry[] {
  return readDesk().log
}

export function noteServerAction(action: string, ok: boolean, detail: string): ServerLogEntry {
  const desk = readDesk()
  const entry: ServerLogEntry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    action,
    ok,
    detail: detail.slice(0, 280),
  }
  desk.log = [entry, ...desk.log].slice(0, LOG_MAX)
  writeDesk(desk)
  return entry
}

export function readServerSession(): ServerSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const row = JSON.parse(raw) as ServerSession
    if (!row?.code || !row.url?.startsWith('https://') || !/^[0-9a-f]{64}$/i.test(row.fingerprint || '')) return null
    return row
  } catch {
    return null
  }
}

function writeSession(session: ServerSession | null): void {
  if (!session) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function rememberServerDevice(raw: string, name = ''): ServerDevice | null {
  const pair = parsePairCode(raw)
  if (!pair) return null
  const desk = readDesk()
  const device: ServerDevice = {
    id: pair.fingerprint.slice(0, 16),
    name: name.trim() || pair.url.replace(/^https:\/\//, ''),
    url: pair.url,
    token: pair.token,
    fingerprint: pair.fingerprint,
    addedAt: new Date().toISOString(),
    lastSyncAt: '',
  }
  desk.devices = [device, ...desk.devices.filter((row) => row.fingerprint !== device.fingerprint)]
  writeDesk(desk)
  noteServerAction('Gerät gespeichert', true, device.name)
  return device
}

export async function serverHealth(): Promise<ServerHealth> {
  const session = readServerSession()
  const state = await hausServerState()
  const running = Boolean(state.running && session)
  return {
    running,
    https: true,
    url: running ? session?.url || '' : '',
    port: running ? session?.port || state.port || null : null,
    fingerprint: running ? session?.fingerprint || '' : '',
    message: running
      ? 'HTTPS läuft. Zertifikat ist an dieses Gerät gepinnt.'
      : state.ok
        ? 'Server ist aus.'
        : 'Der HTTPS-Server startet in der App. In diesem Fenster ist kein LAN-Dienst offen.',
  }
}

export async function startDeskServer(): Promise<ServerHealth> {
  const made = await startTabletServer(false)
  if (!made.ok || !made.url || !made.code || !made.token || !made.fingerprint) {
    noteServerAction('Server starten', false, made.message || 'Start fehlgeschlagen.')
    writeSession(null)
    return serverHealth()
  }
  writeSession({
    url: made.url,
    code: made.code,
    token: made.token,
    fingerprint: made.fingerprint,
    port: made.port || 8765,
  })
  noteServerAction('Server starten', true, made.url)
  return serverHealth()
}

export async function stopDeskServer(): Promise<ServerHealth> {
  const stopped = await hausServerStop()
  writeSession(null)
  noteServerAction('Server beenden', stopped, stopped ? 'Server ist aus.' : 'Stopp nicht bestätigt.')
  return serverHealth()
}

export function serverQr(): string {
  const session = readServerSession()
  if (!session) return ''
  return qrImageDataUrl(session.code) || ''
}

export async function connectServerDevice(id: string): Promise<string> {
  const device = readDesk().devices.find((row) => row.id === id)
  if (!device) {
    noteServerAction('Verbinden', false, 'Gerät fehlt.')
    return 'Gerät fehlt.'
  }
  await savePairing(device.url, device.token, device.fingerprint)
  const out = await reconcilePairedStand()
  const desk = readDesk()
  const row = desk.devices.find((item) => item.id === id)
  if (row && out.ok) row.lastSyncAt = new Date().toISOString()
  writeDesk(desk)
  noteServerAction('Verbinden', out.ok, out.line)
  return out.line
}
