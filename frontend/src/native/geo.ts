import { Capacitor, registerPlugin } from '@capacitor/core'
import { forgetStoredFix, rememberStoredFix } from '../engine/location-keep'
import { withTimeout } from './with-timeout'

type NativeGeo = {
  hasPermission(): Promise<{ granted: boolean }>
  requestPermission(): Promise<{ granted: boolean }>
  getLocation(): Promise<{ ok: boolean; lat?: number; lon?: number; message?: string }>
  locationEnabled(): Promise<{ ok: boolean; enabled?: boolean }>
  openSettings(opts: { kind?: string }): Promise<{ ok: boolean; message?: string }>
  startWatch(): Promise<{ ok: boolean; message?: string }>
  stopWatch(): Promise<{ ok: boolean }>
  addListener(
    event: 'fix',
    cb: (ev: { lat?: number; lon?: number; bearing?: number; speed?: number }) => void,
  ): Promise<{ remove: () => void }>
}

const native = Capacitor.isNativePlatform() ? registerPlugin<NativeGeo>('JarvisGeo') : null

const FAIL = {
  ok: false as const,
  message: 'Standort dauert zu lange. Unter Android erlauben oder einen Ort nennen.',
}

export async function hasLocationPermission(): Promise<boolean> {
  if (native) {
    try {
      const res = await withTimeout(native.hasPermission(), 3_000, { granted: false })
      return Boolean(res.granted)
    } catch {
      return false
    }
  }
  return true
}

export async function requestLocationPermission(): Promise<boolean> {
  if (native) {
    try {
      const res = await withTimeout(native.requestPermission(), 25_000, { granted: false })
      return Boolean(res.granted)
    } catch {
      return false
    }
  }
  return true
}

export async function isLocationEnabled(): Promise<boolean> {
  if (native) {
    try {
      const res = await withTimeout(native.locationEnabled(), 3_000, { ok: false, enabled: false })
      return Boolean(res.enabled)
    } catch {
      return true
    }
  }
  return true
}

export async function openAppLocationSettings(kind: 'app' | 'location' = 'app'): Promise<boolean> {
  if (native) {
    try {
      const res = await withTimeout(native.openSettings({ kind }), 8_000, { ok: false })
      return Boolean(res.ok)
    } catch {
      return false
    }
  }
  return false
}

export type EnsureLocation = {
  ok: boolean
  lat?: number
  lon?: number
  granted: boolean
  openedSettings: boolean
  message?: string
}

/** Systemdialog, bei Bedarf App- oder Standort-Einstellungen. Den Schalter legt Jarvis nicht selbst um. */
export async function ensureDeviceLocation(opts?: { openSettingsIfDenied?: boolean }): Promise<EnsureLocation> {
  const open = Boolean(opts?.openSettingsIfDenied)
  let granted = await hasLocationPermission()
  if (!granted) granted = await requestLocationPermission()
  if (!granted) forgetStoredFix()
  if (granted) {
    const services = await isLocationEnabled()
    if (!services) {
      const openedSettings = open ? await openAppLocationSettings('location') : false
      return {
        ok: false,
        granted: true,
        openedSettings,
        message: openedSettings
          ? 'Standort-Dienst am Gerät ist aus. Die Android-Seite ist offen — GPS an, dann nochmal sagen. Den Schalter lege ich nicht selbst um.'
          : 'Standort-Dienst am Gerät ist aus. Sagen Sie „aktivieren“, dann öffne ich die Android-Seite.',
      }
    }
    const loc = await readDeviceLocation()
    if (loc.ok && loc.lat != null && loc.lon != null) {
      rememberStoredFix(loc.lat, loc.lon)
      return { ok: true, lat: loc.lat, lon: loc.lon, granted: true, openedSettings: false }
    }
    return {
      ok: false,
      granted: true,
      openedSettings: false,
      message: loc.message || 'Noch kein Fix. Kurz draußen oder WLAN an, dann nochmal.',
    }
  }
  const openedSettings = open ? await openAppLocationSettings('app') : false
  if (openedSettings) {
    return {
      ok: false,
      granted: false,
      openedSettings: true,
      message:
        'App-Einstellungen für Jarvis sind offen. Dort Standort erlauben — nur dieses Mal oder bei Nutzung der App, kein Dauerzugriff. Zurückkommen, nochmal sagen.',
    }
  }
  return {
    ok: false,
    granted: false,
    openedSettings: false,
    message:
      Capacitor.isNativePlatform()
        ? 'Standort ist aus. Sagen Sie „aktivieren“. Android fragt, wie lange: nur jetzt oder bei Nutzung. Jarvis merkt den Fix höchstens 10 Minuten. Ich rate nicht.'
        : 'Im Browser keine Systemfreigabe. Auf dem Handy: Standort für Jarvis erlauben.',
  }
}

export async function readDeviceLocation(): Promise<{
  ok: boolean
  lat?: number
  lon?: number
  message?: string
}> {
  if (native) {
    try {
      return await withTimeout(native.getLocation(), 8_000, FAIL)
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Standort fehlgeschlagen' }
    }
  }
  if (!navigator.geolocation) {
    return { ok: false, message: 'Kein Standort in diesem Browser.' }
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ ok: true, lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      (err) => {
        resolve({
          ok: false,
          message:
            err.code === 1
              ? 'Standort verweigert. Unter Android erlauben oder einen Ort nennen.'
              : 'Standort nicht gefunden.',
        })
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 15_000 },
    )
  })
}

export type GeoWatchFix = {
  ok: boolean
  lat?: number
  lon?: number
  bearing?: number
  speed?: number
  message?: string
}

export function watchDeviceLocation(cb: (fix: GeoWatchFix) => void): () => void {
  if (native) {
    let handle: { remove: () => void } | undefined
    let stopped = false
    void native
      .addListener('fix', (ev) => {
        if (stopped) return
        const lat = Number(ev.lat)
        const lon = Number(ev.lon)
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
        cb({
          ok: true,
          lat,
          lon,
          bearing: Number.isFinite(Number(ev.bearing)) ? Number(ev.bearing) : undefined,
          speed: Number.isFinite(Number(ev.speed)) ? Number(ev.speed) : undefined,
        })
      })
      .then((h) => {
        handle = h
      })
    void native.startWatch().then((res) => {
      if (stopped) {
        void native.stopWatch()
        return
      }
      if (!res.ok) cb({ ok: false, message: res.message || 'Kein Standort.' })
    })
    void readDeviceLocation().then((fix) => {
      if (!stopped && fix.ok) cb(fix)
    })
    return () => {
      stopped = true
      handle?.remove()
      void native.stopWatch()
    }
  }
  if (!navigator.geolocation) {
    cb({ ok: false, message: 'Kein Standort in diesem Browser.' })
    return () => undefined
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      const heading = pos.coords.heading
      cb({
        ok: true,
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        bearing: heading != null && Number.isFinite(heading) && heading >= 0 ? heading : undefined,
        speed: pos.coords.speed != null && Number.isFinite(pos.coords.speed) ? pos.coords.speed : undefined,
      })
    },
    (err) => {
      cb({
        ok: false,
        message:
          err.code === 1
            ? 'Standort verweigert. Unter Android erlauben oder einen Ort nennen.'
            : 'Standort nicht gefunden.',
      })
    },
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 5_000 },
  )
  return () => navigator.geolocation.clearWatch(id)
}
