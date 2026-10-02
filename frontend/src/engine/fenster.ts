import { isAllowedPcHost } from './pc-host.ts'
import { newPresenceToken } from './presence-lan.ts'
import { loadSettings, saveSettings } from './store.ts'
import {
  fensterKindLabel,
  fensterSurfaceLabel,
  parseFensterConnect,
  parseFensterShow,
  type FensterKind,
  type FensterSurface,
} from './fenster-parse.ts'

export type FensterPeer = { host: string; port: number; name: string; kind: FensterKind }

export type FensterRequest = {
  nonce: string
  fromHost: string
  fromPort: number
  fromName: string
  fromKind: FensterKind
  at: number
}

export type FensterPair = {
  host: string
  port: number
  token: string
  kind: FensterKind
  name: string
}

export type FensterGrant = { tokenHash: string; peerName: string; peerKind: FensterKind }

export type FensterSeek = FensterPeer[] | { peers?: FensterPeer[]; blocked?: boolean }

export type FensterTransport = {
  seek(): Promise<FensterSeek>
  post(peer: Pick<FensterPeer, 'host' | 'port'>, body: unknown): Promise<boolean>
}

const REQUEST_MS = 5 * 60 * 1000
const PORT = 18792

let outgoing: { nonce: string; kind: FensterKind } | null = null

export function resetFensterOut(): void {
  outgoing = null
}

export function fensterPort(): number {
  return PORT
}

export function noPeerReply(kind: FensterKind): string {
  return `Kein ${fensterKindLabel(kind)} antwortet. Ultron muss dort im Hintergrund hören.`
}

export function needLanReply(): string {
  return 'Das Netz in der Nähe ist nicht erlaubt. Erlaube es auf beiden Geräten, dann noch einmal.'
}

export function otherKindReply(found: FensterKind): string {
  const label = fensterKindLabel(found)
  return `Es antwortet ein ${label}. Sag Verbinde das ${label}.`
}

export function sentReply(kind: FensterKind): string {
  return `Anfrage an das ${fensterKindLabel(kind)}. Dort bestätigen.`
}

export function needPairReply(): string {
  return 'Noch nicht gekoppelt. Sag Verbinde das Handy.'
}

export function pairedReply(): string {
  return 'Gekoppelt. Zwei Fenster.'
}

export function shownReply(kind: FensterKind, surface: FensterSurface): string {
  return `${fensterSurfaceLabel(surface)} auf dem ${fensterKindLabel(kind)}.`
}

export async function fensterHash(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function readFensterPair(): FensterPair | null {
  return readJson<FensterPair>(loadSettings().fenster_pair_json)
}

export function readFensterGrant(): FensterGrant | null {
  return readJson<FensterGrant>(loadSettings().fenster_grant_json)
}

export function readFensterRequest(): FensterRequest | null {
  const row = readJson<FensterRequest>(loadSettings().fenster_request_json)
  if (!row || Date.now() - row.at > REQUEST_MS) return null
  if (!isAllowedPcHost(row.fromHost)) return null
  return row
}

export function saveFensterRequest(row: FensterRequest | null): void {
  saveSettings({ fenster_request_json: row ? JSON.stringify(row) : '' })
}

export function requestFromBody(body: unknown, fromHost: string, fromPort = PORT): FensterRequest | null {
  const o = asRecord(body)
  if (!o || o.op !== 'anfrage') return null
  const nonce = String(o.nonce || '')
  if (nonce.length < 8 || nonce.length > 80) return null
  if (!isAllowedPcHost(fromHost)) return null
  const fromKind: FensterKind = o.fromKind === 'tablet' ? 'tablet' : 'handy'
  return {
    nonce,
    fromHost,
    fromPort: fromPort > 0 ? fromPort : PORT,
    fromName: String(o.fromName || 'Ultron').slice(0, 40),
    fromKind,
    at: Date.now(),
  }
}

export async function grantFromConfirm(request: FensterRequest, ownKind: FensterKind): Promise<{
  grant: FensterGrant
  body: Record<string, unknown>
} | null> {
  if (!isAllowedPcHost(request.fromHost)) return null
  const token = newPresenceToken()
  const grant: FensterGrant = {
    tokenHash: await fensterHash(token),
    peerName: request.fromName,
    peerKind: request.fromKind,
  }
  return {
    grant,
    body: { op: 'ja', nonce: request.nonce, token, kind: ownKind, name: 'Ultron' },
  }
}

export function commitFensterGrant(grant: FensterGrant): void {
  saveSettings({ fenster_grant_json: JSON.stringify(grant), fenster_request_json: '' })
}

export function releaseFensterPair(): void {
  saveSettings({ fenster_pair_json: '' })
}

export function ownFensterKind(): FensterKind {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'handy'
  return window.matchMedia('(min-width: 900px)').matches ? 'tablet' : 'handy'
}

export function denyFensterRequest(): void {
  saveSettings({ fenster_request_json: '' })
}

export function acceptJa(body: unknown, fromHost: string): FensterPair | null {
  const o = asRecord(body)
  if (!o || o.op !== 'ja' || !outgoing) return null
  if (String(o.nonce || '') !== outgoing.nonce) return null
  const token = String(o.token || '')
  if (token.length < 8 || !isAllowedPcHost(fromHost)) return null
  const kind: FensterKind = o.kind === 'tablet' ? 'tablet' : 'handy'
  if (kind !== outgoing.kind) return null
  const pair: FensterPair = {
    host: fromHost,
    port: PORT,
    token,
    kind,
    name: String(o.name || 'Ultron').slice(0, 40),
  }
  outgoing = null
  saveSettings({ fenster_pair_json: JSON.stringify(pair) })
  return pair
}

export async function surfaceAllowed(token: string, surface: string): Promise<FensterSurface | null> {
  const grant = readFensterGrant()
  if (!grant || !token) return null
  const hash = await fensterHash(token)
  if (hash !== grant.tokenHash) return null
  return (FENSTER_OK as readonly string[]).includes(surface) ? (surface as FensterSurface) : null
}

const FENSTER_OK: FensterSurface[] = ['home', 'tisch', 'lage', 'chat', 'calendar', 'watchlist', 'voice']

export async function handleFensterCommand(text: string, transport: FensterTransport, ownKind: FensterKind = 'handy'): Promise<string | null> {
  const connect = parseFensterConnect(text)
  if (connect) return sendRequest(connect, transport, ownKind)
  const show = parseFensterShow(text)
  if (!show) return null
  const pair = readFensterPair()
  if (!pair) return needPairReply()
  if (pair.kind !== show.kind) {
    return `Gekoppelt ist ein ${fensterKindLabel(pair.kind)}.`
  }
  if (!isAllowedPcHost(pair.host)) {
    releaseFensterPair()
    return noPeerReply(show.kind)
  }
  const ok = await transport.post(
    { host: pair.host, port: pair.port || PORT },
    { op: 'zeig', token: pair.token, surface: show.surface },
  )
  if (!ok) {
    releaseFensterPair()
    return noPeerReply(show.kind)
  }
  return shownReply(show.kind, show.surface)
}

function readSeek(found: FensterSeek): { peers: FensterPeer[]; blocked: boolean } {
  if (Array.isArray(found)) return { peers: found, blocked: false }
  return { peers: found?.peers || [], blocked: Boolean(found?.blocked) }
}

async function sendRequest(kind: FensterKind, transport: FensterTransport, ownKind: FensterKind): Promise<string> {
  const found = readSeek(await transport.seek())
  const allowed = found.peers.filter((p) => isAllowedPcHost(p.host))
  const peers = allowed.filter((p) => p.kind === kind)
  if (!peers.length) {
    if (found.blocked) return needLanReply()
    const other = allowed.find((p) => p.kind !== kind)
    if (other) return otherKindReply(other.kind)
    return noPeerReply(kind)
  }
  const nonce = newPresenceToken()
  outgoing = { nonce, kind }
  let sent = 0
  for (const peer of peers) {
    const ok = await transport.post(peer, {
      op: 'anfrage',
      nonce,
      fromName: 'Ultron',
      fromKind: ownKind,
    })
    if (ok) sent += 1
  }
  if (!sent) {
    outgoing = null
    return noPeerReply(kind)
  }
  return sentReply(kind)
}

function readJson<T>(raw: string): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function asRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null
  return body as Record<string, unknown>
}
