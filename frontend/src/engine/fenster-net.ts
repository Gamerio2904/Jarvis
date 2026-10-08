import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { isPrivateLanHost } from './pc-host.ts'
import type { FensterKind, FensterSurface } from './fenster-parse.ts'
import {
  acceptJa,
  claimFensterRequest,
  fensterPort,
  fensterVersionOk,
  fensterAckAllowed,
  pairedReply,
  readFensterRequest,
  requestFromBody,
  saveFensterRequest,
  stampFensterBody,
  surfaceAllowed,
  validateFensterProjectTarget,
  type FensterPeer,
  type FensterPostResult,
  type FensterProjectTarget,
  type FensterRequest,
  type FensterTransport,
} from './fenster.ts'

type NativeFenster = {
  listen(opts: { kind: string; name: string }): Promise<{ ok: boolean; message?: string }>
  seek(): Promise<{ ok: boolean; peers?: string; blocked?: boolean }>
  post(opts: { host: string; port: number; fingerprint: string; json: string; authorizationToken?: string }): Promise<{ ok: boolean; message?: string }>
  pending(): Promise<{ ok: boolean; json?: string; fromHost?: string; peerFingerprint?: string }>
  clearPending(): Promise<{ ok: boolean }>
  addListener(
    event: 'anfrage',
    cb: (ev: { json?: string; fromHost?: string; peerFingerprint?: string; token?: string }) => void,
  ): Promise<PluginListenerHandle>
}

const native = Capacitor.isNativePlatform() ? registerPlugin<NativeFenster>('JarvisFenster') : null

export type FensterSession = {
  onRequest: (row: FensterRequest | null) => void
  onShow: (surface: FensterSurface, target?: FensterProjectTarget) => void
}

export function fensterTransport(): FensterTransport {
  return {
    seek: seekFenster,
    post: postFenster,
  }
}

export async function seekFenster(): Promise<{ peers: FensterPeer[]; blocked: boolean }> {
  if (!native) return { peers: [], blocked: false }
  try {
    const res = await native.seek()
    const rows = JSON.parse(res.peers || '[]') as FensterPeer[]
    const peers = Array.isArray(rows)
      ? rows.filter(
          (p) =>
            p &&
            isPrivateLanHost(p.host) &&
            /^[0-9a-f]{64}$/i.test(p.fingerprint) &&
            Number.isInteger(p.protocolVersion) &&
            p.protocolVersion > 0 &&
            Boolean(p.appVersion),
        )
      : []
    return { peers, blocked: Boolean(res.blocked) }
  } catch {
    return { peers: [], blocked: false }
  }
}

export async function postFenster(
  peer: Pick<FensterPeer, 'host' | 'port' | 'fingerprint'>,
  body: unknown,
  authorizationToken?: string,
): Promise<FensterPostResult> {
  if (!native) return { ok: false, message: 'Fenstersteuerung ist auf diesem Gerät nicht verfügbar.' }
  if (!isPrivateLanHost(peer.host) || !/^[0-9a-f]{64}$/i.test(peer.fingerprint)) {
    return { ok: false, message: 'Ungültiges Fensterziel oder fehlender Zertifikat-Pin.' }
  }
  try {
    const res = await native.post({
      host: peer.host,
      port: peer.port || fensterPort(),
      fingerprint: peer.fingerprint,
      json: JSON.stringify(stampFensterBody((body && typeof body === 'object' ? body : {}) as Record<string, unknown>)),
      authorizationToken,
    })
    if (!res.ok && res.message) {
      window.dispatchEvent(new CustomEvent('ultron-fenster-status', { detail: res.message }))
    }
    return { ok: Boolean(res.ok), message: res.message }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Fenster-Transport fehlgeschlagen.'
    window.dispatchEvent(new CustomEvent('ultron-fenster-status', { detail: message }))
    return { ok: false, message }
  }
}

export async function clearFensterPending(): Promise<void> {
  if (!native) return
  try {
    await native.clearPending()
  } catch {
    /* Die Anfrage im Speicher bleibt der Stand. */
  }
}

export function startFensterSession(ownKind: FensterKind, session: FensterSession): () => void {
  let dead = false
  let handle: PluginListenerHandle | null = null
  const take = (json: string, fromHost: string, peerFingerprint: string, token: string) => {
    if (dead) return
    void applyIncoming(json, fromHost, peerFingerprint, token, session)
  }
  const saved = readFensterRequest()
  if (saved) session.onRequest(saved)
  const pull = () => {
    if (dead || !native || document.visibilityState === 'hidden') return
    void native.pending().then((res) => {
      if (res?.json) take(res.json, String(res.fromHost || ''), String(res.peerFingerprint || ''), '')
    })
  }
  if (native) {
    void native.listen({ kind: ownKind, name: 'Ultron' }).catch(() => undefined)
    void native.addListener('anfrage', (ev) =>
      take(String(ev?.json || ''), String(ev?.fromHost || ''), String(ev?.peerFingerprint || ''), String(ev?.token || '')),
    ).then((h) => {
      if (dead) void h.remove()
      else handle = h
    })
    pull()
    document.addEventListener('visibilitychange', pull)
  }
  return () => {
    dead = true
    document.removeEventListener('visibilitychange', pull)
    void handle?.remove()
  }
}

async function applyIncoming(
  json: string,
  fromHost: string,
  peerFingerprint: string,
  authorizationToken: string,
  session: FensterSession,
): Promise<void> {
  let body: unknown
  try {
    body = JSON.parse(json)
  } catch {
    return
  }
  if (!fensterVersionOk(body)) {
    window.dispatchEvent(
      new CustomEvent('ultron-fenster-status', { detail: 'Das andere Gerät hat eine andere App-Version. Nichts übernommen.' }),
    )
    return
  }
  const requestId = (body as Record<string, unknown>).requestId
  if (typeof requestId !== 'string' || !claimFensterRequest(requestId)) {
    window.dispatchEvent(
      new CustomEvent('ultron-fenster-status', { detail: 'Abgelaufener oder bereits verwendeter Fernbefehl abgewiesen.' }),
    )
    return
  }
  const request = requestFromBody(body, fromHost, peerFingerprint)
  if (request) {
    saveFensterRequest(request)
    session.onRequest(request)
    return
  }
  const pair = await acceptJa(body, fromHost, peerFingerprint, authorizationToken)
  if (pair) {
    window.dispatchEvent(new CustomEvent('ultron-fenster-status', { detail: pairedReply() }))
    return
  }
  const o = body as {
    op?: string
    token?: string
    surface?: string
    ackFor?: string
    requestId?: string
    projectId?: string
    planRevision?: string
  }
  if (o.op === 'opened' && typeof o.ackFor === 'string') {
    if (await fensterAckAllowed(authorizationToken, peerFingerprint)) {
      window.dispatchEvent(new CustomEvent('ultron-fenster-ack', { detail: { requestId: o.ackFor } }))
    }
    return
  }
  if (o?.op === 'zeig') {
    const surface = await surfaceAllowed(authorizationToken, String(o.surface || ''), peerFingerprint)
    if (surface) {
      let target: FensterProjectTarget | undefined
      if (surface === 'planning' || surface === 'sprints') {
        const valid = await validateFensterProjectTarget({ projectId: o.projectId, planRevision: o.planRevision })
        if (!valid) {
          window.dispatchEvent(
            new CustomEvent('ultron-fenster-status', { detail: 'Projekt oder Planrevision auf diesem Gerät ist nicht identisch.' }),
          )
          return
        }
        target = valid
      }
      session.onShow(surface, target)
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      await postFenster(
        { host: fromHost, port: fensterPort(), fingerprint: peerFingerprint },
        { op: 'opened', ackFor: o.requestId },
        authorizationToken,
      )
    }
  }
}
