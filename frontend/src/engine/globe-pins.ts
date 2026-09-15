import { getJson, getText } from './http-json.ts'
import { isFreshHereFix, parseCoord } from './location-keep.ts'
import { loadSettings } from './store.ts'
import { pinForTag, pinForText, pinLineFor, type GeoFix } from './globe-geo.ts'
import type { OutlookSnap } from './outlook.ts'
import { tourGlowPins } from './globe-tour.ts'
import { cachedLayer, fetchLayer, pinsForActiveLayer } from './globe-layers.ts'
import { jsonUA } from './ua.ts'

const UA = jsonUA

export async function loadGlobePins(): Promise<GeoFix[]> {
  const s = loadSettings()
  const layer = s.globe_layer
  if (layer) {
    const got = cachedLayer()
    if (!got || got.layer !== layer) await fetchLayer(layer)
  }
  const pins: GeoFix[] = []
  const seen = new Set<string>()
  const add = (p: GeoFix) => {
    const key = `${p.kind}:${p.lat.toFixed(3)}:${p.lon.toFixed(3)}:${p.name}`
    if (seen.has(key)) return
    seen.add(key)
    pins.push(p)
  }
  for (const g of tourGlowPins()) add(g)
  try {
    const raw = s.last_globe_focus
    if (raw) {
      const focus = JSON.parse(raw) as { name?: string; lat?: unknown; lon?: unknown }
      const lat = parseCoord(String(focus.lat ?? ''))
      const lon = parseCoord(String(focus.lon ?? ''))
      if (focus.name && lat != null && lon != null && !(lat === 0 && lon === 0)) {
        const name = String(focus.name)
        if (!/^iss$/i.test(name)) {
          add({ name, lat, lon, kind: 'outlook', line: pinLineFor(name, s.last_globe_brief) })
        }
      }
    }
  } catch {
    /* ignore */
  }
  const here = isFreshHereFix(s.last_lat, s.last_lon, s.last_fix_at)
  if (here) add({ name: 'Sie', lat: here.lat, lon: here.lon, kind: 'here', line: s.last_place || 'GPS' })
  const iss = await loadIss()
  if (iss) add({ name: 'ISS', lat: iss.lat, lon: iss.lon, kind: 'iss', line: 'Where The ISS At' })
  for (const p of pinsForActiveLayer()) add(p)
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

export async function loadIssTrail(): Promise<{ lat: number; lon: number }[]> {
  await loadIss()
  return trailCache?.trail || []
}

const ISS_TTL_MS = 30_000
let issCache: { at: number; pos: { lat: number; lon: number } } | null = null
let trailCache: { at: number; trail: { lat: number; lon: number }[]; pos: { lat: number; lon: number } } | null = null

async function loadIss(): Promise<{ lat: number; lon: number } | null> {
  if (trailCache && Date.now() - trailCache.at < ISS_TTL_MS) return trailCache.pos
  if (issCache && Date.now() - issCache.at < ISS_TTL_MS) return issCache.pos
  const now = Math.floor(Date.now() / 1000)
  const stamps: number[] = []
  for (let i = -4; i <= 12; i += 1) stamps.push(now + i * 300)
  try {
    const { status, text } = await getText(
      `https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=${stamps.join(',')}`,
      UA,
    )
    if (status >= 200 && status < 300 && text) {
      const rows = JSON.parse(text) as unknown
      const list = Array.isArray(rows) ? rows : []
      const trail: { lat: number; lon: number }[] = []
      for (const row of list) {
        if (!row || typeof row !== 'object') continue
        const lat = Number((row as { latitude?: unknown }).latitude)
        const lon = Number((row as { longitude?: unknown }).longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
        trail.push({ lat, lon })
      }
      if (trail.length) {
        const mid = trail[Math.min(4, trail.length - 1)]
        trailCache = { at: Date.now(), trail, pos: mid }
        issCache = { at: Date.now(), pos: mid }
        return mid
      }
    }
  } catch {
    /* single-point fallback */
  }
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
