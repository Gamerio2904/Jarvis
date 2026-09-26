import { getJson, getText } from './http-json.ts'
import { openskyAuthHeader } from './opensky-auth.ts'
import { loadSettings } from './store.ts'
import { jsonUA } from './ua.ts'
import { haversineKm, cityLine, isGlobeLayerPin, nearestPlace, type GeoFix, type GeoPinKind } from './globe-geo.ts'
import { INFRA_FIXES, SEA_FIXES } from './globe-static.ts'
import { OVERHEAD_FLY_ZOOM, TOUR_OVERVIEW_ZOOM } from './globe-gibs.ts'
import { LAYER_TITLE, isGlobeLayer, type GlobeLayer } from './globe-layer-ids.ts'
import { FIRE_BANDS, inLonLatBox, propagateGp, spreadFixes, type GpRow, type LonLatBox } from './orbit.ts'

export type { GlobeLayer } from './globe-layer-ids.ts'
export { GLOBE_LAYER_IDS, LAYER_TITLE, chipOffLabel, isGlobeLayer } from './globe-layer-ids.ts'

const UA = jsonUA

export type LayerCache = {
  layer: GlobeLayer
  at: number
  source: string
  pins: GeoFix[]
  fronts?: { lat: number; lon: number }[][]
  extra?: string
  error?: string
}

export type LayerPhrase =
  | { kind: 'layer'; layer: GlobeLayer }
  | { kind: 'off' }
  | { kind: 'brief' }
  | { kind: 'space' }

const TTL_MS = 10 * 60_000
const OVERHEAD_TTL_MS = 10_000
export const OVERHEAD_BOX_DEG = 2
const MAX_FULL = 40
const MAX_LITE = 16
const DE = { lat: 51.16, lon: 10.45 }

const caches = new Map<GlobeLayer, LayerCache>()
let overheadRetryAt = 0

export function overheadBoxArea(box = OVERHEAD_BOX_DEG): number {
  const span = box * 2
  return span * span
}

export function parseTrueTrack(raw: unknown): number | undefined {
  if (raw == null || raw === '') return undefined
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0 || n > 360) return undefined
  return n
}

/** OpenSky states[8] = on_ground. Am Boden klebt die Silhouette am Flughafen/Pin. */
export function isAirborneState(row: unknown): boolean {
  if (!Array.isArray(row)) return false
  const ground = row[8]
  if (ground === true || ground === 1 || ground === 'true') return false
  const lon = Number(row[5])
  const lat = Number(row[6])
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
}

export function layerFlyFocus(layer?: string | null): { name: string; lat: number; lon: number; zoom: number } | null {
  if (!layer || !isGlobeLayer(layer)) return null
  const o = overheadOrigin()
  if (layer === 'overhead' || layer === 'air') {
    return { name: `layer:${layer}`, lat: o.lat, lon: o.lon, zoom: OVERHEAD_FLY_ZOOM }
  }
  return { name: `layer:${layer}`, lat: o.lat, lon: o.lon, zoom: TOUR_OVERVIEW_ZOOM }
}

export function overheadHttpError(status: number, retryAfterSec?: number): string {
  if (status === 429) {
    const wait =
      Number.isFinite(retryAfterSec) && (retryAfterSec as number) > 0
        ? ` Wieder in ${Math.round(retryAfterSec as number)} s.`
        : ''
    return `OpenSky-Tageslimit, Schicht bleibt leer.${wait}`
  }
  if (status === 401 || status === 403) return 'OpenSky-Zugang abgelehnt. Key prüfen oder anonym.'
  return 'OpenSky antwortet nicht'
}

export function resetOverheadRetryForTests(): void {
  overheadRetryAt = 0
  caches.delete('overhead')
}

function layerTtlMs(layer: GlobeLayer): number {
  return layer === 'overhead' ? OVERHEAD_TTL_MS : TTL_MS
}

export function layerCap(): number {
  return loadSettings().globe_webgl ? MAX_LITE : MAX_FULL
}

export function ageLine(at: number, now = Date.now()): string {
  const sec = Math.max(0, Math.round((now - at) / 1000))
  if (sec < 60) return `Stand vor ${Math.max(1, sec)} s`
  const min = Math.round(sec / 60)
  if (min <= 1) return 'Stand vor einer Minute'
  return `Stand vor ${min} Minuten`
}

function take<T>(xs: T[], n: number): T[] {
  return xs.slice(0, n)
}

function remember(got: LayerCache): LayerCache {
  caches.set(got.layer, got)
  return got
}

function fail(layer: GlobeLayer, source: string, error: string): LayerCache {
  return remember({ layer, at: Date.now(), source, pins: [], error })
}

/** Fail oder Recover: Slot weg, nächster fetchLayer geht ins Netz. */
export function dropLayerCache(layer?: GlobeLayer): void {
  if (layer) caches.delete(layer)
  else caches.clear()
}

export function cachedLayer(layer?: GlobeLayer): LayerCache | null {
  const id = layer || (isGlobeLayer(loadSettings().globe_layer) ? loadSettings().globe_layer : null)
  if (!id) return null
  const hit = caches.get(id)
  if (!hit) return null
  if (Date.now() - hit.at > layerTtlMs(id)) return null
  return hit
}

export function pinsForActiveLayer(): GeoFix[] {
  const layer = loadSettings().globe_layer
  if (!isGlobeLayer(layer)) return []
  const hit = caches.get(layer)
  if (!hit || hit.layer !== layer) return []
  return hit.pins.slice(0, layerCap())
}

export function frontsForActiveLayer(): { lat: number; lon: number }[][] {
  if (loadSettings().globe_webgl) return []
  const hit = cachedLayer()
  return hit?.fronts?.slice(0, 8) || []
}

export function intelLine(): string {
  const layer = loadSettings().globe_layer
  if (!isGlobeLayer(layer)) return ''
  const hit = caches.get(layer)
  if (!hit) return ''
  const age = ageLine(hit.at)
  if (hit.error) return `${LAYER_TITLE[layer]}: ${hit.error}. ${age}.`
  const n = Math.min(hit.pins.length, layerCap())
  const extra = hit.extra ? ` ${hit.extra}` : ''
  const noun = layer === 'overhead' ? 'Flugzeuge' : 'Punkte'
  return `${LAYER_TITLE[layer]}: ${n} ${noun}, ${hit.source}. ${age}. Kein Live.${extra}`
}

export function globeIdleHint(): string {
  const layer = loadSettings().globe_layer
  if (isGlobeLayer(layer)) return ''
  return 'Keine Schicht. Tippen: Satelliten, Flugzeuge, Erdbeben — oder Satz.'
}

export function parseGlobeLayerPhrase(text: string): LayerPhrase | null {
  const t = (text || '').trim()
  if (!t) return null
  if (/^\s*schicht\s+aus\s*$/i.test(t) || /^\s*(?:beben|waldbrände|flugzeuge|unwetter|luft|radar|satelliten|see|anlagen|konflikte|ereignisse|cyber)\s+aus\s*$/i.test(t)) {
    return { kind: 'off' }
  }
  if (/^\s*(?:briefing\s+zur\s+lage|was\s+liegt\s+auf\s+der\s+kugel)\s*\??\s*$/i.test(t)) {
    return { kind: 'brief' }
  }
  if (/\bweltraumwetter\b/i.test(t) || /\b(?:kp[- ]?index|sonnensturm|solarflare)\b/i.test(t)) {
    return { kind: 'space' }
  }
  if (
    /^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+die)?|wo(?:\s+hat\s+es)?)\s+(?:die\s+|das\s+|den\s+)?(?:erdbeben|beben|erdstöße|erdstoesse)\b/i.test(t) ||
    /^\s*wo\s+hat\s+es\s+gebebt\b/i.test(t)
  ) {
    return { kind: 'layer', layer: 'quakes' }
  }
  if (
    /^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+die)?|wo)\s+(?:die\s+|das\s+|den\s+)?(?:waldbr[aä]nde?|brände|braende|feuer|waldbrand)\b/i.test(t) ||
    /^\s*wo\s+brennt(?:\s+es)?\b/i.test(t)
  ) {
    return { kind: 'layer', layer: 'fires' }
  }
  if (/^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+die)?)\s+(?:die\s+|das\s+|den\s+)?flugzeuge?\b/i.test(t)) {
    return { kind: 'layer', layer: 'overhead' }
  }
  if (/^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+die)?)\s+(?:die\s+|das\s+|den\s+)?unwetter\b/i.test(t) || /^\s*wo\s+tobt\s+(?:ein\s+)?sturm\b/i.test(t)) {
    return { kind: 'layer', layer: 'weather' }
  }
  if (
    /^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+die)?)\s+(?:die\s+|das\s+)?luftqualit[aä]t\b/i.test(t) ||
    /^\s*luftqualit[aä]t\s*$/i.test(t)
  ) {
    return { kind: 'layer', layer: 'air' }
  }
  if (/\bgps[- ]störung\b/i.test(t) || /\bradar[- ]störung\b/i.test(t) || /^\s*zeig(?:e)?(?:\s+mir)?\s+(?:die\s+)?(?:gps[- ]?|radar[- ]?)störung\b/i.test(t)) {
    return { kind: 'layer', layer: 'radar' }
  }
  if (/^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+die)?)\s+(?:die\s+|das\s+|den\s+)?satelliten\b/i.test(t) || /^\s*was\s+ist\s+im\s+orbit\s*\??\s*$/i.test(t)) {
    return { kind: 'layer', layer: 'sats' }
  }
  if (/^\s*was\s+fährt\s+auf\s+see\b/i.test(t) || /^\s*zeig(?:e)?(?:\s+mir)?(?:\s+die)?\s+(?:die\s+|das\s+|den\s+)?schiffe\b/i.test(t)) {
    return { kind: 'layer', layer: 'ships' }
  }
  if (/^\s*zeig(?:e)?(?:\s+mir)?(?:\s+die)?\s+(?:die\s+|das\s+|den\s+)?häfen\b/i.test(t) || /\bmeeresengen\b/i.test(t)) {
    return { kind: 'layer', layer: 'ships' }
  }
  if (/\bkritische\s+anlagen\b/i.test(t) || /\bkernkraft\b/i.test(t)) {
    return { kind: 'layer', layer: 'infra' }
  }
  if (/^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+die)?)\s+(?:die\s+|das\s+|den\s+)?konflikte\b/i.test(t) || /^\s*wo\s+wird\s+geschossen\b/i.test(t)) {
    return { kind: 'layer', layer: 'conflicts' }
  }
  if (/^\s*frontlinien\b/i.test(t)) return { kind: 'layer', layer: 'conflicts' }
  if (/\bwelt[- ]ereignisse\b/i.test(t) || /^\s*gdelt\b/i.test(t)) {
    return { kind: 'layer', layer: 'events' }
  }
  if (/\bcyber\s+auf\s+der\s+karte\b/i.test(t) || /\bmalware[- ]hosts?\b/i.test(t)) {
    return { kind: 'layer', layer: 'cyber' }
  }
  return null
}

export const LAYER_SKIP =
  /\b(erdbeben|beben|waldbrand|waldbrände|waldbraende|brände|braende|feuer|flugzeug|flugzeuge|opensky|überflug|unwetter|luftqualität|luftqualitaet|satellit|satelliten|orbit|schiffe|häfen|haefen|meeresengen|kernkraft|anlagen|konflikte|frontlinien|gdelt|ereignisse|malware|cyber|schicht)\b/i

function magOf(props: Record<string, unknown> | undefined): number {
  const mag = Number(props?.mag)
  return Number.isFinite(mag) ? mag : NaN
}

function eonetCoords(geo: unknown): { lat: number; lon: number }[] {
  if (!geo || typeof geo !== 'object') return []
  const g = geo as { geometry?: unknown }
  const items = Array.isArray(g.geometry) ? g.geometry : g.geometry ? [g.geometry] : []
  const out: { lat: number; lon: number }[] = []
  for (const geom of items) {
    if (!geom || typeof geom !== 'object') continue
    const coords = (geom as { coordinates?: unknown }).coordinates
    if (!Array.isArray(coords) || coords.length < 2) continue
    const lon = Number(coords[0])
    const lat = Number(coords[1])
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    out.push({ lat, lon })
  }
  return out
}

function eonetCoord(geo: unknown): { lat: number; lon: number } | null {
  const all = eonetCoords(geo)
  return all.length ? all[all.length - 1] : null
}

function eonetCoordInBox(geo: unknown, box: LonLatBox): { lat: number; lon: number } | null {
  return eonetCoords(geo).find((p) => inLonLatBox(p, box)) || null
}

export function overheadOrigin(): { lat: number; lon: number; label: string } {
  const lat = Number(loadSettings().last_lat)
  const lon = Number(loadSettings().last_lon)
  if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon, label: 'Standort' }
  return { ...DE, label: 'Deutschland-Mitte' }
}

async function fetchQuakes(): Promise<LayerCache> {
  const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson'
  try {
    const { status, json } = await getJson(url, UA)
    if (status < 200 || status >= 300) return fail('quakes', 'USGS', 'USGS antwortet nicht')
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
      pins.push({ name: `M${mag.toFixed(1)}`, lat, lon, kind: 'quake', line: `USGS · ${place}` })
      if (pins.length >= MAX_FULL) break
    }
    return remember({ layer: 'quakes', at: Date.now(), source: 'USGS', pins: take(pins, MAX_FULL) })
  } catch {
    return fail('quakes', 'USGS', 'USGS ist nicht erreichbar')
  }
}

function eonetPinsFrom(
  events: unknown[],
  layer: 'fires' | 'weather',
  kind: GeoPinKind,
  box?: LonLatBox,
  cap = MAX_FULL,
): GeoFix[] {
  const source = 'NASA EONET'
  const pins: GeoFix[] = []
  const seen = new Set<string>()
  for (const raw of events) {
    if (!raw || typeof raw !== 'object') continue
    const ev = raw as { title?: unknown; geometry?: unknown }
    const at = box ? eonetCoordInBox(ev, box) : eonetCoord(ev)
    if (!at) continue
    const title = String(ev.title || LAYER_TITLE[layer]).slice(0, 48)
    const key = `${title}|${at.lat.toFixed(2)}|${at.lon.toFixed(2)}`
    if (seen.has(key)) continue
    seen.add(key)
    pins.push({ name: title, lat: at.lat, lon: at.lon, kind, line: `${source} · ${title}` })
    if (pins.length >= cap) break
  }
  return pins
}

async function fetchEonet(layer: 'weather', category: string, kind: GeoPinKind): Promise<LayerCache> {
  const source = 'NASA EONET'
  const url = `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=${category}&limit=200`
  try {
    const { status, json } = await getJson(url, UA)
    if (status < 200 || status >= 300) return fail(layer, source, 'EONET antwortet nicht')
    const events = Array.isArray(json.events) ? json.events : []
    return remember({ layer, at: Date.now(), source, pins: spreadFixes(eonetPinsFrom(events, layer, kind), MAX_FULL) })
  } catch {
    return fail(layer, source, 'EONET ist nicht erreichbar')
  }
}

async function fetchFires(): Promise<LayerCache> {
  const source = 'NASA EONET'
  const per = Math.ceil(MAX_FULL / FIRE_BANDS.length) + 4
  try {
    const chunks = await Promise.all(
      FIRE_BANDS.map(async (box) => {
        const bbox = `${box.minLon},${box.minLat},${box.maxLon},${box.maxLat}`
        const url = `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=wildfires&limit=80&bbox=${bbox}`
        try {
          const { status, json } = await getJson(url, UA)
          if (status < 200 || status >= 300) return []
          const events = Array.isArray(json.events) ? json.events : []
          return eonetPinsFrom(events, 'fires', 'fire', box, per)
        } catch {
          return []
        }
      }),
    )
    const pins = spreadFixes(chunks.flat(), MAX_FULL)
    if (!pins.length) return fail('fires', source, 'EONET nennt gerade keinen offenen Waldbrand')
    return remember({ layer: 'fires', at: Date.now(), source, pins })
  } catch {
    return fail('fires', source, 'EONET ist nicht erreichbar')
  }
}

export function overheadStatesUrl(
  origin = overheadOrigin(),
  box = OVERHEAD_BOX_DEG,
): string {
  return `https://opensky-network.org/api/states/all?lamin=${origin.lat - box}&lomin=${origin.lon - box}&lamax=${origin.lat + box}&lomax=${origin.lon + box}`
}

export async function fetchOverhead(): Promise<LayerCache> {
  if (Date.now() < overheadRetryAt) {
    const hit = caches.get('overhead')
    if (hit) return hit
    return fail('overhead', 'OpenSky', 'OpenSky-Tageslimit, Schicht bleibt leer')
  }
  const origin = overheadOrigin()
  const url = overheadStatesUrl(origin)
  try {
    const auth = await openskyAuthHeader()
    const { status, text, headers } = await getText(url, { ...UA, ...auth })
    if (status === 429) {
      const retry = Number(headers['x-rate-limit-retry-after-seconds'])
      const wait = Number.isFinite(retry) && retry > 0 ? retry : 60
      overheadRetryAt = Date.now() + wait * 1000
      return fail('overhead', 'OpenSky', overheadHttpError(status, wait))
    }
    if (status < 200 || status >= 300 || !text) {
      return fail('overhead', 'OpenSky', overheadHttpError(status))
    }
    const data = JSON.parse(text) as { states?: unknown[] }
    const states = Array.isArray(data.states) ? data.states : []
    const pins: GeoFix[] = []
    for (const row of states) {
      if (!isAirborneState(row)) continue
      const call = String((row as unknown[])[1] || '').trim() || 'ohne Rufzeichen'
      const lon = Number((row as unknown[])[5])
      const lat = Number((row as unknown[])[6])
      const heading = parseTrueTrack((row as unknown[])[10])
      pins.push({
        name: call,
        lat,
        lon,
        kind: 'flight',
        line: 'OpenSky',
        ...(heading != null ? { heading } : {}),
      })
      if (pins.length >= MAX_FULL) break
    }
    const remain = headers['x-rate-limit-remaining']
    const extra = remain && /^\d+$/.test(remain) ? `Credits noch ${remain}.` : ''
    return remember({
      layer: 'overhead',
      at: Date.now(),
      source: 'OpenSky',
      pins: take(pins, MAX_FULL),
      extra,
    })
  } catch {
    return fail('overhead', 'OpenSky', 'OpenSky ist nicht erreichbar')
  }
}

async function fetchAir(): Promise<LayerCache> {
  const origin = overheadOrigin()
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${origin.lat}&longitude=${origin.lon}&current=european_aqi,pm2_5`
  try {
    const { status, json } = await getJson(url, UA)
    if (status < 200 || status >= 300) return fail('air', 'Open-Meteo', 'Open-Meteo antwortet nicht')
    const cur = json.current && typeof json.current === 'object' ? (json.current as Record<string, unknown>) : {}
    const aqi = Number(cur.european_aqi)
    const pm = Number(cur.pm2_5)
    const label = Number.isFinite(aqi) ? `AQI ${Math.round(aqi)}` : 'Luft'
    const line = Number.isFinite(pm) ? `Open-Meteo · PM2.5 ${pm.toFixed(1)}` : 'Open-Meteo'
    return remember({
      layer: 'air',
      at: Date.now(),
      source: 'Open-Meteo',
      pins: [{ name: label, lat: origin.lat, lon: origin.lon, kind: 'air', line }],
    })
  } catch {
    return fail('air', 'Open-Meteo', 'Open-Meteo ist nicht erreichbar')
  }
}

async function fetchRadar(): Promise<LayerCache> {
  return remember({
    layer: 'radar',
    at: Date.now(),
    source: '—',
    pins: [],
    error: 'Keine öffentliche GNSS-Stör-Quelle ohne Key',
  })
}

async function fetchIssPin(): Promise<GeoFix | null> {
  try {
    const { status, json } = await getJson('https://api.wheretheiss.at/v1/satellites/25544', UA)
    if (status < 200 || status >= 300) return null
    const lat = Number(json.latitude)
    const lon = Number(json.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
    return { name: 'ISS', lat, lon, kind: 'sat', line: 'Where The ISS At · Station' }
  } catch {
    return null
  }
}

async function fetchCelestrakPins(): Promise<GeoFix[]> {
  const hosts = ['celestrak.org', 'celestrak.com']
  const groups = ['stations', 'visual']
  const pins: GeoFix[] = []
  const seen = new Set<string>()
  for (const group of groups) {
    for (const host of hosts) {
      try {
        const { status, json } = await getJson(
          `https://${host}/NORAD/elements/gp.php?GROUP=${group}&FORMAT=json`,
          UA,
        )
        if (status < 200 || status >= 300 || !Array.isArray(json)) continue
        for (const raw of json) {
          if (!raw || typeof raw !== 'object') continue
          const row = raw as GpRow
          if (String(row.NORAD_CAT_ID || '') === '25544') continue
          const hit = propagateGp(row)
          if (!hit) continue
          if (seen.has(hit.norad)) continue
          seen.add(hit.norad)
          pins.push({
            name: hit.name,
            lat: hit.lat,
            lon: hit.lon,
            kind: 'sat',
            line: `CelesTrak · ${hit.name}`,
          })
        }
        break
      } catch {
        /* nächster Host */
      }
    }
  }
  return pins
}

async function fetchSats(): Promise<LayerCache> {
  const [iss, catalog] = await Promise.all([fetchIssPin(), fetchCelestrakPins()])
  const rest = spreadFixes(catalog, Math.max(0, MAX_FULL - (iss ? 1 : 0)))
  const pins = iss ? [iss, ...rest] : rest
  if (!pins.length) return fail('sats', 'CelesTrak', 'Keine Satellitenposition')
  return remember({
    layer: 'sats',
    at: Date.now(),
    source: iss && rest.length ? 'CelesTrak + ISS' : iss ? 'Where The ISS At' : 'CelesTrak',
    pins,
    extra: rest.length ? '' : 'Nur die ISS — CelesTrak ohne Lage.',
  })
}

async function fetchShips(): Promise<LayerCache> {
  return remember({
    layer: 'ships',
    at: Date.now(),
    source: 'Tabelle',
    pins: take(SEA_FIXES, MAX_FULL),
    extra: 'Kein öffentliches AIS ohne Key.',
  })
}

async function fetchInfra(): Promise<LayerCache> {
  return remember({
    layer: 'infra',
    at: Date.now(),
    source: 'Tabelle',
    pins: take(INFRA_FIXES, MAX_FULL),
  })
}

function gdeltPins(raw: unknown, kind: GeoPinKind, limit: number): GeoFix[] {
  const obj = raw && typeof raw === 'object' ? (raw as { features?: unknown }) : {}
  const features = Array.isArray(obj.features) ? obj.features : []
  const pins: GeoFix[] = []
  for (const item of features) {
    if (!item || typeof item !== 'object') continue
    const f = item as { geometry?: { coordinates?: unknown }; properties?: Record<string, unknown> }
    const coords = Array.isArray(f.geometry?.coordinates) ? f.geometry.coordinates : []
    const lon = Number(coords[0])
    const lat = Number(coords[1])
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    const name = String(f.properties?.name || f.properties?.title || f.properties?.count || kind).slice(0, 48)
    pins.push({ name, lat, lon, kind, line: 'GDELT' })
    if (pins.length >= limit) break
  }
  return pins
}

async function fetchGdelt(layer: 'conflicts' | 'events', query: string, kind: GeoPinKind): Promise<LayerCache> {
  const url = `https://api.gdeltproject.org/api/v2/geo/geo?query=${encodeURIComponent(query)}&mode=PointData&format=GeoJSON&maxpoints=40`
  try {
    const { status, json } = await getJson(url, UA)
    if (status < 200 || status >= 300) return fail(layer, 'GDELT', 'GDELT antwortet nicht')
    const pins = gdeltPins(json, kind, MAX_FULL)
    return remember({ layer, at: Date.now(), source: 'GDELT', pins })
  } catch {
    return fail(layer, 'GDELT', 'GDELT ist nicht erreichbar')
  }
}

async function geoIp(ip: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const { status, json } = await getJson(`https://ipwho.is/${encodeURIComponent(ip)}`, UA)
    if (status < 200 || status >= 300) return null
    const lat = Number(json.latitude)
    const lon = Number(json.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
    return { lat, lon }
  } catch {
    return null
  }
}

async function fetchCyber(): Promise<LayerCache> {
  try {
    const { status, text } = await getText('https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.txt', UA)
    if (status < 200 || status >= 300 || !text) return fail('cyber', 'abuse.ch', 'Feodo antwortet nicht')
    const ips = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && /^\d{1,3}(?:\.\d{1,3}){3}$/.test(l))
      .slice(0, 8)
    const pins: GeoFix[] = []
    for (const ip of ips) {
      const at = await geoIp(ip)
      if (!at) continue
      pins.push({ name: ip, lat: at.lat, lon: at.lon, kind: 'cyber', line: 'abuse.ch Feodo · Blocklist, kein beobachteter Angriff' })
      if (pins.length >= layerCap()) break
    }
    return remember({
      layer: 'cyber',
      at: Date.now(),
      source: 'abuse.ch Feodo',
      pins,
      extra: 'Blocklist, kein Live-Angriff.',
    })
  } catch {
    return fail('cyber', 'abuse.ch', 'Feodo ist nicht erreichbar')
  }
}

export async function fetchSpaceWeather(): Promise<string> {
  try {
    const { status, json } = await getJson('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json', UA)
    if (status < 200 || status >= 300) return 'NOAA SWPC antwortet nicht. Kein Live.'
    const rows = Array.isArray(json) ? json : Array.isArray((json as { data?: unknown }).data) ? (json as { data: unknown[] }).data : []
    const last = rows.length ? rows[rows.length - 1] : null
    const kp = last && typeof last === 'object' ? Number((last as { kp_index?: unknown }).kp_index) : NaN
    if (!Number.isFinite(kp)) return 'NOAA SWPC ohne Kp. Kein Live.'
    return `NOAA SWPC: planetarer Kp ${kp.toFixed(1)}. Stand Minuten, kein Live.`
  } catch {
    return 'NOAA SWPC ist nicht erreichbar. Kein Live.'
  }
}

export async function fetchLayer(layer: GlobeLayer): Promise<LayerCache> {
  const fresh = cachedLayer(layer)
  if (fresh) return fresh
  if (layer === 'overhead' && Date.now() < overheadRetryAt) {
    const hit = caches.get('overhead')
    if (hit) return hit
    return fail('overhead', 'OpenSky', 'OpenSky-Tageslimit, Schicht bleibt leer')
  }
  if (layer === 'quakes') return fetchQuakes()
  if (layer === 'fires') return fetchFires()
  if (layer === 'weather') return fetchEonet('weather', 'severeStorms', 'weather')
  if (layer === 'overhead') return fetchOverhead()
  if (layer === 'air') return fetchAir()
  if (layer === 'radar') return fetchRadar()
  if (layer === 'sats') return fetchSats()
  if (layer === 'ships') return fetchShips()
  if (layer === 'infra') return fetchInfra()
  if (layer === 'conflicts') return fetchGdelt('conflicts', 'conflict', 'conflict')
  if (layer === 'events') return fetchGdelt('events', 'sourcelang:german', 'event')
  return fetchCyber()
}

export function replyFor(got: LayerCache): string {
  const age = ageLine(got.at)
  if (got.error) return `${got.error}. Die Kugel bleibt. Kein Live.`
  const n = got.pins.length
  const extra = got.extra ? ` ${got.extra}` : ''
  if (n === 0) {
    if (got.layer === 'quakes') return `USGS sieht in 24 Stunden kein Beben ab Magnitude 4,5. ${age}. Kein Live.`
    if (got.layer === 'fires') return `NASA EONET nennt gerade keinen offenen Waldbrand. ${age}. Kein Live.`
    if (got.layer === 'overhead') return `OpenSky sieht in dem Ausschnitt kein Flugzeug. ${age}. Kein Live.`
    return `${got.source} liefert gerade keine Punkte für ${LAYER_TITLE[got.layer]}. ${age}. Kein Live.${extra}`
  }
  if (got.layer === 'quakes') return `USGS: ${n} Beben ab Magnitude 4,5 in 24 Stunden. ${age}. Kein Live.`
  if (got.layer === 'fires') return `NASA EONET: ${n} offene Waldbrände. ${age}. Kein Live.`
  if (got.layer === 'overhead') {
    const origin = overheadOrigin()
    return `OpenSky: ${n} Flugzeuge um ${origin.label}. ${age}. Keine Passagiere, kein Live.`
  }
  return `${got.source}: ${n} ${LAYER_TITLE[got.layer]}-Punkte. ${age}. Kein Live.${extra}`
}

export function briefingFromCache(): string {
  const layer = loadSettings().globe_layer
  if (!isGlobeLayer(layer)) return 'Nichts auf der Kugel außer der Erde und der ISS.'
  const hit = caches.get(layer)
  if (!hit) return 'Nichts auf der Kugel außer der Erde und der ISS.'
  if (hit.error) return `${LAYER_TITLE[layer]}: ${hit.error}. Keine Erfindung.`
  const names = hit.pins.slice(0, 12).map((p) => p.name)
  const age = ageLine(hit.at)
  if (!names.length) return `${LAYER_TITLE[layer]} ist an, ${hit.source} nennt keine Punkte. ${age}.`
  return `${LAYER_TITLE[layer]}, ${hit.source}, ${age}: ${names.join(', ')}. Kein Live.`
}

export function dossierNear(pins: GeoFix[], lat: number, lon: number, km = 900): GeoFix | null {
  const near = pins
    .filter((p) => isGlobeLayerPin(p.kind) && Number.isFinite(p.lat))
    .map((p) => ({ p, d: haversineKm({ lat, lon }, p) }))
    .filter((x) => x.d <= km)
    .sort((a, b) => a.d - b.d)
    .slice(0, 8)
  if (!near.length) return null
  const line = near.map((x) => `${x.p.name} (${Math.round(x.d)} km)`).join(' · ')
  return { name: 'Sicht', lat, lon, kind: 'outlook', line: `${line}. Kein Live.` }
}

/** Tipp ins Leere: Schicht-Dossier, sonst Stadt, sonst nichts — nie eine leere Karte. */
export function viewDossier(pins: GeoFix[], lat: number, lon: number): GeoFix | null {
  const near = dossierNear(pins, lat, lon)
  if (near) return near
  const city = nearestPlace(lat, lon)
  if (city) {
    return {
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      kind: 'outlook',
      line: cityLine(city),
    }
  }
  return null
}
