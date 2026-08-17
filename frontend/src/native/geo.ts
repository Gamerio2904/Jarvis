import { Capacitor, registerPlugin } from '@capacitor/core'
import { withTimeout } from './with-timeout'

type NativeGeo = {
  hasPermission(): Promise<{ granted: boolean }>
  requestPermission(): Promise<{ granted: boolean }>
  getLocation(): Promise<{ ok: boolean; lat?: number; lon?: number; message?: string }>
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
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 15 * 60_000 },
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
    { enableHighAccuracy: true, timeout: 8_000, maximumAge: 1_000 },
  )
  return () => navigator.geolocation.clearWatch(id)
}
