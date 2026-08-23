import { ensureDeviceLocation } from '../native/geo'
import { haversineM } from './geo-lookup'
import { getJson } from './http-json'
import { mentionsMobileRadar, parseRadarIntent } from './radar-parse'
import { loadSettings, persistLastList, saveSettings } from './store'
import type { ToolMeta } from './tools'

export { parseRadarIntent } from './radar-parse'
export type { RadarIntent } from './radar-parse'

export type RadarHazard = {
  kind: 'camera' | 'works' | 'warning' | 'closure'
  source: 'osm' | 'autobahn'
  name: string
  lat: number
  lon: number
  meters: number
}

type RadarHit = {
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const AB = 'https://verkehr.autobahn.de/o/autobahn'
const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/2.21.0 (local.jarvis.app)' }
const NO_GPS =
  'Ohne Standort keine Warnung. Sagen Sie „aktivieren“ — Android-Abfrage, notfalls App-Einstellungen. Ich rate die Strecke nicht.'
const MOBILE_NOTE = 'Mobile Blitzer liefert kein Amt. Nur Karte und Autobahn GmbH.'

let cache: { at: number; lat: number; lon: number; items: RadarHazard[] } | null = null

function radarTool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'radar', action, label }
}

export async function handleRadar(_conversationId: string, text: string): Promise<RadarHit> {
  const intent = parseRadarIntent(text)
  if (!intent) return { handled: false }
  const here = await resolveHere()
  if (!here.ok) {
    return { handled: true, reply: here.message, tool: radarTool('ask', 'Kein Standort'), lastTool: 'radar' }
  }
  const items = await loadHazards(here.lat, here.lon)
  const wantWorks = intent.kind === 'works'
  const pick = items.filter((h) => (wantWorks ? h.kind !== 'camera' : true)).sort((a, b) => a.meters - b.meters)
  persistLastList(
    'radar',
    pick.slice(0, 6).map((h) => h.name),
  )
  saveSettings({ last_radar_json: JSON.stringify({ at: new Date().toISOString(), items: pick.slice(0, 12) }) })
  const mobileAsk = mentionsMobileRadar(text)
  if (!pick.length) {
    return {
      handled: true,
      reply: wantWorks
        ? `Keine Baustelle oder Sperrung in 8 km auf der Karte oder der Autobahn-API. ${MOBILE_NOTE}`
        : `Kein fester Blitzer und keine Autobahn-Meldung in 8 km. ${MOBILE_NOTE}`,
      tool: radarTool('empty', 'Nichts in der Nähe'),
      lastTool: 'radar',
    }
  }
  const lines = pick.slice(0, 4).map(formatHazard)
  const extra = mobileAsk ? ` ${MOBILE_NOTE}` : ''
  return {
    handled: true,
    reply: `${lines.join(' ')}${extra}`,
    tool: radarTool(intent.kind, 'Lage vor Ihnen'),
    lastTool: 'radar',
  }
}

export async function peekRadarCue(lat: number, lon: number): Promise<string | null> {
  const items = await loadHazards(lat, lon)
  const near = items.filter((h) => h.meters <= 900).sort((a, b) => a.meters - b.meters)[0]
  if (!near) return null
  if (near.kind === 'camera') return `Fester Blitzer in ${near.meters} Metern. Karte, nicht mobil.`
  if (near.kind === 'closure') return `Sperrung in ${near.meters} Metern. Autobahn GmbH.`
  if (near.kind === 'works') return `Baustelle in ${near.meters} Metern.`
  return `Verkehrsmeldung in ${near.meters} Metern. Autobahn GmbH.`
}

async function loadHazards(lat: number, lon: number): Promise<RadarHazard[]> {
  if (cache && Date.now() - cache.at < 45_000 && haversineM({ lat: cache.lat, lon: cache.lon, place: '' }, { lat, lon }) < 400) {
    return cache.items.map((h) => ({ ...h, meters: Math.round(haversineM({ lat, lon, place: '' }, h)) }))
  }
  const [osm, roads] = await Promise.all([fetchOsm(lat, lon), fetchMotorwayRef(lat, lon)])
  const auto: RadarHazard[] = []
  for (const ref of roads.slice(0, 2)) {
    auto.push(...(await fetchAutobahn(ref, lat, lon)))
  }
  const items = dedupe([...osm, ...auto]).sort((a, b) => a.meters - b.meters)
  cache = { at: Date.now(), lat, lon, items }
  return items
}

async function fetchOsm(lat: number, lon: number): Promise<RadarHazard[]> {
  const q = `[out:json][timeout:12];(node["highway"="speed_camera"](around:8000,${lat},${lon});node["amenity"="speed_camera"](around:8000,${lat},${lon});way["highway"="construction"](around:6000,${lat},${lon});node["highway"="construction"](around:6000,${lat},${lon}););out center tags;`
  for (const base of OVERPASS) {
    try {
      const { status, json } = await getJson(`${base}?data=${encodeURIComponent(q)}`, UA)
      if (status >= 400) continue
      const elements = Array.isArray((json as { elements?: unknown }).elements)
        ? ((json as { elements: Array<Record<string, unknown>> }).elements)
        : []
      const out: RadarHazard[] = []
      for (const el of elements) {
        const tags = (el.tags || {}) as Record<string, string>
        const pt = pointOf(el)
        if (!pt) continue
        const camera = tags.highway === 'speed_camera' || tags.amenity === 'speed_camera'
        const meters = Math.round(haversineM({ lat, lon, place: '' }, pt))
        out.push({
          kind: camera ? 'camera' : 'works',
          source: 'osm',
          name: camera
            ? streetName(tags, 'Fester Blitzer')
            : streetName(tags, tags.ref || 'Baustelle'),
          lat: pt.lat,
          lon: pt.lon,
          meters,
        })
      }
      return out
    } catch {
      /* nächster Interpreter */
    }
  }
  return []
}

async function fetchMotorwayRef(lat: number, lon: number): Promise<string[]> {
  const q = `[out:json][timeout:10];way["highway"="motorway"](around:900,${lat},${lon});out tags;`
  for (const base of OVERPASS) {
    try {
      const { status, json } = await getJson(`${base}?data=${encodeURIComponent(q)}`, UA)
      if (status >= 400) continue
      const elements = Array.isArray((json as { elements?: unknown }).elements)
        ? ((json as { elements: Array<Record<string, unknown>> }).elements)
        : []
      const refs = new Set<string>()
      for (const el of elements) {
        const ref = String(((el.tags || {}) as { ref?: string }).ref || '')
          .replace(/\s+/g, '')
          .toUpperCase()
        if (/^A\d{1,3}[A-Z]?$/.test(ref)) refs.add(ref)
      }
      return [...refs]
    } catch {
      /* nächster */
    }
  }
  return []
}

async function fetchAutobahn(roadId: string, lat: number, lon: number): Promise<RadarHazard[]> {
  const kinds: Array<{ path: string; kind: RadarHazard['kind']; key: string }> = [
    { path: 'roadworks', kind: 'works', key: 'roadworks' },
    { path: 'warning', kind: 'warning', key: 'warning' },
    { path: 'closure', kind: 'closure', key: 'closure' },
  ]
  const out: RadarHazard[] = []
  for (const row of kinds) {
    try {
      const { status, json } = await getJson(`${AB}/${roadId}/services/${row.path}`, UA)
      if (status >= 400) continue
      const list = Array.isArray((json as Record<string, unknown>)[row.key])
        ? ((json as Record<string, unknown>)[row.key] as Array<Record<string, unknown>>)
        : []
      for (const item of list) {
        const pt = coordOf(item)
        if (!pt) continue
        const meters = Math.round(haversineM({ lat, lon, place: '' }, pt))
        if (meters > 12_000) continue
        const title = String(item.title || item.subtitle || item.description || row.kind)
        out.push({
          kind: row.kind,
          source: 'autobahn',
          name: `${roadId}: ${title}`.slice(0, 80),
          lat: pt.lat,
          lon: pt.lon,
          meters,
        })
      }
    } catch {
      /* Straße ohne Dienst */
    }
  }
  return out
}

function coordOf(item: Record<string, unknown>): { lat: number; lon: number } | null {
  const c = item.coordinate as { lat?: string; long?: string } | undefined
  const lat = Number(c?.lat)
  const lon = Number(c?.long)
  if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon }
  return null
}

function pointOf(el: Record<string, unknown>): { lat: number; lon: number } | null {
  const lat = Number(el.lat ?? (el.center as { lat?: number } | undefined)?.lat)
  const lon = Number(el.lon ?? (el.center as { lon?: number } | undefined)?.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { lat, lon }
}

function streetName(tags: Record<string, string>, fallback: string): string {
  return (tags.name || tags.ref || tags.maxspeed || fallback).trim() || fallback
}

function formatHazard(h: RadarHazard): string {
  const where = h.meters >= 1000 ? `${(h.meters / 1000).toFixed(1)} km` : `${h.meters} m`
  const src = h.source === 'autobahn' ? 'Autobahn GmbH' : 'OSM'
  if (h.kind === 'camera') return `Fester Blitzer ${h.name}, ${where} (${src}).`
  if (h.kind === 'closure') return `Sperrung ${h.name}, ${where} (${src}).`
  if (h.kind === 'warning') return `Meldung ${h.name}, ${where} (${src}).`
  return `Baustelle ${h.name}, ${where} (${src}).`
}

function dedupe(items: RadarHazard[]): RadarHazard[] {
  const seen = new Set<string>()
  const out: RadarHazard[] = []
  for (const h of items) {
    const key = `${h.kind}:${h.lat.toFixed(4)}:${h.lon.toFixed(4)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(h)
  }
  return out
}

async function resolveHere(): Promise<{ ok: true; lat: number; lon: number } | { ok: false; message: string }> {
  const loc = await ensureDeviceLocation()
  if (loc.ok && loc.lat != null && loc.lon != null) {
    saveSettings({
      last_lat: String(loc.lat),
      last_lon: String(loc.lon),
      last_fix_at: new Date().toISOString(),
    })
    return { ok: true, lat: loc.lat, lon: loc.lon }
  }
  const lat = Number(loadSettings().last_lat)
  const lon = Number(loadSettings().last_lon)
  const at = Date.parse(loadSettings().last_fix_at || '')
  if (Number.isFinite(lat) && Number.isFinite(lon) && Number.isFinite(at) && Date.now() - at < 10 * 60_000) {
    return { ok: true, lat, lon }
  }
  return { ok: false, message: loc.message || NO_GPS }
}
