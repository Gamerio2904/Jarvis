import { Capacitor, registerPlugin } from '@capacitor/core'
import { withTimeout } from './with-timeout'

export type HomeDevice = {
  host: string
  mac?: string
  name?: string
  kind?: string
}

export type HomeResult = {
  ok: boolean
  message?: string
  host?: string
  mac?: string
  code?: string
  items?: HomeDevice[]
}

type NativeHome = {
  discover(): Promise<HomeResult>
  learn(opts: { host: string; mac?: string }): Promise<HomeResult>
  send(opts: { host: string; mac?: string; code: string }): Promise<HomeResult>
  test(opts: { host: string; mac?: string }): Promise<HomeResult>
}

const native = Capacitor.isNativePlatform() ? registerPlugin<NativeHome>('JarvisHome') : null

function webUnavailable(action: string): HomeResult {
  return { ok: false, message: `${action} nur in der Android-App (UDP zur Brücke).` }
}

export async function homeDiscoverNative(): Promise<HomeResult> {
  if (!native) return { ok: false, items: [], message: webUnavailable('Suchen').message }
  try {
    return await withTimeout(native.discover(), 14_000, {
      ok: false,
      items: [],
      message: 'Keine Brücke gefunden. Gleiches WLAN, RM4 Pro an, dann nochmal.',
    })
  } catch (err) {
    return { ok: false, items: [], message: err instanceof Error ? err.message : 'Suche fehlgeschlagen' }
  }
}

export async function homeLearnNative(opts: { host: string; mac?: string }): Promise<HomeResult> {
  if (!native) return webUnavailable('Lernen')
  try {
    return await withTimeout(native.learn(opts), 28_000, {
      ok: false,
      message: 'Nichts gelernt. Fernbedienung auf die Brücke richten und Taste halten.',
    })
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Lernen fehlgeschlagen' }
  }
}

export async function homeSendNative(opts: { host: string; mac?: string; code: string }): Promise<HomeResult> {
  if (!native) return webUnavailable('Senden')
  try {
    return await withTimeout(native.send(opts), 10_000, {
      ok: false,
      message: 'Brücke hat den Code nicht gesendet. Gleiches WLAN, IP prüfen.',
    })
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Senden fehlgeschlagen' }
  }
}

export async function homeTestNative(opts: { host: string; mac?: string }): Promise<HomeResult> {
  if (!native) return webUnavailable('Test')
  try {
    return await withTimeout(native.test(opts), 10_000, {
      ok: false,
      message: 'Brücke antwortet nicht. IP, gleiches WLAN, kein Gastnetz.',
    })
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Test fehlgeschlagen' }
  }
}
