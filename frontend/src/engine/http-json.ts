import { Capacitor, CapacitorHttp } from '@capacitor/core'
import { shouldProxyWebHost, WEB_PROXY_PATH } from './web-proxy.ts'

const WEB_GET_MS = 12_000

function abortAfter(ms: number): AbortSignal {
  const ac = new AbortController()
  globalThis.setTimeout(() => ac.abort(), ms)
  return ac.signal
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
): Promise<{ status: number; json: Record<string, unknown> }> {
  const read = timeoutMs && timeoutMs > 0 ? timeoutMs : 60_000
  const connect = Math.min(8_000, Math.max(400, Math.min(read, Math.floor(read * 0.5))))
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.post({
      url,
      headers,
      data: body,
      connectTimeout: connect,
      readTimeout: read,
    })
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
    body: JSON.stringify(body),
    signal: timeoutMs && timeoutMs > 0 ? abortAfter(timeoutMs) : undefined,
  })
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { status: res.status, json }
}

export async function getJson(
  url: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; json: Record<string, unknown> }> {
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.get({
      url,
      headers,
      connectTimeout: 12_000,
      readTimeout: 20_000,
    })
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
    signal: abortAfter(WEB_GET_MS),
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
): Promise<{ status: number; text: string }> {
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.get({
      url,
      headers,
      connectTimeout: 12_000,
      readTimeout: 20_000,
      responseType: 'text',
    })
    const text = typeof res.data === 'string' ? res.data : res.data == null ? '' : JSON.stringify(res.data)
    return { status: res.status, text }
  }
  const res = await fetch(browserFetchUrl(url), {
    headers: browserSafeHeaders(headers),
    signal: abortAfter(WEB_GET_MS),
  })
  return { status: res.status, text: await res.text() }
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
    const res = await CapacitorHttp.get({
      url,
      headers,
      connectTimeout: connect,
      readTimeout: read,
      responseType: 'arraybuffer',
    })
    const data = res.data
    const bytes: Uint8Array = typeof data === 'string' && data ? bytesFromBase64(data) : new Uint8Array(0)
    return { status: res.status, bytes }
  }
  const res = await fetch(browserFetchUrl(url), {
    headers: browserSafeHeaders(headers),
    signal: abortAfter(read),
  })
  const buf = await res.arrayBuffer()
  return { status: res.status, bytes: new Uint8Array(buf) }
}
