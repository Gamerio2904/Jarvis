import { ensureDeviceLocation } from '../native/geo'
import { beginDriveTo } from './drive'
import { haversineM } from './geo-lookup'
import { getJson } from './http-json'
import { parsePoiIntent, poiLabel, type PoiKind } from './poi-parse'
import { loadSettings, persistLastList, saveSettings } from './store'
import type { ToolMeta } from './tools'

export { parsePoiIntent, poiLabel } from './poi-parse'
export type { PoiIntent, PoiKind } from './poi-parse'

type PoiHit = {
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}

type PoiPlace = {
  name: string
  street: string
  place: string
  lat: number
  lon: number
  distKm: number
}

type LastPoi = {
  at: string
  kind: PoiKind
  hits: PoiPlace[]
}

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const NO_GPS =
  'Ohne Standort kein Ort in der Nähe. Sagen Sie „aktivieren“ — Android-Abfrage, notfalls App-Einstellungen. Ich rate den Ort nicht.'
const ASK =
  'Welcher Ort — Apotheke, Bäcker, Parkplatz oder Supermarkt? Tanke extra sagen. Keine erfundenen Öffnungszeiten.'

const FILTER: Record<PoiKind, string> = {
  pharmacy: '["amenity"="pharmacy"]',
  bakery: '["shop"="bakery"]',
  parking: '["amenity"="parking"]',
  supermarket: '["shop"="supermarket"]',
}

export async function handlePoi(_conversationId: string, text: string): Promise<PoiHit> {
  const intent = parsePoiIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'ask') {
    return {
      handled: true,
      reply: ASK,
      tool: poiTool('ask', 'Ort'),
      lastTool: 'poi',
    }
  }
  return searchAndDrive(intent.kind)
}

export async function handlePoiOrdinal(index: number): Promise<PoiHit> {
  const last = readLastPoi()
  if (!last?.hits?.length) {
    return {
      handled: true,
      reply: 'Welcher Ort? Zum Beispiel „nächste Apotheke“.',
      tool: poiTool('ask', 'Ort'),
      lastTool: 'poi',
    }
  }
  const hit = last.hits[Math.max(0, index)]
  if (!hit) {
    return {
      handled: true,
      reply: `Es gibt ${last.hits.length} in der Nähe.`,
      tool: poiTool('ask', poiLabel(last.kind)),
      lastTool: 'poi',
    }
  }
  return driveTo(last.kind, hit, last.hits)
}

async function searchAndDrive(kind: PoiKind): Promise<PoiHit> {
  const here = await resolveHere()
  if (!here.ok) {
    return {
      handled: true,
      reply: here.message,
      tool: poiTool('ask', 'Kein Standort'),
      lastTool: 'poi',
    }
  }
  const found = await lookupPoi(kind, here.lat, here.lon)
  if (!found.ok) {
    return {
      handled: true,
      reply: found.message,
      tool: poiTool('error', poiLabel(kind)),
      lastTool: 'poi',
    }
  }
  remember(kind, found.hits)
  return driveTo(kind, found.hits[0], found.hits)
}

async function driveTo(kind: PoiKind, chosen: PoiPlace, all: PoiPlace[]): Promise<PoiHit> {
  const label = placeLabel(chosen, kind)
  const { route, tool } = await beginDriveTo(label, chosen.lat, chosen.lon)
  const km = chosen.distKm >= 1 ? `${chosen.distKm.toFixed(1)} km` : `${Math.round(chosen.distKm * 1000)} m`
  const extra = all.length > 1 ? ` Zweites: ${placeLabel(all[1], kind)}.` : ''
  const eta =
    route.minutes > 0
      ? ` Etwa ${route.minutes} Min.`
      : route.hint
        ? ` ${route.hint}`
        : ''
  return {
    handled: true,
    reply: `Nächste ${poiLabel(kind)}: ${label}, ${km}.${extra}${eta} Keine Öffnungszeiten aus der Karte.`,
    tool: {
      ...tool,
      tool: 'poi',
      action: 'nav',
      label: poiLabel(kind),
      preview: label,
    },
    lastTool: 'poi',
  }
}

function poiTool(action: string, label: string): ToolMeta {
  return { tool_status: action === 'error' ? 'error' : 'executed', tool: 'poi', action, label }
}

function remember(kind: PoiKind, hits: PoiPlace[]) {
  const payload: LastPoi = { at: new Date().toISOString(), kind, hits: hits.slice(0, 8) }
  saveSettings({ last_poi_json: JSON.stringify(payload) })
  persistLastList(
    'poi',
    hits.slice(0, 8).map((h) => placeLabel(h, kind)),
  )
}

function readLastPoi(): LastPoi | null {
  try {
    const raw = loadSettings().last_poi_json
    if (!raw) return null
    const parsed = JSON.parse(raw) as LastPoi
    if (!parsed?.hits?.length || !parsed.hits[0]?.lat) return null
    return parsed
  } catch {
    return null
  }
}

function placeLabel(p: PoiPlace, kind: PoiKind): string {
  const name = p.name.trim() || poiLabel(kind)
  const where = [p.street, p.place].filter(Boolean).join(', ')
  return where ? `${name}, ${where}` : name
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
  const s = loadSettings()
  const lat = Number(s.last_lat)
  const lon = Number(s.last_lon)
  const at = Date.parse(s.last_fix_at || '')
  if (Number.isFinite(lat) && Number.isFinite(lon) && Number.isFinite(at) && Date.now() - at <= 10 * 60_000) {
    return { ok: true, lat, lon }
  }
  return { ok: false, message: loc.message || NO_GPS }
}

async function lookupPoi(
  kind: PoiKind,
  lat: number,
  lon: number,
): Promise<{ ok: true; hits: PoiPlace[] } | { ok: false; message: string }> {
  for (const radKm of [8, 20]) {
    const once = await osmOnce(kind, lat, lon, radKm)
    if (!once.ok) {
      if (radKm === 20) return once
      continue
    }
    if (once.hits.length) return once
  }
  return { ok: false, message: `Keine ${poiLabel(kind)} in der Nähe. Ich erfinde keine.` }
}

async function osmOnce(
  kind: PoiKind,
  lat: number,
  lon: number,
  radKm: number,
): Promise<{ ok: true; hits: PoiPlace[] } | { ok: false; message: string }> {
  const filter = FILTER[kind]
  const query = `[out:json][timeout:12];nwr${filter}(around:${Math.round(radKm * 1000)},${lat},${lon});out center;`
  for (const base of OVERPASS) {
    try {
      const { status, json } = await getJson(`${base}?data=${encodeURIComponent(query)}`, {
        Accept: 'application/json',
        'User-Agent': 'Jarvis/1.44.0 (local.jarvis.app)',
      })
      if (status < 200 || status >= 300) continue
      const elements = Array.isArray(json.elements) ? (json.elements as Array<Record<string, unknown>>) : []
      const here = { lat, lon, place: '' }
      const hits: PoiPlace[] = []
      for (const el of elements) {
        const center = (el.center && typeof el.center === 'object' ? el.center : null) as
          | Record<string, unknown>
          | null
        const slat = num(el.lat) ?? num(center?.lat)
        const slon = num(el.lon) ?? num(center?.lon)
        if (slat == null || slon == null) continue
        const tags = (el.tags && typeof el.tags === 'object' ? el.tags : {}) as Record<string, unknown>
        const distM = haversineM(here, { lat: slat, lon: slon })
        hits.push({
          name: String(tags.name || tags.brand || '').trim(),
          street: String(tags['addr:street'] || '').trim(),
          place: String(tags['addr:city'] || tags['addr:place'] || '').trim(),
          lat: slat,
          lon: slon,
          distKm: distM / 1000,
        })
      }
      hits.sort((a, b) => a.distKm - b.distKm)
      return { ok: true, hits }
    } catch {
      continue
    }
  }
  return { ok: false, message: 'Karte nicht erreichbar.' }
}

function num(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
