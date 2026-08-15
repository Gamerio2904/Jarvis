import { Capacitor, registerPlugin } from '@capacitor/core'

type NativeGeo = {
  requestPermission(): Promise<{ granted: boolean }>
  getLocation(): Promise<{ ok: boolean; lat?: number; lon?: number; message?: string }>
}

const native = Capacitor.isNativePlatform() ? registerPlugin<NativeGeo>('JarvisGeo') : null

export async function requestLocationPermission(): Promise<boolean> {
  if (native) {
    try {
      const res = await native.requestPermission()
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
      return await native.getLocation()
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
