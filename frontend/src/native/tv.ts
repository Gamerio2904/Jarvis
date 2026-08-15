import { Capacitor, registerPlugin } from '@capacitor/core'

export type TvDevice = {
  host: string
  name?: string
  mac?: string
  port?: number
}

export type TvResult = {
  ok: boolean
  message?: string
  token?: string
  port?: number
  items?: TvDevice[]
}

type NativeTv = {
  discover(): Promise<TvResult>
  wake(opts: { mac: string }): Promise<TvResult>
  pair(opts: { host: string; port?: number; name?: string; token?: string }): Promise<TvResult>
  sendKey(opts: { host: string; port?: number; token?: string; key: string }): Promise<TvResult>
  test(opts: { host: string; port?: number; token?: string }): Promise<TvResult>
}

const native = Capacitor.isNativePlatform() ? registerPlugin<NativeTv>('JarvisTv') : null

function b64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function tizenUrl(host: string, port: number, name: string, token?: string): string {
  const scheme = port === 8002 ? 'wss' : 'ws'
  const q = new URLSearchParams({ name: b64(name || 'Jarvis') })
  if (token) q.set('token', token)
  return `${scheme}://${host}:${port}/api/v2/channels/samsung.remote.control?${q.toString()}`
}

function keyPayload(key: string): string {
  return JSON.stringify({
    method: 'ms.remote.control',
    params: {
      Cmd: 'Click',
      DataOfCmd: key,
      Option: 'false',
      TypeOfRemote: 'SendRemoteKey',
    },
  })
}

function webUnavailable(action: string): TvResult {
  return {
    ok: false,
    message: `${action} nur in der Android-App (UDP/WSS). Browser reicht nicht.`,
  }
}

function parseConnect(text: string): { token?: string; unauthorized?: boolean } {
  try {
    const ev = JSON.parse(text) as { event?: string; data?: { token?: string } }
    if (ev.event === 'ms.channel.unauthorized') return { unauthorized: true }
    if (ev.event === 'ms.channel.connect') return { token: ev.data?.token }
  } catch {
    /* ignore */
  }
  return {}
}

function webSocketCall(
  url: string,
  timeoutMs: number,
  afterConnect?: (send: (data: string) => void) => void,
): Promise<TvResult> {
  return new Promise((resolve) => {
    let done = false
    let token: string | undefined
    const finish = (result: TvResult) => {
      if (done) return
      done = true
      try {
        ws.close()
      } catch {
        /* ignore */
      }
      resolve(result)
    }
    let ws: WebSocket
    try {
      ws = new WebSocket(url)
    } catch (err) {
      resolve({
        ok: false,
        message: err instanceof Error ? err.message : 'WebSocket fehlgeschlagen',
      })
      return
    }
    const timer = setTimeout(() => {
      finish({ ok: false, message: 'TV antwortet nicht. Gleiches WLAN? Am TV erlauben?' })
    }, timeoutMs)
    ws.onmessage = (ev) => {
      const parsed = parseConnect(String(ev.data || ''))
      if (parsed.unauthorized) {
        clearTimeout(timer)
        finish({ ok: false, message: 'TV hat abgelehnt. Am Fernseher erlauben und neu koppeln.' })
        return
      }
      if (parsed.token || String(ev.data || '').includes('ms.channel.connect')) {
        token = parsed.token || token
        afterConnect?.((data) => ws.send(data))
        clearTimeout(timer)
        setTimeout(() => {
          finish({ ok: true, token, message: token ? 'Gekoppelt.' : 'Verbunden.' })
        }, 250)
      }
    }
    ws.onerror = () => {
      clearTimeout(timer)
      finish({
        ok: false,
        message: 'Keine Verbindung zum TV. Host/Port prüfen, kein Gastnetz.',
      })
    }
  })
}

export async function tvDiscoverNative(): Promise<TvResult> {
  if (!native) return { ok: false, items: [], message: webUnavailable('Suchen').message }
  try {
    return await native.discover()
  } catch (err) {
    return {
      ok: false,
      items: [],
      message: err instanceof Error ? err.message : 'Suchen fehlgeschlagen',
    }
  }
}

export async function tvWakeNative(mac: string): Promise<TvResult> {
  if (!native) return webUnavailable('Wake-on-LAN')
  try {
    return await native.wake({ mac })
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'WOL fehlgeschlagen' }
  }
}

export async function tvPairNative(opts: {
  host: string
  port?: number
  name?: string
  token?: string
}): Promise<TvResult> {
  if (native) {
    try {
      return await native.pair(opts)
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Koppeln fehlgeschlagen' }
    }
  }
  const port = opts.port || (opts.token ? 8002 : 8001)
  if (port === 8002) {
    return {
      ok: false,
      message: 'Port 8002 (WSS, selbstsigniert) nur in der Android-App.',
    }
  }
  return webSocketCall(tizenUrl(opts.host, port, opts.name || 'Jarvis', opts.token), 45_000)
}

export async function tvSendKeyNative(opts: {
  host: string
  port?: number
  token?: string
  key: string
}): Promise<TvResult> {
  if (native) {
    try {
      return await native.sendKey(opts)
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Taste fehlgeschlagen' }
    }
  }
  const port = opts.port || (opts.token ? 8002 : 8001)
  if (port === 8002) {
    return { ok: false, message: 'Tizen-WSS nur in der Android-App.' }
  }
  return webSocketCall(tizenUrl(opts.host, port, 'Jarvis', opts.token), 12_000, (send) => {
    send(keyPayload(opts.key))
  })
}

export async function tvTestNative(opts: {
  host: string
  port?: number
  token?: string
}): Promise<TvResult> {
  if (native) {
    try {
      return await native.test(opts)
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Test fehlgeschlagen' }
    }
  }
  const port = opts.port || (opts.token ? 8002 : 8001)
  if (port === 8002) {
    return { ok: false, message: 'Test über WSS nur in der Android-App.' }
  }
  return webSocketCall(tizenUrl(opts.host, port, 'Jarvis', opts.token), 12_000)
}
