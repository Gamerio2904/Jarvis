import { loadSettings } from './store.ts'

export function webMercator(lat: number, lon: number, z: number): { x: number; y: number } {
  const n = 2 ** z
  const x = ((lon + 180) / 360) * n
  const rad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  return { x, y }
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
