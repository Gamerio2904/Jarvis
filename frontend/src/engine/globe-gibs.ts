/** NASA GIBS True Color — Stunden alt, Datum sichtbar. Kein Live-Video. */

export const GIBS_ZOOM_IN = 3.8
/** Fly-to nach „Zeig Stadt“: in der GIBS-Disk, unter Street-View / 2D-Karte. */
export const CITY_FLY_ZOOM = 4.4
export const TOUR_OVERVIEW_ZOOM = 1.7
export const GIBS_LAYER = 'MODIS_Terra_CorrectedReflectance_TrueColor'
const TILE = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best'

export function gibsTimeCandidates(now = new Date()): string[] {
  const out: string[] = []
  for (const back of [1, 0, 2, 3]) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - back))
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

export function gibsTileUrl(date: string, z: number, x: number, y: number): string {
  return `${TILE}/${GIBS_LAYER}/default/${date}/GoogleMapsCompatible_Level9/${z}/${y}/${x}.jpg`
}

export function lon2tile(lon: number, z: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** z)
}

export function lat2tile(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z)
}

export function tile2lon(x: number, z: number): number {
  return (x / 2 ** z) * 360 - 180
}

export function tile2lat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
}

export function globeZoomToTileZ(zoom: number): number {
  const z = Math.floor(3 + (zoom - GIBS_ZOOM_IN) * 1.6)
  return Math.max(3, Math.min(7, z))
}

export function gibsStamp(date: string): string {
  return `Stand ${date}, oft Stunden alt — kein Live-Video`
}

const cache = new Map<string, HTMLImageElement | 'fail'>()

export function loadTile(url: string): HTMLImageElement | null {
  const hit = cache.get(url)
  if (hit === 'fail') return null
  if (hit && hit.complete && hit.naturalWidth > 0) return hit
  if (hit) return null
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.decoding = 'async'
  img.onload = () => {
    cache.set(url, img)
  }
  img.onerror = () => {
    cache.set(url, 'fail')
  }
  cache.set(url, img)
  img.src = url
  return null
}

export function blueMarbleUrls(): string[] {
  return [0, 1].map(
    (col) =>
      `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/BlueMarble_NextGeneration/default/2004-01-01/500m/0/0/${col}.jpeg`,
  )
}
