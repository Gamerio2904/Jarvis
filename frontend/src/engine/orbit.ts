/** Einfache Kepler-Lage aus CelesTrak-GP. Kein volles SGP4 — reicht für Kugel-Punkte. */

export type GpRow = {
  OBJECT_NAME?: string
  NORAD_CAT_ID?: string | number
  EPOCH?: string
  MEAN_MOTION?: number
  ECCENTRICITY?: number
  INCLINATION?: number
  RA_OF_ASC_NODE?: number
  ARG_OF_PERICENTER?: number
  MEAN_ANOMALY?: number
}

export type SatFix = { name: string; norad: string; lat: number; lon: number }

const MU = 398_600.4418
const DEG = Math.PI / 180

function wrapPi(a: number): number {
  let x = a
  while (x > Math.PI) x -= Math.PI * 2
  while (x < -Math.PI) x += Math.PI * 2
  return x
}

function keplerE(M: number, e: number): number {
  let E = M
  for (let i = 0; i < 10; i += 1) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
  }
  return E
}

/** Greenwich-Sternzeit, grob. */
export function gmstRad(at: Date): number {
  const y = at.getUTCFullYear()
  const m = at.getUTCMonth() + 1
  const d = at.getUTCDate()
  const ut = at.getUTCHours() + at.getUTCMinutes() / 60 + at.getUTCSeconds() / 3600
  let yy = y
  let mm = m
  if (mm <= 2) {
    yy -= 1
    mm += 12
  }
  const A = Math.floor(yy / 100)
  const B = 2 - A + Math.floor(A / 4)
  const jd =
    Math.floor(365.25 * (yy + 4716)) +
    Math.floor(30.6001 * (mm + 1)) +
    d +
    B -
    1524.5 +
    ut / 24
  const t = (jd - 2451545) / 36525
  const theta = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * t * t
  return wrapPi(((theta % 360) + 360) % 360 * DEG)
}

export function propagateGp(row: GpRow, at = new Date()): SatFix | null {
  const name = String(row.OBJECT_NAME || '').replace(/\s+/g, ' ').trim()
  const norad = String(row.NORAD_CAT_ID || '').trim()
  const n0 = Number(row.MEAN_MOTION)
  const e = Number(row.ECCENTRICITY)
  const inc = Number(row.INCLINATION) * DEG
  const raan = Number(row.RA_OF_ASC_NODE) * DEG
  const argp = Number(row.ARG_OF_PERICENTER) * DEG
  const M0 = Number(row.MEAN_ANOMALY) * DEG
  const epoch = row.EPOCH ? new Date(row.EPOCH.endsWith('Z') ? row.EPOCH : `${row.EPOCH}Z`) : null
  if (!name || !norad || !epoch || !Number.isFinite(epoch.getTime())) return null
  if (!(n0 > 0.1) || !(e >= 0 && e < 0.9) || !Number.isFinite(inc)) return null
  const n = (n0 * 2 * Math.PI) / 86400
  const a = Math.cbrt(MU / (n * n))
  const dt = (at.getTime() - epoch.getTime()) / 1000
  if (!Number.isFinite(dt) || Math.abs(dt) > 8 * 86400) return null
  const M = wrapPi(M0 + n * dt)
  const E = keplerE(M, e)
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2))
  const r = a * (1 - e * Math.cos(E))
  const xOrb = r * Math.cos(nu)
  const yOrb = r * Math.sin(nu)
  const cosO = Math.cos(raan)
  const sinO = Math.sin(raan)
  const cosI = Math.cos(inc)
  const sinI = Math.sin(inc)
  const cosW = Math.cos(argp)
  const sinW = Math.sin(argp)
  const xEci =
    xOrb * (cosO * cosW - sinO * sinW * cosI) - yOrb * (cosO * sinW + sinO * cosW * cosI)
  const yEci =
    xOrb * (sinO * cosW + cosO * sinW * cosI) + yOrb * (cosO * cosW * cosI - sinO * sinW)
  const zEci = xOrb * (sinW * sinI) + yOrb * (cosW * sinI)
  const g = gmstRad(at)
  const x = xEci * Math.cos(g) + yEci * Math.sin(g)
  const y = -xEci * Math.sin(g) + yEci * Math.cos(g)
  const z = zEci
  const lat = Math.atan2(z, Math.hypot(x, y)) / DEG
  const lon = Math.atan2(y, x) / DEG
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { name: name.slice(0, 28), norad, lat, lon }
}

export type LonLatBox = { minLon: number; minLat: number; maxLon: number; maxLat: number }

export function inLonLatBox(p: { lat: number; lon: number }, box: LonLatBox): boolean {
  return p.lon >= box.minLon && p.lon <= box.maxLon && p.lat >= box.minLat && p.lat <= box.maxLat
}

/** EONET ohne bbox liefert zuerst USA. Vier Kästen, dann lokal gefiltert. */
export const FIRE_BANDS: LonLatBox[] = [
  { minLon: -170, minLat: 15, maxLon: -50, maxLat: 72 },
  { minLon: -90, minLat: -56, maxLon: -30, maxLat: 15 },
  { minLon: -20, minLat: -36, maxLon: 50, maxLat: 72 },
  { minLon: 50, minLat: -48, maxLon: 180, maxLat: 72 },
]

export function spreadFixes<T extends { lat: number; lon: number }>(pins: T[], cap: number): T[] {
  if (pins.length <= cap) return pins
  const buckets = new Map<number, T[]>()
  for (const p of pins) {
    const lonB = Math.min(7, Math.max(0, Math.floor((p.lon + 180) / 45)))
    const latB = p.lat >= 23 ? 0 : p.lat <= -23 ? 2 : 1
    const k = lonB * 3 + latB
    const list = buckets.get(k) || []
    list.push(p)
    buckets.set(k, list)
  }
  const out: T[] = []
  const keys = [...buckets.keys()].sort((a, b) => a - b)
  let i = 0
  while (out.length < cap && keys.some((k) => (buckets.get(k) || []).length)) {
    const k = keys[i % keys.length]
    const list = buckets.get(k) || []
    const next = list.shift()
    if (next) out.push(next)
    i += 1
  }
  return out
}
