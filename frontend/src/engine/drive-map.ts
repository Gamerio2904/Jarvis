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

export function tileUrl(z: number, x: number, y: number, day: boolean): string {
  const tx = wrapTile(z, x)
  const n = 2 ** z
  const ty = Math.min(n - 1, Math.max(0, y))
  const style = day ? 'rastertiles/voyager' : 'dark_all'
  return `https://basemaps.cartocdn.com/${style}/${z}/${tx}/${ty}@2x.png`
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

export function compactCoords(coords: Array<[number, number]>, max = 480): Array<[number, number]> {
  if (!Array.isArray(coords) || coords.length <= max) return Array.isArray(coords) ? coords : []
  const out: Array<[number, number]> = []
  const step = (coords.length - 1) / (max - 1)
  for (let i = 0; i < max; i += 1) {
    const row = coords[Math.round(i * step)]
    if (row && Number.isFinite(Number(row[0])) && Number.isFinite(Number(row[1]))) out.push(row)
  }
  return out
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
