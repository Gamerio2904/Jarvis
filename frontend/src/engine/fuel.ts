import { ensureDeviceLocation } from '../native/geo'
import { beginDriveTo } from './drive'
import {
  formatE10Price,
  formatFuelSpeech,
  pickFuelPair,
  stationLabel,
  type FuelPair,
  type FuelStation,
} from './fuel-format'
import {
  parseFuelFollowUp,
  parseFuelIntent,
  type FuelPrefer,
} from './fuel-parse'
import { haversineM } from './geo-lookup'
import { getJson } from './http-json'
import type { ResearchMeta, ResearchSource } from './research-parse'
import { loadSettings, persistLastList, saveSettings } from './store'
import { rememberE10Spot } from './outlook-series.ts'
import type { ToolMeta } from './tools'

export { parseFuelFollowUp, parseFuelIntent } from './fuel-parse'
export type { FuelIntent, FuelPrefer } from './fuel-parse'
export { formatE10Price, formatFuelSpeech, pickFuelPair, stationLabel } from './fuel-format'
export type { FuelPair, FuelStation } from './fuel-format'

type LastFuel = {
  at: string
  prefer: FuelPrefer
  nearest: FuelStation
  cheapest: FuelStation
}

type FuelHit = {
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
  research?: ResearchMeta
}

const TK_LIST = 'https://creativecommons.tankerkoenig.de/json/list.php'
const TK_PAGE = 'https://creativecommons.tankerkoenig.de/'
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const KEY_HINT =
  'Tankerkönig-Schlüssel unter Einstellungen → Cloud. Kostenlos auf tankerkoenig.de. Ohne Schlüssel erfinde ich keine Preise.'
const NO_GPS =
  'Ohne Standort keine Tankstelle. Sagen Sie „aktivieren“ — Android-Abfrage, notfalls App-Einstellungen. Ich rate den Ort nicht.'

export async function handleFuel(_conversationId: string, text: string): Promise<FuelHit> {
  const intent = parseFuelIntent(text)
  if (intent) return searchAndDrive(intent.prefer)

  const s = loadSettings()
  if (s.last_step_tool === 'fuel') {
    const follow = parseFuelFollowUp(text)
    if (follow) return driveLast(follow)
  }
  return { handled: false }
}

export async function handleFuelOrdinal(index: number): Promise<FuelHit> {
  const last = readLastFuel()
  if (!last) {
    return {
      handled: true,
      reply: 'Welche Tankstelle? Sagen Sie „fahr mich zu einer Tanke“.',
      tool: fuelTool('ask', 'Tanke'),
      lastTool: 'fuel',
    }
  }
  if (index <= 0) return driveLast('nearest')
  if (index === 1) {
    if (last.nearest.id === last.cheapest.id) {
      return {
        handled: true,
        reply: `Nur eine: ${stationLabel(last.nearest)}.`,
        tool: fuelTool('ask', 'Tanke'),
        lastTool: 'fuel',
      }
    }
    return driveLast('cheapest')
  }
  return {
    handled: true,
    reply: 'Es gibt zwei: die nächste und die günstigste.',
    tool: fuelTool('ask', 'Tanke'),
    lastTool: 'fuel',
  }
}

async function searchAndDrive(prefer: FuelPrefer): Promise<FuelHit> {
  const here = await resolveHere()
  if (!here.ok) {
    return {
      handled: true,
      reply: here.message,
      tool: fuelTool('ask', 'Kein Standort'),
      lastTool: 'fuel',
    }
  }

  const found = await lookupStations(here.lat, here.lon)
  if (!found.ok) {
    return {
      handled: true,
      reply: found.message,
      tool: fuelTool('error', 'Tanke fehlt'),
      lastTool: 'fuel',
      research: found.research,
    }
  }

  rememberPair(found.pair, prefer)
  const chosen = prefer === 'cheapest' ? found.pair.cheapest : found.pair.nearest
  const label = stationLabel(chosen)
  const { route, tool } = await beginDriveTo(label, chosen.lat, chosen.lng)
  const speech = formatFuelSpeech(found.pair, prefer, route.minutes, found.pair.priced ? '' : KEY_HINT)
  return {
    handled: true,
    reply: speech,
    tool: {
      ...tool,
      tool: 'fuel',
      action: 'nav',
      label: 'Tanke',
      preview: label,
    },
    lastTool: 'fuel',
    research: found.research,
  }
}

async function driveLast(prefer: FuelPrefer): Promise<FuelHit> {
  const last = readLastFuel()
  if (!last) {
    return {
      handled: true,
      reply: 'Keine Tanke mehr im Kopf. Nochmal „fahr mich zu einer Tanke“.',
      tool: fuelTool('ask', 'Tanke'),
      lastTool: 'fuel',
    }
  }
  const chosen = prefer === 'cheapest' ? last.cheapest : last.nearest
  const label = stationLabel(chosen)
  rememberPair({ nearest: last.nearest, cheapest: last.cheapest, cheapestOpen: null, priced: last.nearest.priceE10 != null || last.cheapest.priceE10 != null }, prefer)
  const { route, tool } = await beginDriveTo(label, chosen.lat, chosen.lng)
  const which = prefer === 'cheapest' ? 'günstigste' : 'nächste'
  const mins = route.minutes > 0 ? ` Etwa ${route.minutes} Min.` : ''
  return {
    handled: true,
    reply: `Route zur ${which}: ${label}.${mins}`,
    tool: {
      ...tool,
      tool: 'fuel',
      action: 'nav',
      label: 'Tanke',
      preview: label,
    },
    lastTool: 'fuel',
  }
}

function fuelTool(action: string, label: string): ToolMeta {
  return { tool_status: action === 'error' ? 'error' : 'executed', tool: 'fuel', action, label }
}

function rememberPair(pair: FuelPair, prefer: FuelPrefer) {
  const payload: LastFuel = {
    at: new Date().toISOString(),
    prefer,
    nearest: pair.nearest,
    cheapest: pair.cheapest,
  }
  saveSettings({ last_fuel_json: JSON.stringify(payload) })
  const e10 = pair.nearest.priceE10 ?? pair.cheapest.priceE10
  if (typeof e10 === 'number' && Number.isFinite(e10)) {
    rememberE10Spot({ price: e10, at: payload.at })
  }
  const titles =
    pair.nearest.id === pair.cheapest.id
      ? [stationLabel(pair.nearest)]
      : [stationLabel(pair.nearest), stationLabel(pair.cheapest)]
  persistLastList('fuel', titles)
}

function readLastFuel(): LastFuel | null {
  try {
    const raw = loadSettings().last_fuel_json
    if (!raw) return null
    const parsed = JSON.parse(raw) as LastFuel
    if (!parsed?.nearest?.lat || !parsed?.cheapest?.lat) return null
    return parsed
  } catch {
    return null
  }
}

async function resolveHere(): Promise<{ ok: true; lat: number; lon: number } | { ok: false; message: string }> {
  const loc = await ensureDeviceLocation({ openSettingsIfDenied: false })
  if (loc.ok && loc.lat != null && loc.lon != null) {
    saveSettings({
      last_lat: String(loc.lat),
      last_lon: String(loc.lon),
      last_fix_at: new Date().toISOString(),
    })
    return { ok: true, lat: loc.lat, lon: loc.lon }
  }
  const cached = readFreshFix()
  if (cached) return cached
  return { ok: false, message: loc.message || NO_GPS }
}

function readFreshFix(): { ok: true; lat: number; lon: number } | null {
  const s = loadSettings()
  const lat = Number(s.last_lat)
  const lon = Number(s.last_lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const at = Date.parse(s.last_fix_at || '')
  if (!Number.isFinite(at) || Date.now() - at > 10 * 60_000) return null
  return { ok: true, lat, lon }
}

async function lookupStations(
  lat: number,
  lon: number,
): Promise<
  | { ok: true; pair: FuelPair; research?: ResearchMeta }
  | { ok: false; message: string; research?: ResearchMeta }
> {
  const key = loadSettings().tankerkoenig_api_key.trim()
  if (key) {
    const tk = await fetchTankerkoenig(lat, lon, key)
    if (tk.ok) {
      const pair = pickFuelPair(tk.stations)
      if (pair) {
        return { ok: true, pair, research: tkSource(pair) }
      }
    }
    const osm = await fetchOsmFuel(lat, lon)
    if (osm.ok) {
      const pair = pickFuelPair(osm.stations)
      if (pair) {
        return {
          ok: true,
          pair: { ...pair, priced: false },
          research: tk.ok ? undefined : tkFailSource(tk.message),
        }
      }
    }
    const fail = tk.ok ? 'Keine Tankstelle mit E10 im Umkreis von 25 km. Ich rate nicht.' : tk.message
    return {
      ok: false,
      message: tk.ok || osm.ok ? fail : `${fail} Auch die Karte hat keine Tankstelle geliefert.`,
      research: tkFailSource(fail),
    }
  }

  const osm = await fetchOsmFuel(lat, lon)
  if (osm.ok) {
    const pair = pickFuelPair(osm.stations)
    if (pair) return { ok: true, pair: { ...pair, priced: false } }
  }
  return {
    ok: false,
    message: osm.ok
      ? 'Keine Tankstelle im Umkreis von 25 km. Ich rate nicht.'
      : `${KEY_HINT} Karte ohne Treffer.`,
  }
}

async function fetchTankerkoenig(
  lat: number,
  lon: number,
  apikey: string,
): Promise<{ ok: true; stations: FuelStation[] } | { ok: false; message: string }> {
  for (const rad of [10, 25]) {
    const once = await tankerOnce(lat, lon, rad, apikey)
    if (!once.ok) return once
    if (once.stations.length >= 2 || rad === 25) return once
  }
  return { ok: true, stations: [] }
}

async function tankerOnce(
  lat: number,
  lon: number,
  rad: number,
  apikey: string,
): Promise<{ ok: true; stations: FuelStation[] } | { ok: false; message: string }> {
  try {
    const q = new URLSearchParams({
      lat: String(lat),
      lng: String(lon),
      rad: String(rad),
      sort: 'dist',
      type: 'e10',
      apikey,
    })
    const { status, json } = await getJson(`${TK_LIST}?${q}`)
    if (status === 401 || status === 403) {
      return { ok: false, message: 'Tankerkönig-Schlüssel ungültig. In den Einstellungen prüfen.' }
    }
    if (status < 200 || status >= 300) {
      return { ok: false, message: 'Tankerkönig nicht erreichbar. Keine erfundenen Preise.' }
    }
    if (json.ok === false) {
      const msg = String(json.message || json.status || 'Anfrage abgelehnt')
      if (/apikey|api.key|ungültig/i.test(msg)) {
        return { ok: false, message: 'Tankerkönig-Schlüssel ungültig. In den Einstellungen prüfen.' }
      }
      return { ok: false, message: `Tankerkönig: ${msg}. Keine erfundenen Preise.` }
    }
    const rows = Array.isArray(json.stations) ? (json.stations as Array<Record<string, unknown>>) : []
    const stations = rows.map(fromTanker).filter((s): s is FuelStation => Boolean(s))
    return { ok: true, stations }
  } catch {
    return { ok: false, message: 'Tankerkönig nicht erreichbar. Keine erfundenen Preise.' }
  }
}

function fromTanker(row: Record<string, unknown>): FuelStation | null {
  const lat = num(row.lat)
  const lng = num(row.lng)
  if (lat == null || lng == null) return null
  const price = firstPrice(row.price, row.e10)
  const dist = num(row.dist)
  return {
    id: String(row.id || `${lat},${lng}`),
    name: String(row.name || '').trim(),
    brand: String(row.brand || '').trim(),
    street: String(row.street || '').trim(),
    place: String(row.place || '').trim(),
    lat,
    lng,
    distKm: dist ?? 0,
    priceE10: price,
    isOpen: typeof row.isOpen === 'boolean' ? row.isOpen : null,
  }
}

function firstPrice(...vals: unknown[]): number | null {
  for (const v of vals) {
    const n = num(v)
    if (n != null && n >= 0.8 && n <= 3.5) return n
  }
  return null
}

function num(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

async function fetchOsmFuel(
  lat: number,
  lon: number,
): Promise<{ ok: true; stations: FuelStation[] } | { ok: false; message: string }> {
  for (const radKm of [10, 25]) {
    const once = await osmOnce(lat, lon, radKm)
    if (!once.ok) {
      if (radKm === 25) return once
      continue
    }
    if (once.stations.length || radKm === 25) return once
  }
  return { ok: false, message: 'Karte ohne Tankstelle.' }
}

async function osmOnce(
  lat: number,
  lon: number,
  radKm: number,
): Promise<{ ok: true; stations: FuelStation[] } | { ok: false; message: string }> {
  const query = `[out:json][timeout:12];node["amenity"="fuel"](around:${Math.round(radKm * 1000)},${lat},${lon});out body;`
  for (const base of OVERPASS) {
    try {
      const { status, json } = await getJson(`${base}?data=${encodeURIComponent(query)}`, {
        Accept: 'application/json',
        'User-Agent': 'Jarvis/1.41.0 (local.jarvis.app)',
      })
      if (status < 200 || status >= 300) continue
      const elements = Array.isArray(json.elements) ? (json.elements as Array<Record<string, unknown>>) : []
      const here = { lat, lon, place: '' }
      const stations: FuelStation[] = []
      for (const el of elements) {
        const slat = num(el.lat)
        const slon = num(el.lon)
        if (slat == null || slon == null) continue
        const tags = (el.tags && typeof el.tags === 'object' ? el.tags : {}) as Record<string, unknown>
        const distM = haversineM(here, { lat: slat, lon: slon })
        stations.push({
          id: String(el.id || `${slat},${slon}`),
          name: String(tags.name || tags.brand || '').trim(),
          brand: String(tags.brand || '').trim(),
          street: String(tags['addr:street'] || '').trim(),
          place: String(tags['addr:city'] || tags['addr:place'] || '').trim(),
          lat: slat,
          lng: slon,
          distKm: distM / 1000,
          priceE10: null,
          isOpen: null,
        })
      }
      return { ok: true, stations }
    } catch {
      continue
    }
  }
  return { ok: false, message: 'Karte nicht erreichbar.' }
}

function tkSource(pair: FuelPair): ResearchMeta {
  const snippet = pair.priced
    ? `${stationLabel(pair.nearest)} ${pair.nearest.priceE10 != null ? formatE10Price(pair.nearest.priceE10) : 'ohne Preis'}`
    : 'E10 angefragt, Preis fehlt'
  const source: ResearchSource = {
    title: 'Tankerkönig MTS-K',
    url: TK_PAGE,
    snippet,
    provider: 'tankerkoenig',
    retrieved_at: new Date().toISOString(),
  }
  return {
    used: true,
    status: 'ok',
    status_label: 'E10 · Tankerkönig',
    query: 'E10 Tankstelle',
    sources: [source],
    privacy_note: 'Standort an Tankerkönig für E10-Preise, kein Raten.',
  }
}

function tkFailSource(message: string): ResearchMeta {
  return {
    used: false,
    status: 'empty',
    status_label: 'E10 · keine Preise',
    query: 'E10 Tankstelle',
    sources: [],
    error: message,
    privacy_note: 'Keine erfundenen Spritpreise.',
  }
}
