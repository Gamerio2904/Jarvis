import { ensureDeviceLocation } from '../native/geo'
import { loadSettings } from './store'

const NO_GPS =
  'Ohne Standort keine Lage. Sagen Sie „aktivieren“ — Android-Abfrage, notfalls App-Einstellungen. Ich rate den Ort nicht.'

export async function resolveFix(): Promise<{ ok: true; lat: number; lon: number } | { ok: false; message: string }> {
  const s = loadSettings()
  const lat = Number(s.last_lat)
  const lon = Number(s.last_lon)
  if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
    return { ok: true, lat, lon }
  }
  try {
    const fix = await ensureDeviceLocation()
    if (fix.ok && Number.isFinite(fix.lat) && Number.isFinite(fix.lon)) {
      return { ok: true, lat: Number(fix.lat), lon: Number(fix.lon) }
    }
    if (fix.message) return { ok: false, message: fix.message }
  } catch {
    /* ehrlich leer */
  }
  return { ok: false, message: NO_GPS }
}
