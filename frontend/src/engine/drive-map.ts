import { loadSettings } from './store.ts'

export const TILE_SIZE = 256

export type MapFix = { lat: number; lon: number; bearing?: number; speed?: number }

export function webMercator(lat: number, lon: number, z: number): { x: number; y: number } {
  const n = 2 ** z
  const x = ((lon + 180) / 360) * n
  const rad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  return { x, y }
}

export function wrapTile(n: number, x: number): number {
  const size = 2 ** n
  return ((x % size) + size) % size
}

export function cartoKey(raw?: string): string {
  return (raw ?? loadSettings().carto_api_key ?? '').trim()
}

export function tileUrl(z: number, x: number, y: number, day: boolean, key?: string): string {
  const tx = wrapTile(z, x)
  const n = 2 ** z
  const ty = Math.min(n - 1, Math.max(0, y))
  const style = day ? 'rastertiles/voyager' : 'dark_all'
  const base = `https://basemaps.cartocdn.com/${style}/${z}/${tx}/${ty}@2x.png`
  const token = cartoKey(key)
  return token ? `${base}?key=${encodeURIComponent(token)}` : base
}

export function dayTiles(at = new Date()): boolean {
  const h = at.getHours()
  return h >= 6 && h < 20
}

/** City default 16 — 17 was street-level postage. Highway pulls out further. */
export function zoomForSpeedMps(mps?: number): number {
  const kmh = Math.max(0, (mps || 0) * 3.6)
  if (kmh < 28) return 16
  if (kmh < 65) return 15
  if (kmh < 110) return 14
  return 13
}

export function settleZoom(current: number, wanted: number, changedAt: number, now: number, holdMs = 1600): number {
  if (wanted === current) return current
  if (now - changedAt < holdMs) return current
  return wanted
}

export function tilesForView(width: number, height: number, tile = TILE_SIZE): { cols: number; rows: number } {
  const w = Math.max(1, width)
  const h = Math.max(1, height)
  return {
    cols: Math.ceil(w / tile) + 2,
    rows: Math.ceil(h / tile) + 2,
  }
}

export type MapCam = { lat: number; lon: number; zoom: number }

export function clampMapZoom(z: number): number {
  if (!Number.isFinite(z)) return 16
  return Math.min(18.4, Math.max(12, z))
}

export function worldPixels(lat: number, lon: number, zoom: number, tile = TILE_SIZE): { x: number; y: number } {
  const n = tile * 2 ** zoom
  const x = ((lon + 180) / 360) * n
  const rad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  return { x, y }
}

export function latLonFromWorld(x: number, y: number, zoom: number, tile = TILE_SIZE): { lat: number; lon: number } {
  const n = tile * 2 ** zoom
  const lon = (x / n) * 360 - 180
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI
  return { lat: Math.max(-85, Math.min(85, lat)), lon }
}

/** Finger nach rechts → Karte nach rechts, Kamera nach Westen. */
export function panCam(cam: MapCam, dxPx: number, dyPx: number): MapCam {
  const p = worldPixels(cam.lat, cam.lon, cam.zoom)
  const next = latLonFromWorld(p.x - dxPx, p.y - dyPx, cam.zoom)
  return { lat: next.lat, lon: next.lon, zoom: cam.zoom }
}

/** Pinch/Doppeltipp: Punkt unter dem Finger bleibt liegen. */
export function zoomAround(
  cam: MapCam,
  nextZoom: number,
  screenX: number,
  screenY: number,
  cx: number,
  cy: number,
): MapCam {
  const z = clampMapZoom(nextZoom)
  const before = worldPixels(cam.lat, cam.lon, cam.zoom)
  const fx = before.x + (screenX - cx)
  const fy = before.y + (screenY - cy)
  const scale = 2 ** (z - cam.zoom)
  const camX = fx * scale - (screenX - cx)
  const camY = fy * scale - (screenY - cy)
  const ll = latLonFromWorld(camX, camY, z)
  return { lat: ll.lat, lon: ll.lon, zoom: z }
}

export function projectToView(
  lat: number,
  lon: number,
  camLat: number,
  camLon: number,
  z: number,
  cx: number,
  cy: number,
  tile = TILE_SIZE,
): { x: number; y: number } {
  const c = worldPixels(camLat, camLon, z, tile)
  const p = worldPixels(lat, lon, z, tile)
  return { x: p.x - c.x + cx, y: p.y - c.y + cy }
}

export function lonLatPath(
  coords: Array<[number, number]>,
  origin: { x: number; y: number },
  z: number,
  size: number,
): string {
  const out: string[] = []
  let lastX = Infinity
  let lastY = Infinity
  for (const pair of coords) {
    const lon = Number(pair?.[0])
    const lat = Number(pair?.[1])
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    const p = webMercator(lat, lon, z)
    const x = (p.x - origin.x) * size
    const y = (p.y - origin.y) * size
    if (Math.abs(x - lastX) < 2 && Math.abs(y - lastY) < 2) continue
    lastX = x
    lastY = y
    out.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return out.join(' ')
}

/** GeoJSON `[lon,lat]`. Vertauschte DE-Paare `[lat,lon]` werden gedreht. */
export function asLonLat(pair: unknown): [number, number] | null {
  if (!Array.isArray(pair) || pair.length < 2) return null
  let lon = Number(pair[0])
  let lat = Number(pair[1])
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null
  if (Math.abs(lon) > 20 && Math.abs(lat) < 20) {
    const swap = lon
    lon = lat
    lat = swap
  }
  if (Math.abs(lat) > 85 || Math.abs(lon) > 180) return null
  return [lon, lat]
}

/** Google/OSRM Encoded Polyline, precision 5 → `[lon,lat]`. */
export function decodePolyline(encoded: string, precision = 5): Array<[number, number]> {
  if (!encoded || typeof encoded !== 'string') return []
  const factor = 10 ** precision
  let index = 0
  let lat = 0
  let lon = 0
  const out: Array<[number, number]> = []
  while (index < encoded.length) {
    let result = 0
    let shift = 0
    let b = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 31) << shift
      shift += 5
    } while (b >= 32 && index < encoded.length)
    lat += result & 1 ? ~(result >> 1) : result >> 1
    result = 0
    shift = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 31) << shift
      shift += 5
    } while (b >= 32 && index < encoded.length)
    lon += result & 1 ? ~(result >> 1) : result >> 1
    const pair = asLonLat([lon / factor, lat / factor])
    if (pair) out.push(pair)
  }
  return out
}

function localMeters(lat: number, lon: number, lat0: number): { x: number; y: number } {
  const cos = Math.cos((lat0 * Math.PI) / 180)
  return { x: lon * 111_320 * cos, y: lat * 110_540 }
}

function distToSegM(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-9) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

export type TrackSnap = {
  lat: number
  lon: number
  bearing: number
  distM: number
  index: number
}

/** GPS auf die Linie ziehen — Kurven/Kreisverkehr nicht über den Ring springen. */
export function snapToTrack(
  coords: Array<[number, number]>,
  pos: { lat: number; lon: number },
  hintI = 0,
): TrackSnap | null {
  if (!Array.isArray(coords) || coords.length < 2) return null
  const lat0 = pos.lat
  const p = localMeters(pos.lat, pos.lon, lat0)
  const start = Math.max(0, Math.min(coords.length - 2, hintI - 12))
  const end = Math.min(coords.length - 2, Math.max(start + 1, hintI + 48))
  const windows: Array<[number, number]> = [
    [start, end],
    [0, coords.length - 2],
  ]
  let best: TrackSnap | null = null
  const seen = new Set<string>()
  for (const [from, to] of windows) {
    const key = `${from}:${to}`
    if (seen.has(key)) continue
    seen.add(key)
    for (let i = from; i <= to; i += 1) {
      const a = coords[i]
      const b = coords[i + 1]
      if (!a || !b) continue
      const A = localMeters(a[1], a[0], lat0)
      const B = localMeters(b[1], b[0], lat0)
      const dx = B.x - A.x
      const dy = B.y - A.y
      const len2 = dx * dx + dy * dy
      let t = 0
      if (len2 > 1e-9) t = Math.max(0, Math.min(1, ((p.x - A.x) * dx + (p.y - A.y) * dy) / len2))
      const sx = A.x + t * dx
      const sy = A.y + t * dy
      const distM = Math.hypot(p.x - sx, p.y - sy)
      if (best && distM >= best.distM) continue
      const cos = Math.cos((lat0 * Math.PI) / 180)
      const lon = sx / (111_320 * (cos || 1e-6))
      const lat = sy / 110_540
      const bearing = (Math.atan2(dx, dy) * 180) / Math.PI
      best = {
        lat,
        lon,
        bearing: (bearing + 360) % 360,
        distM,
        index: i,
      }
    }
    if (best && best.distM < 28) break
  }
  return best
}

/** Douglas-Peucker in Metern — Ecken und Kreisverkehre bleiben enger. */
export function simplifyTrack(coords: Array<[number, number]>, epsilonM = 4): Array<[number, number]> {
  if (!Array.isArray(coords) || coords.length <= 2) return Array.isArray(coords) ? coords.slice() : []
  const lat0 = coords.reduce((s, p) => s + Number(p[1] || 0), 0) / coords.length
  const xy = coords.map(([lon, lat]) => localMeters(lat, lon, lat0))
  const rdp = (start: number, end: number): number[] => {
    let maxD = 0
    let idx = -1
    const a = xy[start]
    const b = xy[end]
    for (let i = start + 1; i < end; i += 1) {
      const d = distToSegM(xy[i].x, xy[i].y, a.x, a.y, b.x, b.y)
      if (d > maxD) {
        maxD = d
        idx = i
      }
    }
    if (maxD > epsilonM && idx > start) {
      const left = rdp(start, idx)
      const right = rdp(idx, end)
      return left.concat(right.slice(1))
    }
    return [start, end]
  }
  return rdp(0, coords.length - 1).map((i) => coords[i])
}

/** Luftlinie aus zwei Punkten ist keine Straßenroute. */
export function isRoadTrack(coords: Array<[number, number]>, meters = 0): boolean {
  if (!Array.isArray(coords) || coords.length < 3) return false
  if (meters > 400 && coords.length < 6) return false
  return true
}

export function compactCoords(coords: Array<[number, number]>, max = 640): Array<[number, number]> {
  if (!Array.isArray(coords) || coords.length <= max) return Array.isArray(coords) ? coords : []
  const out: Array<[number, number]> = []
  const step = (coords.length - 1) / (max - 1)
  for (let i = 0; i < max; i += 1) {
    const row = coords[Math.round(i * step)]
    if (row && Number.isFinite(Number(row[0])) && Number.isFinite(Number(row[1]))) out.push(row)
  }
  return out
}

/** Zoom so that dest stays on screen while the camera sits on `here`. */
export function zoomToInclude(
  here: { lat: number; lon: number },
  dest: { lat: number; lon: number },
  width: number,
  height: number,
): number {
  const w = Math.max(80, width)
  const h = Math.max(80, height)
  const cx = w * 0.5
  const cy = h * 0.58
  const padX = Math.max(36, w * 0.14)
  const padY = Math.max(56, h * 0.16)
  const fits = (z: number) => {
    const pt = projectToView(dest.lat, dest.lon, here.lat, here.lon, z, cx, cy)
    return pt.x >= padX && pt.x <= w - padX && pt.y >= padY && pt.y <= h - padY
  }
  let z = 16
  while (z > 12 && !fits(z)) z -= 0.25
  return clampMapZoom(z)
}

/** Same space as Carto tiles (integer zoom + fractional tile size). */
export function projectOnTiles(
  lat: number,
  lon: number,
  cam: { x: number; y: number },
  zInt: number,
  size: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  const p = webMercator(lat, lon, zInt)
  return { x: (p.x - cam.x) * size + cx, y: (p.y - cam.y) * size + cy }
}

export function readLastMapFix(): { lat: number; lon: number } | null {
  const s = loadSettings()
  const lat = Number(s.last_lat)
  const lon = Number(s.last_lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (Math.abs(lat) < 0.2 && Math.abs(lon) < 0.2) return null
  return { lat, lon }
}

const TILE_CACHE = new Map<string, HTMLImageElement>()
const TILE_WAIT = new Set<string>()
const TILE_ORDER: string[] = []
const TILE_MAX = 180

export function prefetchTile(url: string, onReady: () => void): HTMLImageElement | undefined {
  const hit = TILE_CACHE.get(url)
  if (hit?.complete && hit.naturalWidth > 0) return hit
  if (TILE_WAIT.has(url) || typeof Image === 'undefined') return hit
  TILE_WAIT.add(url)
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.decoding = 'async'
  img.onload = () => {
    TILE_WAIT.delete(url)
    TILE_CACHE.set(url, img)
    TILE_ORDER.push(url)
    while (TILE_ORDER.length > TILE_MAX) {
      const old = TILE_ORDER.shift()
      if (old && old !== url) TILE_CACHE.delete(old)
    }
    onReady()
  }
  img.onerror = () => {
    TILE_WAIT.delete(url)
  }
  img.src = url
  return undefined
}

export function tilesPending(): number {
  return TILE_WAIT.size
}
