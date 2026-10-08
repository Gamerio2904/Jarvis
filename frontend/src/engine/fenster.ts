import { isPrivateLanHost } from './pc-host.ts'
import { newPresenceToken } from './presence-lan.ts'
import { APP_VERSION, listIdeas, loadSettings, saveSettings } from './store.ts'
import { contentHash } from './sync-revisions.ts'
import { secureDelete, secureGet, securePut } from '../native/device.ts'
import {
  fensterKindLabel,
  fensterSurfaceLabel,
  parseFensterConnect,
  parseFensterShow,
  type FensterKind,
  type FensterSurface,
} from './fenster-parse.ts'

export const FENSTER_PROTOCOL = 1

/** Jede ausgehende Nachricht trägt Protokoll und App-Version. */
export function stampFensterBody(body: Record<string, unknown>): Record<string, unknown> {
  const now = Date.now()
  return {
    ...body,
    proto: FENSTER_PROTOCOL,
    appVersion: APP_VERSION,
    requestId: typeof body.requestId === 'string' ? body.requestId : crypto.randomUUID(),
    sentAt: Number.isSafeInteger(body.sentAt) ? body.sentAt : now,
    expiresAt: Number.isSafeInteger(body.expiresAt) ? body.expiresAt : now + 30_000,
  }
}

/** Eingehende Nachrichten nur bei gleicher App-Version und gleichem Protokoll. */
export function fensterVersionOk(body: unknown, now = Date.now()): boolean {
  if (!body || typeof body !== 'object') return false
  const o = body as Record<string, unknown>
  return (
    o.proto === FENSTER_PROTOCOL &&
    o.appVersion === APP_VERSION &&
    typeof o.requestId === 'string' &&
    /^[0-9a-f-]{36}$/i.test(o.requestId) &&
    Number.isSafeInteger(o.sentAt) &&
    Number.isSafeInteger(o.expiresAt) &&
    Number(o.sentAt) <= now + 30_000 &&
    Number(o.expiresAt) >= now &&
    Number(o.expiresAt) > Number(o.sentAt) &&
    Number(o.expiresAt) - Number(o.sentAt) <= 30_000
  )
}

const FENSTER_REPLAY_KEY = 'jarvis_fenster_replay_v1'
export function claimFensterRequest(requestId: string, now = Date.now()): boolean {
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return false
  const raw = localStorage.getItem(FENSTER_REPLAY_KEY)
  let rows: Record<string, number> = {}
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false
      rows = Object.fromEntries(
        Object.entries(parsed).filter(
          ([key, expiry]) => /^[0-9a-f-]{36}$/i.test(key) && Number.isSafeInteger(expiry) && Number(expiry) >= now,
        ),
      )
    } catch {
      return false
    }
  }
  if (rows[requestId]) return false
  rows[requestId] = now + 30_000
  localStorage.setItem(FENSTER_REPLAY_KEY, JSON.stringify(Object.fromEntries(Object.entries(rows).slice(-64))))
  return true
}

export type FensterPeer = {
  host: string
  port: number
  name: string
  kind: FensterKind
  fingerprint: string
  appVersion: string
  protocolVersion: number
}

export type FensterRequest = {
  nonce: string
  fromHost: string
  fromPort: number
  fromName: string
  fromKind: FensterKind
  fromFingerprint: string
  at: number
}

export type FensterPair = {
  host: string
  port: number
  token: string
  kind: FensterKind
  name: string
  fingerprint: string
  appVersion: string
}

export type FensterGrant = { tokenHash: string; peerName: string; peerKind: FensterKind; peerFingerprint: string }
export type FensterProjectTarget = { projectId: string; planRevision: string }

export type FensterSeek = FensterPeer[] | { peers?: FensterPeer[]; blocked?: boolean }
export type FensterPostResult = boolean | { ok: boolean; message?: string }

export type FensterTransport = {
  seek(): Promise<FensterSeek>
  post(
    peer: Pick<FensterPeer, 'host' | 'port' | 'fingerprint'>,
    body: unknown,
    authorizationToken?: string,
  ): Promise<FensterPostResult>
}

const REQUEST_MS = 5 * 60 * 1000
const PORT = 18792

let outgoing: { nonce: string; kind: FensterKind; at: number } | null = null

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

const PAIR_SECRET_KEY = 'fenster-pair-token'

export async function readFensterPair(): Promise<FensterPair | null> {
  const saved = readJson<Partial<FensterPair>>(loadSettings().fenster_pair_json)
  if (!saved) return null
  if (saved.token) {
    await securePut(PAIR_SECRET_KEY, saved.token)
    const { token: _legacyToken, ...metadata } = saved
    if (!metadata.host || !metadata.fingerprint || !metadata.appVersion) {
      await secureDelete(PAIR_SECRET_KEY)
      saveSettings({ fenster_pair_json: '' })
      return null
    }
    saveSettings({ fenster_pair_json: JSON.stringify(metadata) })
  }
  if (
    !saved.host ||
    !isPrivateLanHost(saved.host) ||
    !Number.isInteger(saved.port) ||
    !saved.fingerprint ||
    !/^[0-9a-f]{64}$/i.test(saved.fingerprint) ||
    saved.appVersion !== APP_VERSION
  ) return null
  let token = await secureGet(PAIR_SECRET_KEY)
  if (!token) return null
  return {
    host: saved.host,
    port: saved.port || PORT,
    token,
    kind: saved.kind === 'tablet' ? 'tablet' : 'handy',
    name: String(saved.name || 'Ultron').slice(0, 40),
    fingerprint: saved.fingerprint.toLowerCase(),
    appVersion: saved.appVersion,
  }
}

export function readFensterGrant(): FensterGrant | null {
  return readJson<FensterGrant>(loadSettings().fenster_grant_json)
}

export function readFensterRequest(): FensterRequest | null {
  const row = readJson<FensterRequest>(loadSettings().fenster_request_json)
  if (!row || Date.now() - row.at > REQUEST_MS || Date.now() < row.at) return null
  if (!isPrivateLanHost(row.fromHost)) return null
  return row
}

export function saveFensterRequest(row: FensterRequest | null): void {
  saveSettings({ fenster_request_json: row ? JSON.stringify(row) : '' })
}

export function requestFromBody(body: unknown, fromHost: string, fromFingerprint: string, fromPort = PORT): FensterRequest | null {
  const o = asRecord(body)
  if (!o || o.op !== 'anfrage') return null
  const nonce = String(o.nonce || '')
  if (nonce.length < 8 || nonce.length > 80) return null
  if (!isPrivateLanHost(fromHost)) return null
  if (!/^[0-9a-f]{64}$/i.test(fromFingerprint)) return null
  const fromKind: FensterKind = o.fromKind === 'tablet' ? 'tablet' : 'handy'
  return {
    nonce,
    fromHost,
    fromPort: fromPort > 0 ? fromPort : PORT,
    fromName: String(o.fromName || 'Ultron').slice(0, 40),
    fromKind,
    fromFingerprint: fromFingerprint.toLowerCase(),
    at: Date.now(),
  }
}

export async function grantFromConfirm(request: FensterRequest, ownKind: FensterKind): Promise<{
  grant: FensterGrant
  body: Record<string, unknown>
  authorizationToken: string
} | null> {
  if (!isPrivateLanHost(request.fromHost) || Date.now() - request.at > REQUEST_MS || Date.now() < request.at) return null
  const token = newPresenceToken()
  const grant: FensterGrant = {
    tokenHash: await fensterHash(token),
    peerName: request.fromName,
    peerKind: request.fromKind,
    peerFingerprint: request.fromFingerprint,
  }
  return {
    grant,
    body: { op: 'ja', nonce: request.nonce, kind: ownKind, name: 'Ultron' },
    authorizationToken: token,
  }
}

export function commitFensterGrant(grant: FensterGrant): void {
  saveSettings({ fenster_grant_json: JSON.stringify(grant), fenster_request_json: '' })
}

export async function releaseFensterPair(): Promise<void> {
  await secureDelete(PAIR_SECRET_KEY)
  saveSettings({ fenster_pair_json: '' })
}

export function ownFensterKind(): FensterKind {
  if (typeof window === 'undefined') return 'handy'
  const short = Math.min(window.innerWidth || 0, window.innerHeight || 0)
  return short >= 700 ? 'tablet' : 'handy'
}

export function denyFensterRequest(): void {
  saveSettings({ fenster_request_json: '' })
}

export async function acceptJa(
  body: unknown,
  fromHost: string,
  fromFingerprint: string,
  authorizationToken: string,
): Promise<FensterPair | null> {
  const o = asRecord(body)
  if (!o || o.op !== 'ja' || !outgoing || Date.now() - outgoing.at > REQUEST_MS) return null
  if (String(o.nonce || '') !== outgoing.nonce) return null
  const token = authorizationToken
  if (token.length < 8 || !isPrivateLanHost(fromHost) || !/^[0-9a-f]{64}$/i.test(fromFingerprint)) return null
  const kind: FensterKind = o.kind === 'tablet' ? 'tablet' : 'handy'
  if (kind !== outgoing.kind) return null
  const pair: FensterPair = {
    host: fromHost,
    port: PORT,
    token,
    kind,
    name: String(o.name || 'Ultron').slice(0, 40),
    fingerprint: fromFingerprint.toLowerCase(),
    appVersion: APP_VERSION,
  }
  await securePut(PAIR_SECRET_KEY, token)
  outgoing = null
  const { token: _secret, ...metadata } = pair
  saveSettings({ fenster_pair_json: JSON.stringify(metadata) })
  return pair
}

export async function surfaceAllowed(token: string, surface: string, peerFingerprint: string): Promise<FensterSurface | null> {
  const grant = readFensterGrant()
  if (!grant || !token) return null
  const hash = await fensterHash(token)
  if (hash !== grant.tokenHash) return null
  if (!grant.peerFingerprint || grant.peerFingerprint !== peerFingerprint.toLowerCase()) return null
  return (FENSTER_OK as readonly string[]).includes(surface) ? (surface as FensterSurface) : null
}

export async function fensterAckAllowed(token: string, peerFingerprint: string): Promise<boolean> {
  const pair = await readFensterPair()
  return Boolean(
    pair &&
      pair.token === token &&
      pair.fingerprint === peerFingerprint.toLowerCase() &&
      pair.appVersion === APP_VERSION,
  )
}

async function currentProjectTarget(projectId: string): Promise<FensterProjectTarget | null> {
  if (!/^[a-z0-9_-]{1,80}$/i.test(projectId)) return null
  const idea = (await listIdeas()).find((row) => row.id === projectId && row.status !== 'done')
  if (!idea?.plan) return null
  return { projectId: idea.id, planRevision: await contentHash(idea.plan) }
}

async function selectedProjectTarget(): Promise<FensterProjectTarget | null> {
  const projectId = loadSettings().plan_idea_id
  return projectId ? currentProjectTarget(projectId) : null
}

export async function validateFensterProjectTarget(value: unknown): Promise<FensterProjectTarget | null> {
  if (!value || typeof value !== 'object') return null
  const target = value as Partial<FensterProjectTarget>
  if (
    typeof target.projectId !== 'string' ||
    !/^[a-z0-9_-]{1,80}$/i.test(target.projectId) ||
    typeof target.planRevision !== 'string' ||
    !/^[0-9a-f]{64}$/i.test(target.planRevision)
  ) return null
  const current = await currentProjectTarget(target.projectId)
  return current?.planRevision === target.planRevision ? current : null
}

const FENSTER_OK: FensterSurface[] = ['home', 'tisch', 'lage', 'chat', 'calendar', 'watchlist', 'voice', 'planning', 'sprints']

export async function handleFensterCommand(text: string, transport: FensterTransport, ownKind: FensterKind = 'handy'): Promise<string | null> {
  const connect = parseFensterConnect(text)
  if (connect) return sendRequest(connect, transport, ownKind)
  const show = parseFensterShow(text)
  if (!show) return null
  const pair = await readFensterPair()
  if (!pair) return needPairReply()
  if (pair.kind !== show.kind) {
    return `Gekoppelt ist ein ${fensterKindLabel(pair.kind)}.`
  }
  if (!pair.fingerprint || pair.appVersion !== APP_VERSION) return needPairReply()
  const projectTarget =
    show.surface === 'planning' || show.surface === 'sprints' ? await selectedProjectTarget() : null
  if ((show.surface === 'planning' || show.surface === 'sprints') && !projectTarget) {
    return 'Bitte zuerst ein gespeichertes Projekt mit Plan auswählen.'
  }
  if (!isPrivateLanHost(pair.host)) {
    await releaseFensterPair()
    return noPeerReply(show.kind)
  }
  const now = Date.now()
  const requestId = crypto.randomUUID()
  const ackState: { resolve?: (ok: boolean) => void } = {}
  let ackTimeout = 0
  let ackHandler: ((event: Event) => void) | null = null
  const ack = typeof window === 'undefined'
    ? Promise.resolve(true)
    : new Promise<boolean>((resolve) => {
        ackState.resolve = resolve
        ackHandler = (event: Event) => {
          const detail = (event as CustomEvent<{ requestId?: string }>).detail
          if (detail?.requestId === requestId) resolve(true)
        }
        window.addEventListener('ultron-fenster-ack', ackHandler)
        ackTimeout = window.setTimeout(() => resolve(false), 8_000)
      })
  const posted = await transport.post(
    { host: pair.host, port: pair.port || PORT, fingerprint: pair.fingerprint },
    {
      op: 'zeig',
      surface: show.surface,
      requestId,
      sentAt: now,
      expiresAt: now + 30_000,
      ...(projectTarget || {}),
    },
    pair.token,
  )
  const ok = typeof posted === 'boolean' ? posted : posted.ok
  if (!ok) ackState.resolve?.(false)
  if (!ok) {
    if (ackHandler) window.removeEventListener('ultron-fenster-ack', ackHandler)
    if (ackTimeout) window.clearTimeout(ackTimeout)
    return (typeof posted === 'boolean' ? '' : posted.message) || noPeerReply(show.kind)
  }
  const acknowledged = await ack
  if (ackHandler) window.removeEventListener('ultron-fenster-ack', ackHandler)
  if (ackTimeout) window.clearTimeout(ackTimeout)
  if (!acknowledged) return 'Der Befehl kam an, aber das Öffnen wurde nicht bestätigt.'
  return shownReply(show.kind, show.surface)
}

function readSeek(found: FensterSeek): { peers: FensterPeer[]; blocked: boolean } {
  if (Array.isArray(found)) return { peers: found, blocked: false }
  return { peers: found?.peers || [], blocked: Boolean(found?.blocked) }
}

async function sendRequest(kind: FensterKind, transport: FensterTransport, ownKind: FensterKind): Promise<string> {
  const found = readSeek(await transport.seek())
  const allowed = found.peers.filter((p) => isPrivateLanHost(p.host))
  const matchingKind = allowed.filter((p) => p.kind === kind)
  const peers = matchingKind.filter(
    (p) => p.appVersion === APP_VERSION && p.protocolVersion === FENSTER_PROTOCOL,
  )
  const asked = kind
  if (!peers.length) {
    if (found.blocked) return needLanReply()
    if (matchingKind.length) return 'Die App-Version oder das Fenster-Protokoll weicht ab. Beide Geräte müssen aktualisiert werden.'
    const other = allowed.find((p) => p.kind !== kind)
    if (other) return otherKindReply(other.kind)
    return noPeerReply(kind)
  }
  const nonce = newPresenceToken()
  outgoing = { nonce, kind: asked, at: Date.now() }
  let sent = 0
  for (const peer of peers) {
    const posted = await transport.post(peer, {
      op: 'anfrage',
      nonce,
      fromName: 'Ultron',
      fromKind: ownKind,
    })
    if (typeof posted === 'boolean' ? posted : posted.ok) sent += 1
  }
  if (!sent) {
    outgoing = null
    return noPeerReply(kind)
  }
  return sentReply(asked)
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
