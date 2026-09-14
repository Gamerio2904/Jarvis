/**
 * Subsolar-Punkt (wo die Sonne im Zenit steht) aus UTC.
 *
 * Kein npm. Näherung ohne Nutation: Deklination aus der Jahresbahn,
 * Länge aus der Sonnenzeit. Für die Tag/Nacht-Grenze auf der Kugel
 * reicht das — es ist kein Ephemeriden-Dienst.
 *
 * lat ≈ 23.44° · sin(2π · (N − 81) / 365)
 * lon = (12 − UTC-Stunden) · 15°, gewrappt auf (−180, 180]
 */

export type LatLon = { lat: number; lon: number }

const DEG = Math.PI / 180
const TILT = 23.44
const SPRING = 81

export function dayOfYear(at: Date): number {
  const start = Date.UTC(at.getUTCFullYear(), 0, 1)
  return Math.floor((at.getTime() - start) / 86_400_000) + 1
}

export function wrapLon(lon: number): number {
  let x = lon
  while (x > 180) x -= 360
  while (x <= -180) x += 360
  return x
}

export function subsolar(at: Date = new Date()): LatLon {
  const n = dayOfYear(at)
  const lat = TILT * Math.sin((2 * Math.PI * (n - SPRING)) / 365)
  const hours = at.getUTCHours() + at.getUTCMinutes() / 60 + at.getUTCSeconds() / 3600
  const lon = wrapLon((12 - hours) * 15)
  return { lat, lon }
}

/** Kosinus des Zenitwinkels. Negativ = Nachtseite. */
export function sunCosine(lat: number, lon: number, sun: LatLon): number {
  const p = lat * DEG
  const s = sun.lat * DEG
  const dLon = (lon - sun.lon) * DEG
  return Math.sin(p) * Math.sin(s) + Math.cos(p) * Math.cos(s) * Math.cos(dLon)
}

export function isNight(lat: number, lon: number, sun: LatLon): boolean {
  return sunCosine(lat, lon, sun) < 0
}

/**
 * Was die sichtbare Scheibe als Nacht bekommt.
 * `sunZ` zur Kamera, `sunXY` projizierte Sonnenlage in der Scheibe.
 * Ein Half-Disk, kein Raster — sonst friert die Android-WebView ein.
 */
export function nightCover(sunZ: number, sunXY: number): 'none' | 'all' | 'half' {
  if (!(Number.isFinite(sunZ) && Number.isFinite(sunXY))) return 'none'
  if (sunXY < 0.08) return sunZ < 0 ? 'all' : 'none'
  return 'half'
}
