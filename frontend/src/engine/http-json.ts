import { Capacitor, CapacitorHttp } from '@capacitor/core'

export async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<{ status: number; json: Record<string, unknown> }> {
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.post({
      url,
      headers,
      data: body,
      connectTimeout: 15_000,
      readTimeout: 60_000,
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
