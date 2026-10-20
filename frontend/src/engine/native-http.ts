import { Capacitor, registerPlugin } from '@capacitor/core'

type NativeHttp = {
  httpJson(opts: {
    url: string
    method?: string
    body?: string
    headers?: Record<string, string>
    timeoutMs?: number
  }): Promise<{ status: number; body: string; headers?: Record<string, string> }>
}

const native = Capacitor.isNativePlatform() ? registerPlugin<NativeHttp>('JarvisVoice') : null

export function hasNativeHttp(): boolean {
  return Boolean(native?.httpJson)
}

export async function nativeHttpJson(opts: {
  url: string
  method?: string
  body?: string
  headers?: Record<string, string>
  timeoutMs?: number
}): Promise<{ status: number; body: string; headers: Record<string, string> }> {
  if (!native?.httpJson) throw new Error('Kein nativer HTTP-Weg.')
  const res = await native.httpJson(opts)
  const headers: Record<string, string> = {}
  const raw = res.headers
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) headers[k.toLowerCase()] = String(v)
  }
  return { status: Number(res.status) || 0, body: res.body || '', headers }
}
