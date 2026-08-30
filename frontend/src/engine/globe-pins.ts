import { getJson } from './http-json.ts'
import { isFreshHereFix } from './location-keep.ts'
import { loadSettings } from './store.ts'
import { pinForTag, pinForText, type GeoFix } from './globe-geo.ts'
import type { OutlookSnap } from './outlook.ts'
import { tourGlowPins } from './globe-tour.ts'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/6.92.0 (local.jarvis.app)' }

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
  const here = isFreshHereFix(s.last_lat, s.last_lon, s.last_fix_at)
  if (here) add({ name: 'Sie', lat: here.lat, lon: here.lon, kind: 'here', line: s.last_place || 'GPS' })
  const iss = await loadIss()
  if (iss) add({ name: 'ISS', lat: iss.lat, lon: iss.lon, kind: 'iss', line: 'Where The ISS At' })
  if (s.last_warn_line && here) {
    add({
      name: 'Unwetter',
      lat: here.lat,
      lon: here.lon,
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

const ISS_TTL_MS = 30_000
let issCache: { at: number; pos: { lat: number; lon: number } } | null = null

async function loadIss(): Promise<{ lat: number; lon: number } | null> {
  if (issCache && Date.now() - issCache.at < ISS_TTL_MS) return issCache.pos
  try {
    const { status, json } = await getJson('https://api.wheretheiss.at/v1/satellites/25544', UA)
    if (status < 200 || status >= 300) return issCache?.pos || null
    const lat = Number(json.latitude)
    const lon = Number(json.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return issCache?.pos || null
    issCache = { at: Date.now(), pos: { lat, lon } }
    return issCache.pos
  } catch {
    return issCache?.pos || null
  }
}
