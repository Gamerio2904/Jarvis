import { getJson, getText } from './http-json.ts'
import { APP_VERSION, loadSettings } from './store.ts'
import type { GeoFix } from './globe-geo.ts'

const UA = { Accept: 'application/json', 'User-Agent': `Jarvis/${APP_VERSION} (local.jarvis.app)` }

export type GlobeLayer = 'quakes' | 'fires' | 'overhead'

export type LayerCache = {
  layer: GlobeLayer
  at: number
  source: string
  pins: GeoFix[]
  error?: string
}

const TTL_MS = 10 * 60_000
const MAX_FULL = 40
const MAX_LITE = 16

const DE = { lat: 51.16, lon: 10.45 }

let cache: LayerCache | null = null

export function layerCap(): number {
  return loadSettings().globe_webgl ? MAX_LITE : MAX_FULL
}

export function ageLine(at: number, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - at) / 60_000))
  if (min <= 1) return 'Stand vor einer Minute'
  return `Stand vor ${min} Minuten`
}

export function cachedLayer(): LayerCache | null {
  if (!cache) return null
  if (Date.now() - cache.at > TTL_MS) return null
  return cache
}

export function pinsForActiveLayer(): GeoFix[] {
  const layer = loadSettings().globe_layer
  if (!layer || !cache || cache.layer !== layer) return []
  return cache.pins.slice(0, layerCap())
}

function take<T>(xs: T[], n: number): T[] {
  return xs.slice(0, n)
}

function magOf(props: Record<string, unknown> | undefined): number {
  const mag = Number(props?.mag)
  return Number.isFinite(mag) ? mag : NaN
}

export async function fetchQuakes(): Promise<LayerCache> {
  const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson'
  try {
    const { status, json } = await getJson(url, UA)
    if (status < 200 || status >= 300) {
      cache = { layer: 'quakes', at: Date.now(), source: 'USGS', pins: [], error: 'USGS antwortet nicht' }
      return cache
    }
    const features = Array.isArray(json.features) ? json.features : []
    const pins: GeoFix[] = []
    for (const raw of features) {
      if (!raw || typeof raw !== 'object') continue
      const f = raw as { geometry?: { coordinates?: unknown }; properties?: Record<string, unknown> }
      const coords = Array.isArray(f.geometry?.coordinates) ? f.geometry.coordinates : []
      const lon = Number(coords[0])
      const lat = Number(coords[1])
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
      const mag = magOf(f.properties)
      if (!(mag >= 4.5)) continue
      const place = String(f.properties?.place || '').trim() || `${mag.toFixed(1)}`
      pins.push({
        name: `M${mag.toFixed(1)}`,
        lat,
        lon,
        kind: 'quake',
        line: place,
      })
      if (pins.length >= MAX_FULL) break
    }
    cache = { layer: 'quakes', at: Date.now(), source: 'USGS', pins: take(pins, MAX_FULL) }
    return cache
  } catch {
    cache = { layer: 'quakes', at: Date.now(), source: 'USGS', pins: [], error: 'USGS ist nicht erreichbar' }
    return cache
  }
}

function eonetCoord(geo: unknown): { lat: number; lon: number } | null {
  if (!geo || typeof geo !== 'object') return null
  const g = geo as { geometry?: unknown }
  const geom = Array.isArray(g.geometry) ? g.geometry[g.geometry.length - 1] : g.geometry
  if (!geom || typeof geom !== 'object') return null
  const coords = (geom as { coordinates?: unknown }).coordinates
  if (!Array.isArray(coords) || coords.length < 2) return null
  const lon = Number(coords[0])
  const lat = Number(coords[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { lat, lon }
}

export async function fetchFires(): Promise<LayerCache> {
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=wildfires&limit=40'
  try {
    const { status, json } = await getJson(url, UA)
    if (status < 200 || status >= 300) {
      cache = { layer: 'fires', at: Date.now(), source: 'NASA EONET', pins: [], error: 'EONET antwortet nicht' }
      return cache
    }
    const events = Array.isArray(json.events) ? json.events : []
    const pins: GeoFix[] = []
    for (const raw of events) {
      if (!raw || typeof raw !== 'object') continue
      const ev = raw as { title?: unknown; geometry?: unknown }
      const at = eonetCoord(ev)
      if (!at) continue
      const title = String(ev.title || 'Waldbrand').slice(0, 48)
      pins.push({ name: title, lat: at.lat, lon: at.lon, kind: 'fire', line: 'NASA EONET' })
      if (pins.length >= MAX_FULL) break
    }
    cache = { layer: 'fires', at: Date.now(), source: 'NASA EONET', pins: take(pins, MAX_FULL) }
    return cache
  } catch {
    cache = { layer: 'fires', at: Date.now(), source: 'NASA EONET', pins: [], error: 'EONET ist nicht erreichbar' }
    return cache
  }
}

export function overheadOrigin(): { lat: number; lon: number; label: string } {
  const lat = Number(loadSettings().last_lat)
  const lon = Number(loadSettings().last_lon)
  if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon, label: 'Standort' }
  return { ...DE, label: 'Deutschland-Mitte' }
}

export async function fetchOverhead(): Promise<LayerCache> {
  const origin = overheadOrigin()
  const box = 0.35
  const url = `https://opensky-network.org/api/states/all?lamin=${origin.lat - box}&lomin=${origin.lon - box}&lamax=${origin.lat + box}&lomax=${origin.lon + box}`
  try {
    const { status, text } = await getText(url, UA)
    if (status < 200 || status >= 300 || !text) {
      cache = {
        layer: 'overhead',
        at: Date.now(),
        source: 'OpenSky',
        pins: [],
        error: 'OpenSky antwortet nicht',
      }
      return cache
    }
    const data = JSON.parse(text) as { states?: unknown[] }
    const states = Array.isArray(data.states) ? data.states : []
    const pins: GeoFix[] = []
    for (const row of states) {
      if (!Array.isArray(row)) continue
      const call = String(row[1] || '').trim() || 'ohne Rufzeichen'
      const lon = Number(row[5])
      const lat = Number(row[6])
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
      pins.push({ name: call, lat, lon, kind: 'flight', line: 'OpenSky' })
      if (pins.length >= MAX_FULL) break
    }
    cache = { layer: 'overhead', at: Date.now(), source: 'OpenSky', pins: take(pins, MAX_FULL) }
    return cache
  } catch {
    cache = { layer: 'overhead', at: Date.now(), source: 'OpenSky', pins: [], error: 'OpenSky ist nicht erreichbar' }
    return cache
  }
}

export async function fetchLayer(layer: GlobeLayer): Promise<LayerCache> {
  if (layer === 'quakes') return fetchQuakes()
  if (layer === 'fires') return fetchFires()
  return fetchOverhead()
}

export function replyFor(got: LayerCache): string {
  const age = ageLine(got.at)
  if (got.error) return `${got.error}. Die Kugel bleibt. Kein Live.`
  const n = got.pins.length
  if (n === 0) {
    if (got.layer === 'quakes') return `USGS sieht in 24 Stunden kein Beben ab Magnitude 4,5. ${age}. Kein Live.`
    if (got.layer === 'fires') return `NASA EONET nennt gerade keinen offenen Waldbrand. ${age}. Kein Live.`
    return `OpenSky sieht in dem Ausschnitt kein Flugzeug. ${age}. Kein Live.`
  }
  if (got.layer === 'quakes') {
    return `USGS: ${n} Beben ab Magnitude 4,5 in 24 Stunden. ${age}. Kein Live.`
  }
  if (got.layer === 'fires') {
    return `NASA EONET: ${n} offene Waldbrände. ${age}. Kein Live.`
  }
  const origin = overheadOrigin()
  return `OpenSky: ${n} Flugzeuge um ${origin.label}. ${age}. Keine Passagiere, kein Live.`
}
