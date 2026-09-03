import data from './world-rings.json'

/** Natural Earth 110m, Ringe als [lon, lat, lon, lat, …]. Auf dem Handy jeder 2. Punkt. */
function decimate(ring: number[], keepEvery: number): number[] {
  if (ring.length <= 10) return ring
  const out: number[] = []
  for (let i = 0; i < ring.length - 2; i += keepEvery * 2) {
    out.push(ring[i], ring[i + 1])
  }
  const lastLon = ring[ring.length - 2]
  const lastLat = ring[ring.length - 1]
  if (out[out.length - 2] !== lastLon || out[out.length - 1] !== lastLat) {
    out.push(lastLon, lastLat)
  }
  return out
}

export const WORLD_RINGS = (data as number[][]).map((ring) => decimate(ring, 2))
