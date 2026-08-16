import { getJson } from './http-json'

export type Fix = { lat: number; lon: number; place: string }

export async function geocodePlace(name: string): Promise<{ ok: true; fix: Fix } | { ok: false; message: string }> {
  try {
    const q = new URLSearchParams({ name, count: '1', language: 'de', format: 'json' })
    const { status, json } = await getJson(`https://geocoding-api.open-meteo.com/v1/search?${q}`)
    if (status < 200 || status >= 300) return { ok: false, message: `Ort „${name}“ nicht gefunden.` }
    const first = (json.results as Array<Record<string, unknown>> | undefined)?.[0]
    if (!first) return { ok: false, message: `Ort „${name}“ nicht gefunden.` }
    const lat = Number(first.latitude)
    const lon = Number(first.longitude)
    const place = String(first.name || name)
    const admin = first.admin1 ? `, ${first.admin1}` : ''
    return { ok: true, fix: { lat, lon, place: `${place}${admin}` } }
  } catch {
    return { ok: false, message: `Ort „${name}“ nicht erreichbar.` }
  }
}

export function haversineM(a: Fix, b: { lat: number; lon: number }): number {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

export async function routeMinutes(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
): Promise<{ ok: true; minutes: number } | { ok: false; message: string }> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
    const { status, json } = await getJson(url)
    const sec = Number((json.routes as Array<{ duration?: number }> | undefined)?.[0]?.duration)
    if (status < 200 || status >= 300 || !Number.isFinite(sec)) {
      return { ok: false, message: 'Netz hat die Fahrzeit nicht geliefert.' }
    }
    return { ok: true, minutes: Math.max(1, Math.round(sec / 60)) }
  } catch {
    return { ok: false, message: 'Netz hat die Fahrzeit nicht geliefert.' }
  }
}
