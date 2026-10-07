import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'

type HausOffer = { ok: boolean; url?: string; code?: string; message?: string }
export type HausServer = { ok: boolean; url?: string; port?: number; token?: string; code?: string; message?: string }
export type HausFound = { ok: boolean; url?: string; host?: string; standAt?: string; message?: string }
type HausBody = { ok: boolean; json?: string; message?: string }

type NativeHaus = {
  offer(opts: { json: string }): Promise<HausOffer>
  pull(opts: { url: string }): Promise<HausBody>
  push(opts: { url: string; json: string }): Promise<HausBody>
  stop(): Promise<{ ok: boolean }>
  serverStart(opts: { json: string; standAt: string; rotate?: boolean }): Promise<HausServer>
  serverUpdate(opts: { json: string; standAt: string }): Promise<{ ok: boolean; message?: string }>
  serverStop(): Promise<{ ok: boolean }>
  discover(opts: { token: string; hint?: string; port?: number }): Promise<HausFound>
  ensureCamera(): Promise<{ ok: boolean; message?: string }>
  addListener(event: 'incoming', cb: (ev: { json?: string }) => void): Promise<PluginListenerHandle>
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

export async function hausPull(url: string): Promise<HausBody> {
  if (!native) return { ok: false, message: 'Scannen geht auf dem Handy.' }
  try {
    return await native.pull({ url })
  } catch {
    return { ok: false, message: 'Keine Verbindung. Beide Geräte ins selbe WLAN.' }
  }
}

export async function hausPush(url: string, json: string): Promise<HausBody> {
  if (!native) return { ok: false, message: 'Der Übertrag geht auf dem Handy.' }
  try {
    return await native.push({ url, json })
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

export function watchHausIncoming(onJson: (json: string) => void): () => void {
  if (!native) return () => {}
  let handle: PluginListenerHandle | null = null
  let dead = false
  void native.addListener('incoming', (ev) => {
    if (dead) return
    const json = String(ev?.json || '')
    if (json) onJson(json)
  }).then((h) => {
    if (dead) void h.remove()
    else handle = h
  })
  return () => {
    dead = true
    void handle?.remove()
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

export async function hausServerStop(): Promise<void> {
  if (!native) return
  try {
    await native.serverStop()
  } catch {
    /* Server ist schon aus */
  }
}

export async function hausDiscover(token: string, hint = '', port = 8765): Promise<HausFound> {
  if (!native) return { ok: false, message: 'Die Suche läuft nur in der App.' }
  try {
    return await native.discover({ token, hint, port })
  } catch {
    return { ok: false, message: 'Die Suche im WLAN ging schief.' }
  }
}
