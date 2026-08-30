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

export function parseCoord(raw: string): number | null {
  const t = (raw || '').trim()
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** Fresh GPS for pins: not empty, not 0/0, not older than LOCATION_KEEP_MS. */
export function isFreshHereFix(
  latRaw: string,
  lonRaw: string,
  fixAt: string,
  now = Date.now(),
): { lat: number; lon: number } | null {
  const lat = parseCoord(latRaw)
  const lon = parseCoord(lonRaw)
  if (lat == null || lon == null) return null
  if (lat === 0 && lon === 0) return null
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  if (!storedFixAllowed(true, fixAt, now)) return null
  return { lat, lon }
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
  const here = isFreshHereFix(s.last_lat, s.last_lon, s.last_fix_at, now)
  if (!here) {
    forgetStoredFix()
    return null
  }
  return { lat: here.lat, lon: here.lon, place: s.last_place || 'hier' }
}
