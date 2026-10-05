import { Capacitor, registerPlugin } from '@capacitor/core'
import { withTimeout } from './with-timeout'

type NativeGeo = {
  hasPermission(): Promise<{ granted: boolean }>
  requestPermission(): Promise<{ granted: boolean }>
  getLocation(): Promise<{ ok: boolean; lat?: number; lon?: number; message?: string }>
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
