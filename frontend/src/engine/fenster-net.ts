import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { isPrivateLanHost } from './pc-host.ts'
import type { FensterKind, FensterSurface } from './fenster-parse.ts'
import {
  acceptJa,
  fensterPort,
  pairedReply,
  readFensterRequest,
  requestFromBody,
  saveFensterRequest,
  surfaceAllowed,
  type FensterPeer,
  type FensterRequest,
  type FensterTransport,
} from './fenster.ts'

type NativeFenster = {
  listen(opts: { kind: string; name: string }): Promise<{ ok: boolean; message?: string }>
  seek(): Promise<{ ok: boolean; peers?: string; blocked?: boolean }>
  post(opts: { host: string; port: number; json: string }): Promise<{ ok: boolean }>
  pending(): Promise<{ ok: boolean; json?: string; fromHost?: string }>
  clearPending(): Promise<{ ok: boolean }>
  addListener(event: 'anfrage', cb: (ev: { json?: string; fromHost?: string }) => void): Promise<PluginListenerHandle>
}

const native = Capacitor.isNativePlatform() ? registerPlugin<NativeFenster>('JarvisFenster') : null

export type FensterSession = {
  onRequest: (row: FensterRequest | null) => void
  onShow: (surface: FensterSurface) => void
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
    const peers = Array.isArray(rows) ? rows.filter((p) => p && isPrivateLanHost(p.host)) : []
    return { peers, blocked: Boolean(res.blocked) }
  } catch {
    return { peers: [], blocked: false }
  }
}

export async function postFenster(peer: Pick<FensterPeer, 'host' | 'port'>, body: unknown): Promise<boolean> {
  if (!native || !isPrivateLanHost(peer.host)) return false
  try {
    const res = await native.post({
      host: peer.host,
      port: peer.port || fensterPort(),
      json: JSON.stringify(body),
    })
    return Boolean(res.ok)
  } catch {
    return false
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
  const take = (json: string, fromHost: string) => {
    if (dead) return
    void applyIncoming(json, fromHost, session)
  }
  const saved = readFensterRequest()
  if (saved) session.onRequest(saved)
  const pull = () => {
    if (dead || !native || document.visibilityState === 'hidden') return
    void native.pending().then((res) => {
      if (res?.json) take(res.json, String(res.fromHost || ''))
    })
  }
  if (native) {
    void native.listen({ kind: ownKind, name: 'Ultron' }).catch(() => undefined)
    void native.addListener('anfrage', (ev) => take(String(ev?.json || ''), String(ev?.fromHost || ''))).then((h) => {
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

async function applyIncoming(json: string, fromHost: string, session: FensterSession): Promise<void> {
  let body: unknown
  try {
    body = JSON.parse(json)
  } catch {
    return
  }
  const request = requestFromBody(body, fromHost)
  if (request) {
    saveFensterRequest(request)
    session.onRequest(request)
    return
  }
  const pair = acceptJa(body, fromHost)
  if (pair) {
    window.dispatchEvent(new CustomEvent('ultron-fenster-status', { detail: pairedReply() }))
    return
  }
  const o = body as { op?: string; token?: string; surface?: string }
  if (o?.op === 'zeig') {
    const surface = await surfaceAllowed(String(o.token || ''), String(o.surface || ''))
    if (surface) session.onShow(surface)
  }
}
