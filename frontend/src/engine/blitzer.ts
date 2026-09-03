import { getText } from './http-json.ts'
import { parseBlitzerIntent, BLITZER_NO_ROUTE } from './blitzer-parse.ts'
import { AROUND_M, hazardsInCorridor, sampleRouteCoords } from './blitzer-geo.ts'
import { getDriveRoute, setDriveHazards, type DriveHazard } from './drive.ts'
import { loadSettings, saveSettings } from './store.ts'
import type { ToolMeta } from './tools.ts'

export { parseBlitzerIntent, BLITZER_NO_ROUTE }
export { hazardsInCorridor, sampleRouteCoords } from './blitzer-geo.ts'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/9.9.2 (local.jarvis.app)' }

export type BlitzerSnap = {
  at: string
  source: 'osm'
  cameras: DriveHazard[]
  works: DriveHazard[]
}

async function fetchOsm(coords: Array<[number, number]>): Promise<BlitzerSnap> {
  const samples = sampleRouteCoords(coords)
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
    cameras: hazardsInCorridor(cameras, coords),
    works: hazardsInCorridor(works, coords),
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
      reply: BLITZER_NO_ROUTE,
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
