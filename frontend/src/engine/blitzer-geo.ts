export const AROUND_M = 150
export const SAMPLE_M = 1800

export type CorridorHazard = { lat: number; lon: number; kind: 'camera' | 'works'; line: string }

export function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLon = ((b[0] - a[0]) * Math.PI) / 180
  const la1 = (a[1] * Math.PI) / 180
  const la2 = (b[1] * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

export function sampleRouteCoords(coords: Array<[number, number]>): Array<[number, number]> {
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

export function hazardsInCorridor(pts: CorridorHazard[], coords: Array<[number, number]>): CorridorHazard[] {
  return pts.filter((p) => coords.some((c) => haversineM(c, [p.lon, p.lat]) <= AROUND_M + 40))
}
