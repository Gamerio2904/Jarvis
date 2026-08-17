import { Capacitor, CapacitorHttp } from '@capacitor/core'

function abortAfter(ms: number): AbortSignal {
  const ac = new AbortController()
  globalThis.setTimeout(() => ac.abort(), ms)
  return ac.signal
}

export async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs?: number,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const read = timeoutMs && timeoutMs > 0 ? timeoutMs : 60_000
  const connect = Math.min(15_000, Math.max(3_000, Math.floor(read * 0.4)))
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
  const res = await fetch(url, {
    method: 'POST',
    headers,
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
  const res = await fetch(url, { headers })
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
  const res = await fetch(url, { headers })
  return { status: res.status, text: await res.text() }
}
