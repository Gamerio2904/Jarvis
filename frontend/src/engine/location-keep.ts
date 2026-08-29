import { loadSettings, saveSettings } from './store.ts'

/** How long Jarvis may reuse a stored fix while Android still grants access. */
export const LOCATION_KEEP_MS = 10 * 60 * 1000

export function storedFixAllowed(granted: boolean, iso: string, now = Date.now()): boolean {
  if (!granted) return false
  const at = Date.parse(iso || '')
  if (!Number.isFinite(at)) return false
  return now - at >= 0 && now - at <= LOCATION_KEEP_MS
}

export function forgetStoredFix(): void {
  const s = loadSettings()
  if (!s.last_lat && !s.last_lon && !s.last_fix_at && !s.last_place) return
  saveSettings({ last_lat: '', last_lon: '', last_place: '', last_fix_at: '' })
}

export function pruneStoredFix(now = Date.now()): void {
  const s = loadSettings()
  if (!s.last_fix_at && !s.last_lat) return
  if (!storedFixAllowed(true, s.last_fix_at, now)) forgetStoredFix()
}

export function rememberStoredFix(lat: number, lon: number, place?: string): void {
  saveSettings({
    last_lat: String(lat),
    last_lon: String(lon),
    last_fix_at: new Date().toISOString(),
    last_place: place != null && place.trim() ? place.trim() : loadSettings().last_place,
  })
}

export function readStoredFix(
  granted: boolean,
  now = Date.now(),
): { lat: number; lon: number; place: string } | null {
  if (!granted) {
    forgetStoredFix()
    return null
  }
  const s = loadSettings()
  if (!storedFixAllowed(true, s.last_fix_at, now)) {
    forgetStoredFix()
    return null
  }
  const lat = Number(s.last_lat)
  const lon = Number(s.last_lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    forgetStoredFix()
    return null
  }
  return { lat, lon, place: s.last_place || 'hier' }
}
