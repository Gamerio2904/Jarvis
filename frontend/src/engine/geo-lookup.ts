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
  const full = await routeDrive(from, to)
  if (!full.ok) return full
  return { ok: true, minutes: full.minutes }
}

export type DriveLeg = {
  minutes: number
  meters: number
  coords: Array<[number, number]>
  hint: string
}

function maneuverHint(step: {
  name?: string
  maneuver?: { type?: string; modifier?: string }
}): string {
  const name = (step.name || '').trim()
  const type = step.maneuver?.type || ''
  const mod = step.maneuver?.modifier || ''
  if (type === 'arrive' || type === 'notification') return name ? `Ziel: ${name}` : 'Ziel.'
  if (mod.includes('left')) return name ? `Links — ${name}` : 'Links abbiegen.'
  if (mod.includes('right')) return name ? `Rechts — ${name}` : 'Rechts abbiegen.'
  if (mod.includes('uturn')) return 'Wenden.'
  if (type === 'depart') return name ? `Los über ${name}` : 'Los.'
  return name ? `Weiter auf ${name}` : 'Geradeaus.'
}

export async function routeDrive(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
): Promise<({ ok: true } & DriveLeg) | { ok: false; message: string }> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}` +
      `?overview=full&geometries=geojson&steps=true`
    const { status, json } = await getJson(url)
    const route = (json.routes as Array<{
      duration?: number
      distance?: number
      geometry?: { coordinates?: Array<[number, number]> }
      legs?: Array<{ steps?: Array<{ name?: string; maneuver?: { type?: string; modifier?: string } }> }>
    }> | undefined)?.[0]
    const sec = Number(route?.duration)
    const coords = route?.geometry?.coordinates || []
    if (status < 200 || status >= 300 || !Number.isFinite(sec) || coords.length < 2) {
      return { ok: false, message: 'Netz hat die Route nicht geliefert.' }
    }
    const steps = route?.legs?.[0]?.steps || []
    const next = steps.find((s) => s.maneuver?.type && s.maneuver.type !== 'depart') || steps[0]
    return {
      ok: true,
      minutes: Math.max(1, Math.round(sec / 60)),
      meters: Math.max(1, Math.round(Number(route?.distance) || 0)),
      coords,
      hint: next ? maneuverHint(next) : 'Route liegt.',
    }
  } catch {
    return { ok: false, message: 'Netz hat die Route nicht geliefert.' }
  }
}
