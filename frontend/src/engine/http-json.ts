import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { germanNetworkError } from './cloud-errors.ts'
import { nativeHttpJson } from './native-http.ts'
import { shouldProxyWebHost, WEB_PROXY_PATH } from './web-proxy.ts'
import { abortError, isTurnAborted, raceTurn, withTurnSignal } from './turn-abort.ts'

const WEB_GET_MS = 12_000

function abortAfter(ms: number): AbortSignal {
  const ac = new AbortController()
  const t = globalThis.setTimeout(() => ac.abort(), ms)
  t.unref?.()
  return ac.signal
}

function throwIfAborted(): void {
  if (isTurnAborted()) throw abortError()
}

function wrapNativeHttpError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err)
  if (/not implemented|unimplemented|no such method/i.test(msg)) {
    throw err instanceof Error ? err : new Error(msg)
  }
  if (
    /unknownhost|unable to resolve|network|timeout|timed out|connect|ssl|certificate|refused|failed to fetch|handshake/i.test(
      msg,
    )
  ) {
    const hint = msg.replace(/\s+/g, ' ').slice(0, 140)
    throw new Error(`${germanNetworkError()} (${hint})`)
  }
  throw err instanceof Error ? err : new Error(msg)
}

function parseJsonBody(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    if (Array.isArray(parsed)) return { items: parsed } as unknown as Record<string, unknown>
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
  } catch {
    /* unten */
  }
  return { error: { message: raw || 'Ungültige Antwort' } }
}

/** Android-Brücke serialisiert verschachteltes JSON zuverlässiger als rohe Objekte. */
function nativePostData(body: unknown): string | Record<string, unknown> {
  if (body == null) return '{}'
  if (typeof body === 'string') return body
  return JSON.stringify(body)
}

/** Browser darf User-Agent nicht setzen — das löst Preflight aus und killt Wikipedia/Frankfurter. */
export function browserSafeHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers)) {
    if (/^user-agent$/i.test(k)) continue
    out[k] = v
  }
  return out
}

/** Vite-Dev: relative Proxy-URL. Native und Node bleiben bei der Original-URL. */
export function browserFetchUrl(url: string): string {
  if (Capacitor.isNativePlatform()) return url
  if (typeof window === 'undefined') return url
  if (!/^https:/i.test(url)) return url
  let host = ''
  try {
    host = new URL(url).hostname
  } catch {
    return url
  }
  if (!shouldProxyWebHost(host)) return url
  const loc = window.location
  if (!loc || (loc.hostname !== 'localhost' && loc.hostname !== '127.0.0.1')) return url
  return `${WEB_PROXY_PATH}?url=${encodeURIComponent(url)}`
}

export async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs?: number,
): Promise<{ status: number; json: Record<string, unknown>; headers: Record<string, string> }> {
  const read = timeoutMs && timeoutMs > 0 ? timeoutMs : 60_000
  const connect = Math.min(8_000, Math.max(400, Math.min(read, Math.floor(read * 0.5))))
  if (Capacitor.isNativePlatform()) {
    throwIfAborted()
    const payload = typeof body === 'string' ? body : JSON.stringify(body ?? {})
    try {
      const res = await raceTurn(
        nativeHttpJson({ url, method: 'POST', body: payload, headers, timeoutMs: read }),
      )
      throwIfAborted()
      return { status: res.status, json: parseJsonBody(res.body), headers: res.headers }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!/not implemented|unimplemented|no such method|Kein nativer HTTP/i.test(msg)) {
        wrapNativeHttpError(err)
      }
    }
    let res
    try {
      res = await raceTurn(
        CapacitorHttp.post({
          url,
          headers,
          data: nativePostData(body),
          connectTimeout: connect,
          readTimeout: read,
        }),
      )
    } catch (err) {
      wrapNativeHttpError(err)
    }
    throwIfAborted()
    let json: Record<string, unknown> = {}
    try {
      json = (typeof res.data === 'string' ? JSON.parse(res.data || '{}') : res.data || {}) as Record<
        string,
        unknown
      >
    } catch {
      json = { error: { message: String(res.data || 'Ungültige Antwort') } }
    }
    return { status: res.status, json, headers: lowerKeys(res.headers) }
  }
  const res = await fetch(browserFetchUrl(url), {
    method: 'POST',
    headers: browserSafeHeaders(headers),
    body: JSON.stringify(body),
    signal: withTurnSignal(timeoutMs && timeoutMs > 0 ? abortAfter(timeoutMs) : undefined),
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  const out: Record<string, string> = {}
  res.headers.forEach((v, k) => {
    out[k.toLowerCase()] = v
  })
  return { status: res.status, json, headers: out }
}

/** Kopfzeilen kommen je nach Brücke unterschiedlich groß geschrieben. */
function lowerKeys(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) out[k.toLowerCase()] = String(v)
  return out
}

export async function postForm(
  url: string,
  fields: Record<string, string>,
  timeoutMs = 12_000,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const body = new URLSearchParams(fields).toString()
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }
  const read = Math.max(400, timeoutMs)
  const connect = Math.min(8_000, Math.max(400, Math.floor(read * 0.5)))
  if (Capacitor.isNativePlatform()) {
    throwIfAborted()
    const res = await raceTurn(
      CapacitorHttp.post({
        url,
        headers,
        data: body,
        connectTimeout: connect,
        readTimeout: read,
      }),
    )
    throwIfAborted()
    let json: Record<string, unknown> = {}
    try {
      json = (typeof res.data === 'string' ? JSON.parse(res.data || '{}') : res.data || {}) as Record<
        string,
        unknown
      >
    } catch {
      json = { error: { message: String(res.data || 'Ungültige Antwort') } }
    }
    return { status: res.status, json }
  }
  const res = await fetch(browserFetchUrl(url), {
    method: 'POST',
    headers: browserSafeHeaders(headers),
    body,
    signal: withTurnSignal(abortAfter(read)),
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { status: res.status, json }
}

export async function getJson(
  url: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; json: Record<string, unknown> }> {
  if (Capacitor.isNativePlatform()) {
    throwIfAborted()
    try {
      const res = await raceTurn(nativeHttpJson({ url, method: 'GET', headers, timeoutMs: 20_000 }))
      throwIfAborted()
      let parsed: unknown = {}
      try {
        parsed = res.body ? JSON.parse(res.body) : {}
      } catch {
        parsed = { error: { message: res.body || 'Ungültige Antwort' } }
      }
      const json = (
        Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? parsed : {}
      ) as Record<string, unknown>
      return { status: res.status, json }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!/not implemented|unimplemented|no such method|Kein nativer HTTP/i.test(msg)) {
        wrapNativeHttpError(err)
      }
    }
    const res = await raceTurn(
      CapacitorHttp.get({
        url,
        headers,
        connectTimeout: 12_000,
        readTimeout: 20_000,
      }),
    )
    throwIfAborted()
    let json: Record<string, unknown> = {}
    try {
      const parsed: unknown = typeof res.data === 'string' ? JSON.parse(res.data || '{}') : res.data
      json = (Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? parsed : {}) as Record<
        string,
        unknown
      >
    } catch {
      json = { error: { message: String(res.data || 'Ungültige Antwort') } }
    }
    return { status: res.status, json }
  }
  const res = await fetch(browserFetchUrl(url), {
    headers: browserSafeHeaders(headers),
    signal: withTurnSignal(abortAfter(WEB_GET_MS)),
  })
  const parsed: unknown = await res.json().catch(() => ({}))
  const json = (
    Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? parsed : {}
  ) as Record<string, unknown>
  return { status: res.status, json }
}

export async function getText(
  url: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; text: string; headers: Record<string, string> }> {
  if (Capacitor.isNativePlatform()) {
    throwIfAborted()
    const res = await raceTurn(
      CapacitorHttp.get({
        url,
        headers,
        connectTimeout: 12_000,
        readTimeout: 20_000,
        responseType: 'text',
      }),
    )
    throwIfAborted()
    const text = typeof res.data === 'string' ? res.data : res.data == null ? '' : JSON.stringify(res.data)
    return { status: res.status, text, headers: lowerKeys(res.headers) }
  }
  const res = await fetch(browserFetchUrl(url), {
    headers: browserSafeHeaders(headers),
    signal: withTurnSignal(abortAfter(WEB_GET_MS)),
  })
  const out: Record<string, string> = {}
  res.headers.forEach((v, k) => {
    out[k.toLowerCase()] = v
  })
  return { status: res.status, text: await res.text(), headers: out }
}

function bytesFromBase64(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

/** Binary GET. Native CapacitorHttp avoids CORS (gTTS). */
export async function getBinary(
  url: string,
  headers: Record<string, string> = {},
  timeoutMs = 8_000,
): Promise<{ status: number; bytes: Uint8Array }> {
  const read = Math.max(400, timeoutMs)
  const connect = Math.min(8_000, Math.max(400, Math.floor(read * 0.5)))
  if (Capacitor.isNativePlatform()) {
    throwIfAborted()
    const res = await raceTurn(
      CapacitorHttp.get({
        url,
        headers,
        connectTimeout: connect,
        readTimeout: read,
        responseType: 'arraybuffer',
      }),
    )
    throwIfAborted()
    const data = res.data
    const bytes: Uint8Array = typeof data === 'string' && data ? bytesFromBase64(data) : new Uint8Array(0)
    return { status: res.status, bytes }
  }
  const res = await fetch(browserFetchUrl(url), {
    headers: browserSafeHeaders(headers),
    signal: withTurnSignal(abortAfter(read)),
  })
  const buf = await res.arrayBuffer()
  return { status: res.status, bytes: new Uint8Array(buf) }
}
