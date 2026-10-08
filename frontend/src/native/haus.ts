import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'

type HausOffer = { ok: boolean; url?: string; code?: string; message?: string }
export type HausServer = {
  ok: boolean
  url?: string
  port?: number
  token?: string
  fingerprint?: string
  code?: string
  message?: string
}
export type HausFound = {
  ok: boolean
  url?: string
  host?: string
  standAt?: string
  appVersion?: string
  protocolVersion?: number
  fingerprint?: string
  syncRevision?: string
  message?: string
}
type HausBody = { ok: boolean; json?: string; message?: string }

type NativeHaus = {
  offer(opts: { json: string }): Promise<HausOffer>
  pull(opts: { url: string; token: string; fingerprint: string }): Promise<HausBody>
  push(opts: { url: string; token: string; fingerprint: string; json: string }): Promise<HausBody>
  stop(): Promise<{ ok: boolean }>
  serverStart(opts: { json: string; standAt: string; rotate?: boolean }): Promise<HausServer>
  serverUpdate(opts: { json: string; standAt: string }): Promise<{ ok: boolean; message?: string }>
  serverStop(): Promise<{ ok: boolean }>
  serverState(): Promise<{ ok: boolean; running: boolean; ip?: string; port?: number }>
  discover(opts: { token: string; fingerprint: string; hint?: string; port?: number }): Promise<HausFound>
  acknowledgeIncoming(opts: { requestId: string; status: string; syncRevision?: string }): Promise<{ ok: boolean }>
  ensureCamera(): Promise<{ ok: boolean; message?: string }>
  addListener(event: 'incoming', cb: (ev: { json?: string; requestId?: string }) => void): Promise<PluginListenerHandle>
}

const native = Capacitor.isNativePlatform() ? registerPlugin<NativeHaus>('JarvisHaus') : null

export function hausNative(): boolean {
  return Boolean(native)
}

export async function hausOffer(json: string): Promise<HausOffer> {
  if (!native) return { ok: false, message: 'Kein WLAN-Tor in diesem Fenster.' }
  try {
    return await native.offer({ json })
  } catch {
    return { ok: false, message: 'Das WLAN-Tor geht nicht auf.' }
  }
}

export async function hausPull(url: string, token: string, fingerprint: string): Promise<HausBody> {
  if (!native) return { ok: false, message: 'Scannen geht auf dem Handy.' }
  try {
    return await native.pull({ url, token, fingerprint })
  } catch {
    return { ok: false, message: 'Keine Verbindung. Beide Geräte ins selbe WLAN.' }
  }
}

export async function hausPush(url: string, json: string, token: string, fingerprint: string): Promise<HausBody> {
  if (!native) return { ok: false, message: 'Der Übertrag geht auf dem Handy.' }
  try {
    return await native.push({ url, json, token, fingerprint })
  } catch {
    return { ok: false, message: 'Keine Verbindung. Beide Geräte ins selbe WLAN.' }
  }
}

export async function hausStop(): Promise<void> {
  if (!native) return
  try {
    await native.stop()
  } catch {
    /* Tor ist schon zu */
  }
}

export async function hausEnsureCamera(): Promise<{ ok: boolean; message?: string }> {
  if (!native) return { ok: true }
  try {
    return await native.ensureCamera()
  } catch {
    return { ok: false, message: 'Kamera ist zu.' }
  }
}

export function watchHausIncoming(onJson: (json: string, requestId: string) => void): () => void {
  if (!native) return () => {}
  let handle: PluginListenerHandle | null = null
  let dead = false
  void native.addListener('incoming', (ev) => {
    if (dead) return
    const json = String(ev?.json || '')
    if (json) onJson(json, String(ev?.requestId || ''))
  }).then((h) => {
    if (dead) void h.remove()
    else handle = h
  })
  return () => {
    dead = true
    void handle?.remove()
  }
}

export async function acknowledgeHausIncoming(
  requestId: string,
  status: string,
  syncRevision?: string,
): Promise<boolean> {
  if (!native || !requestId) return false
  try {
    return Boolean((await native.acknowledgeIncoming({ requestId, status, syncRevision })).ok)
  } catch {
    return false
  }
}

export async function hausServerStart(json: string, standAt: string, rotate = false): Promise<HausServer> {
  if (!native) return { ok: false, message: 'Der Server läuft nur in der App.' }
  try {
    return await native.serverStart({ json, standAt, rotate })
  } catch {
    return { ok: false, message: 'Der Hausstand-Server startet nicht.' }
  }
}

export async function hausServerUpdate(json: string, standAt: string): Promise<boolean> {
  if (!native) return false
  try {
    return Boolean((await native.serverUpdate({ json, standAt })).ok)
  } catch {
    return false
  }
}

export async function hausServerStop(): Promise<boolean> {
  if (!native) return false
  try {
    return Boolean((await native.serverStop()).ok)
  } catch {
    return false
  }
}

export async function hausServerState(): Promise<{ ok: boolean; running: boolean; ip?: string; port?: number }> {
  if (!native) return { ok: false, running: false }
  try {
    return await native.serverState()
  } catch {
    return { ok: false, running: false }
  }
}

export async function hausDiscover(token: string, fingerprint: string, hint = '', port = 8765): Promise<HausFound> {
  if (!native) return { ok: false, message: 'Die Suche läuft nur in der App.' }
  try {
    return await native.discover({ token, fingerprint, hint, port })
  } catch {
    return { ok: false, message: 'Die Suche im WLAN ging schief.' }
  }
}
