import { Capacitor, registerPlugin } from '@capacitor/core'
import { withTimeout } from './with-timeout'

export type HomeDevice = {
  host: string
  mac?: string
  name?: string
  kind?: string
  deviceId?: string
  version?: string
  type?: number
}

export type HomeResult = {
  ok: boolean
  message?: string
  host?: string
  mac?: string
  code?: string
  kind?: string
  on?: boolean
  items?: HomeDevice[]
}

type NativeHome = {
  discover(): Promise<HomeResult>
  learn(opts: { host: string; mac?: string }): Promise<HomeResult>
  send(opts: { host: string; mac?: string; code: string }): Promise<HomeResult>
  test(opts: { host: string; mac?: string }): Promise<HomeResult>
  plugDiscover(): Promise<HomeResult>
  plugProbe(opts: PlugNativeOpts): Promise<HomeResult>
  plugSet(opts: PlugNativeOpts): Promise<HomeResult>
}

export type PlugNativeOpts = {
  host?: string
  kind?: string
  mac?: string
  deviceId?: string
  localKey?: string
  version?: string
  dps?: string
  onUrl?: string
  offUrl?: string
  on?: boolean
  statusOnly?: boolean
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

export async function plugDiscoverNative(): Promise<HomeResult> {
  if (!native) return { ok: false, items: [], message: webUnavailable('Steckdosen suchen').message }
  try {
    return await withTimeout(native.plugDiscover(), 14_000, {
      ok: false,
      items: [],
      message: 'Keine Steckdose gefunden. Gleiches WLAN, nicht Gastnetz.',
    })
  } catch (err) {
    return { ok: false, items: [], message: err instanceof Error ? err.message : 'Suche fehlgeschlagen' }
  }
}

export async function plugProbeNative(opts: PlugNativeOpts): Promise<HomeResult> {
  if (!native) return webUnavailable('Steckdose prüfen')
  try {
    return await withTimeout(native.plugProbe(opts), 10_000, {
      ok: false,
      message: 'Steckdose antwortet nicht. IP und gleiches WLAN prüfen.',
    })
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Prüfung fehlgeschlagen' }
  }
}

export async function plugSetNative(opts: PlugNativeOpts): Promise<HomeResult> {
  if (!native) return webUnavailable('Steckdose schalten')
  try {
    return await withTimeout(native.plugSet(opts), 10_000, {
      ok: false,
      message: 'Steckdose hat nicht geschaltet. IP, Typ und Local Key prüfen.',
    })
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Schalten fehlgeschlagen' }
  }
}
