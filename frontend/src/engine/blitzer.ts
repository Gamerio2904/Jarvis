import { getText } from './http-json.ts'
import { parseBlitzerIntent } from './blitzer-parse.ts'
import { getDriveRoute, setDriveHazards, type DriveHazard } from './drive.ts'
import { loadSettings, saveSettings } from './store.ts'
import type { ToolMeta } from './tools.ts'

export { parseBlitzerIntent }

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/6.91.0 (local.jarvis.app)' }
const AROUND_M = 150
const SAMPLE_M = 1800

export type BlitzerSnap = {
  at: string
  source: 'osm'
  cameras: DriveHazard[]
  works: DriveHazard[]
}

function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLon = ((b[0] - a[0]) * Math.PI) / 180
  const la1 = (a[1] * Math.PI) / 180
  const la2 = (b[1] * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

function sampleCoords(coords: Array<[number, number]>): Array<[number, number]> {
  if (!coords.length) return []
  const out: Array<[number, number]> = [coords[0]]
  let acc = 0
  for (let i = 1; i < coords.length; i += 1) {
    acc += haversineM(coords[i - 1], coords[i])
    if (acc >= SAMPLE_M) {
      out.push(coords[i])
      acc = 0
    }
  }
  const last = coords[coords.length - 1]
  if (out[out.length - 1] !== last) out.push(last)
  return out.slice(0, 24)
}

function corridorFilter(pts: DriveHazard[], coords: Array<[number, number]>): DriveHazard[] {
  return pts.filter((p) => coords.some((c) => haversineM(c, [p.lon, p.lat]) <= AROUND_M + 40))
}

async function fetchOsm(coords: Array<[number, number]>): Promise<BlitzerSnap> {
  const samples = sampleCoords(coords)
  const around = samples.map(([lon, lat]) => `(around:${AROUND_M},${lat},${lon})`).join('')
  const ql = `[out:json][timeout:18];(node["highway"="speed_camera"]${around};way["highway"="construction"]${around};);out center 40;`
  const body = `data=${encodeURIComponent(ql)}`
  const { status, text } = await getText(
    `https://overpass-api.de/api/interpreter?${body}`,
    UA,
  )
  let elements: Array<Record<string, unknown>> = []
  if (status >= 200 && status < 300) {
    try {
      elements = ((JSON.parse(text) as { elements?: Array<Record<string, unknown>> }).elements ||
        []) as Array<Record<string, unknown>>
    } catch {
      elements = []
    }
  }
  const cameras: DriveHazard[] = []
  const works: DriveHazard[] = []
  for (const el of elements) {
    const tags = (el.tags || {}) as Record<string, string>
    const lat = Number(el.lat ?? (el.center as { lat?: number } | undefined)?.lat)
    const lon = Number(el.lon ?? (el.center as { lon?: number } | undefined)?.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    if (tags.highway === 'speed_camera') {
      cameras.push({ lat, lon, kind: 'camera', line: 'Feste Säule · OSM, unvollständig' })
    } else if (tags.highway === 'construction') {
      works.push({ lat, lon, kind: 'works', line: tags.name || 'Baustelle · OSM' })
    }
  }
  return {
    at: new Date().toISOString(),
    source: 'osm',
    cameras: corridorFilter(cameras, coords),
    works: corridorFilter(works, coords),
  }
}

export async function handleBlitzer(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseBlitzerIntent(text)
  if (!intent) return { handled: false }
  const route = getDriveRoute()
  if (!route?.coords?.length) {
    return {
      handled: true,
      reply: 'Keine Route. Erst navigieren — dann OSM-Säulen im Korridor. Mobil bleibt leer, das jage ich nicht.',
      tool: { tool_status: 'executed', tool: 'blitzer', action: 'no_route', label: 'Blitzer' },
      lastTool: 'blitzer',
    }
  }
  let snap: BlitzerSnap
  try {
    snap = await fetchOsm(route.coords)
  } catch {
    snap = { at: new Date().toISOString(), source: 'osm', cameras: [], works: [] }
  }
  saveSettings({ last_blitzer_json: JSON.stringify(snap) })
  const wantCam = intent.want !== 'works'
  const wantWorks = intent.want !== 'camera'
  const cams = wantCam ? snap.cameras : []
  const wrk = wantWorks ? snap.works : []
  setDriveHazards([...cams, ...wrk])
  const stand = new Date(snap.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const bits: string[] = []
  if (wantCam) bits.push(cams.length ? `${cams.length} feste OSM-Säulen` : 'keine festen OSM-Säulen')
  if (wantWorks) bits.push(wrk.length ? `${wrk.length} OSM-Baustellen` : 'keine OSM-Baustellen')
  return {
    handled: true,
    reply: `${bits.join(', ')}. Stand ${stand}, unvollständig. Mobil und Beamte: leer.`,
    tool: { tool_status: 'executed', tool: 'blitzer', action: 'osm', label: 'Blitzer', preview: `${cams.length}+${wrk.length}` },
    lastTool: 'blitzer',
  }
}

export function loadBlitzerSnap(): BlitzerSnap | null {
  try {
    const raw = loadSettings().last_blitzer_json
    if (!raw) return null
    return JSON.parse(raw) as BlitzerSnap
  } catch {
    return null
  }
}
