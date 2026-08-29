import { getJson } from './http-json.ts'
import { loadSettings } from './store.ts'
import { pinForTag, pinForText, type GeoFix } from './globe-geo.ts'
import type { OutlookSnap } from './outlook.ts'
import { tourGlowPins } from './globe-tour.ts'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/6.90.0 (local.jarvis.app)' }

export async function loadGlobePins(): Promise<GeoFix[]> {
  const s = loadSettings()
  const pins: GeoFix[] = []
  const seen = new Set<string>()
  const add = (p: GeoFix) => {
    if (seen.has(p.name)) return
    seen.add(p.name)
    pins.push(p)
  }
  for (const g of tourGlowPins()) add(g)
  try {
    const raw = s.last_globe_focus
    if (raw) {
      const focus = JSON.parse(raw) as { name?: string; lat?: number; lon?: number }
      const lat = Number(focus.lat)
      const lon = Number(focus.lon)
      if (focus.name && Number.isFinite(lat) && Number.isFinite(lon)) {
        add({ name: focus.name, lat, lon, kind: 'outlook', line: s.last_globe_brief || 'Gazetteer' })
      }
    }
  } catch {
    /* ignore */
  }
  const lat = Number(s.last_lat)
  const lon = Number(s.last_lon)
  if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90) {
    add({ name: 'Sie', lat, lon, kind: 'here', line: s.last_place || 'GPS' })
  }
  const iss = await loadIss()
  if (iss) add({ name: 'ISS', lat: iss.lat, lon: iss.lon, kind: 'iss', line: 'Where The ISS At' })
  if (s.last_warn_line) {
    add({
      name: 'Unwetter',
      lat: Number.isFinite(lat) ? lat : 51.16,
      lon: Number.isFinite(lon) ? lon : 10.45,
      kind: 'warn',
      line: s.last_warn_line,
    })
  }
  try {
    const raw = s.last_outlook_json
    if (raw) {
      const snap = JSON.parse(raw) as OutlookSnap
      for (const n of snap.news || []) {
        for (const tag of n.tags || []) {
          const p = pinForTag(tag)
          if (p) add({ ...p, line: n.title })
        }
        const fromText = pinForText(`${n.title} ${n.teaser}`)
        if (fromText) add(fromText)
      }
    }
  } catch {
    /* ignore */
  }
  return pins
}

export async function fetchIssNow(): Promise<{ lat: number; lon: number } | null> {
  return loadIss()
}

async function loadIss(): Promise<{ lat: number; lon: number } | null> {
  try {
    const { status, json } = await getJson('https://api.wheretheiss.at/v1/satellites/25544', UA)
    if (status < 200 || status >= 300) return null
    const lat = Number(json.latitude)
    const lon = Number(json.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
    return { lat, lon }
  } catch {
    return null
  }
}
