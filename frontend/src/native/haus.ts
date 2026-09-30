import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'

type HausOffer = { ok: boolean; url?: string; code?: string; message?: string }
type HausBody = { ok: boolean; json?: string; message?: string }

type NativeHaus = {
  offer(opts: { json: string }): Promise<HausOffer>
  pull(opts: { url: string }): Promise<HausBody>
  push(opts: { url: string; json: string }): Promise<HausBody>
  stop(): Promise<{ ok: boolean }>
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
