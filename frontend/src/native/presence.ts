import { Capacitor, registerPlugin } from '@capacitor/core'
import { handlePresenceHttp, type PresenceChat, type PresenceHttpReq } from '../engine/presence-http.ts'
import { PRESENCE_PORT } from '../engine/presence-lan.ts'

type NativePresence = {
  start(opts: { port: number }): Promise<{ ok: boolean; bindOk?: boolean; port?: number; message?: string }>
  stop(): Promise<{ ok: boolean; bindOk?: boolean }>
  bound(): Promise<{ ok: boolean; bindOk?: boolean; port?: number }>
  respond(opts: { id: string; status: number; body: string }): Promise<{ ok: boolean }>
  addListener(
    event: 'presenceRequest',
    cb: (ev: {
      id?: string
      method?: string
      path?: string
      headers?: Record<string, string>
      body?: string
      remoteHost?: string
    }) => void,
  ): Promise<{ remove: () => void }>
}

const native = Capacitor.isNativePlatform() ? registerPlugin<NativePresence>('JarvisPresence') : null

let listening = false
let listenHandle: { remove: () => void } | null = null
let lastBindOk = false
let lastPort = PRESENCE_PORT
let chatFn: PresenceChat | undefined
const bindListeners = new Set<() => void>()

function emitBind(): void {
  for (const fn of bindListeners) fn()
}

export function subscribePresenceBind(fn: () => void): () => void {
  bindListeners.add(fn)
  return () => {
    bindListeners.delete(fn)
  }
}

export function setPresenceChatHandler(fn: PresenceChat | undefined): void {
  chatFn = fn
}

export function presenceBindOk(): boolean {
  return lastBindOk
}

export function presenceBindPort(): number {
  return lastPort
}

function headerMap(raw: Record<string, string> | undefined): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  if (!raw) return out
  for (const [k, v] of Object.entries(raw)) {
    out[k] = v
    out[k.toLowerCase()] = v
  }
  return out
}

async function onNativeRequest(ev: {
  id?: string
  method?: string
  path?: string
  headers?: Record<string, string>
  body?: string
  remoteHost?: string
}): Promise<void> {
  const id = ev.id || ''
  if (!id || !native) return
  const req: PresenceHttpReq = {
    method: ev.method || 'GET',
    path: ev.path || '/',
    headers: headerMap(ev.headers),
    body: ev.body,
    remoteHost: ev.remoteHost || '127.0.0.1',
  }
  const res = await handlePresenceHttp(req, chatFn)
  await native.respond({ id, status: res.status, body: JSON.stringify(res.body) }).catch(() => undefined)
}

async function ensureListener(): Promise<void> {
  if (!native || listening) return
  listening = true
  listenHandle = await native.addListener('presenceRequest', (ev) => {
    void onNativeRequest(ev)
  })
}

export async function syncPresenceBind(opts: { enabled: boolean; port?: number }): Promise<boolean> {
  const port = opts.port && opts.port > 0 ? opts.port : PRESENCE_PORT
  lastPort = port
  if (!native) {
    lastBindOk = false
    emitBind()
    return false
  }
  if (!opts.enabled) {
    await native.stop().catch(() => undefined)
    lastBindOk = false
    emitBind()
    return false
  }
  await ensureListener()
  const res = await native.start({ port }).catch((): { ok: boolean; bindOk?: boolean; port?: number } => ({
    ok: false,
    bindOk: false,
  }))
  lastBindOk = Boolean(res.ok && (res.bindOk ?? res.ok))
  if (typeof res.port === 'number') lastPort = res.port
  emitBind()
  return lastBindOk
}

export async function queryPresenceBound(): Promise<boolean> {
  if (!native) {
    lastBindOk = false
    return false
  }
  const res = await native.bound().catch(() => ({ ok: false, bindOk: false }))
  lastBindOk = Boolean(res.bindOk ?? res.ok)
  return lastBindOk
}

export function stopPresenceListener(): void {
  listenHandle?.remove()
  listenHandle = null
  listening = false
}
