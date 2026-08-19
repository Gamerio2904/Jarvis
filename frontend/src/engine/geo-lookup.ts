import { getJson } from './http-json'
import { looksLikeBareStreet } from './places-parse'
import { compactCoords } from './drive-map'

export type Fix = { lat: number; lon: number; place: string }

const STREET_FAR_M = 80_000
const UA = 'Jarvis/1.48.7 (local.jarvis.app)'

function cityAsk(street: string): string {
  return `In welcher Stadt liegt ${street}? Eine Straße ohne Ort rate ich nicht.`
}

export async function geocodePlace(
  name: string,
  near?: { lat: number; lon: number } | null,
): Promise<{ ok: true; fix: Fix } | { ok: false; message: string }> {
  const q = name.trim()
  if (!q) return { ok: false, message: 'Welcher Ort?' }
  if (looksLikeBareStreet(q)) {
    if (!near) return { ok: false, message: cityAsk(q) }
    const street = await geocodeNominatim(q, near)
    if (street.ok) {
      if (haversineM({ lat: near.lat, lon: near.lon, place: '' }, street.fix) > STREET_FAR_M) {
        return { ok: false, message: cityAsk(q) }
      }
      return street
    }
    return { ok: false, message: cityAsk(q) }
  }
  const primary = await geocodeOpenMeteo(q)
  if (primary.ok) return primary
  const fallback = await geocodeNominatim(q, near || undefined)
  if (fallback.ok) return fallback
  return primary
}

async function geocodeOpenMeteo(name: string): Promise<{ ok: true; fix: Fix } | { ok: false; message: string }> {
  try {
    const q = new URLSearchParams({ name, count: '1', language: 'de', format: 'json' })
    const { status, json } = await getJson(`https://geocoding-api.open-meteo.com/v1/search?${q}`)
    if (status < 200 || status >= 300) return { ok: false, message: `Ort „${name}“ nicht gefunden.` }
    const first = (json.results as Array<Record<string, unknown>> | undefined)?.[0]
    if (!first) return { ok: false, message: `Ort „${name}“ nicht gefunden.` }
    const lat = Number(first.latitude)
    const lon = Number(first.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { ok: false, message: `Ort „${name}“ nicht gefunden.` }
    const place = String(first.name || name)
    const admin = first.admin1 ? `, ${first.admin1}` : ''
    return { ok: true, fix: { lat, lon, place: `${place}${admin}` } }
  } catch {
    return { ok: false, message: `Ort „${name}“ nicht erreichbar.` }
  }
}

async function geocodeNominatim(
  name: string,
  near?: { lat: number; lon: number },
): Promise<{ ok: true; fix: Fix } | { ok: false; message: string }> {
  const local = await nominatimOnce(name, near, Boolean(near))
  if (local.ok) return local
  if (near) return nominatimOnce(name, near, false)
  return local
}

async function nominatimOnce(
  name: string,
  near?: { lat: number; lon: number },
  bounded?: boolean,
): Promise<{ ok: true; fix: Fix } | { ok: false; message: string }> {
  try {
    const q = new URLSearchParams({ q: name, format: 'json', limit: '5', addressdetails: '1' })
    if (near && bounded) {
      const d = 0.35
      q.set('viewbox', `${near.lon - d},${near.lat + d},${near.lon + d},${near.lat - d}`)
      q.set('bounded', '1')
    }
    const { status, json } = await getJson(`https://nominatim.openstreetmap.org/search?${q}`, {
      'Accept-Language': 'de',
      'User-Agent': UA,
    })
    const raw: unknown = json
    let rows: Array<Record<string, unknown>> = []
    if (Array.isArray(raw)) rows = raw as Array<Record<string, unknown>>
    else if (raw && typeof raw === 'object') {
      const extra = (raw as { results?: unknown }).results
      if (Array.isArray(extra)) rows = extra as Array<Record<string, unknown>>
    }
    if (status < 200 || status >= 300 || !rows.length) return { ok: false, message: `Ort „${name}“ nicht gefunden.` }
    const picked = pickNominatim(rows, name, near)
    if (!picked) return { ok: false, message: `Ort „${name}“ nicht gefunden.` }
    return { ok: true, fix: picked }
  } catch {
    return { ok: false, message: `Ort „${name}“ nicht erreichbar.` }
  }
}

function pickNominatim(
  rows: Array<Record<string, unknown>>,
  query: string,
  near?: { lat: number; lon: number },
): Fix | null {
  const fixes: Fix[] = []
  for (const row of rows) {
    const lat = Number(row.lat)
    const lon = Number(row.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    const place = String(row.display_name || query).split(',')[0]?.trim() || query
    fixes.push({ lat, lon, place })
  }
  if (!fixes.length) return null
  if (!near) return fixes[0]
  let best = fixes[0]
  let bestM = haversineM({ lat: near.lat, lon: near.lon, place: '' }, best)
  for (const f of fixes.slice(1)) {
    const d = haversineM({ lat: near.lat, lon: near.lon, place: '' }, f)
    if (d < bestM) {
      best = f
      bestM = d
    }
  }
  return best
}

export async function reversePlace(lat: number, lon: number): Promise<string | null> {
  const nom = await reverseNominatim(lat, lon)
  if (nom) return nom
  return reverseBigData(lat, lon)
}

async function reverseNominatim(lat: number, lon: number): Promise<string | null> {
  try {
    const q = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: 'json',
      addressdetails: '1',
      zoom: '18',
    })
    const { status, json } = await getJson(`https://nominatim.openstreetmap.org/reverse?${q}`, {
      'Accept-Language': 'de',
      'User-Agent': UA,
    })
    if (status < 200 || status >= 300) return null
    const addr = (json.address && typeof json.address === 'object' ? json.address : {}) as Record<string, unknown>
    const road = String(addr.road || addr.pedestrian || addr.footway || addr.residential || '').trim()
    const nr = String(addr.house_number || '').trim()
    const street = [road, nr].filter(Boolean).join(' ')
    const city = String(
      addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.city_district || '',
    ).trim()
    const bits = [street, city].filter(Boolean)
    if (bits.length) return bits.join(', ')
    const display = String(json.display_name || '').split(',').slice(0, 2).join(',').trim()
    return display || null
  } catch {
    return null
  }
}

async function reverseBigData(lat: number, lon: number): Promise<string | null> {
  try {
    const q = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      localityLanguage: 'de',
    })
    const { status, json } = await getJson(`https://api.bigdatacloud.net/data/reverse-geocode-client?${q}`)
    if (status < 200 || status >= 300) return null
    const city = String(json.city || json.locality || json.principalSubdivision || '').trim()
    return city || null
  } catch {
    return null
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

export type DriveStep = {
  lat: number
  lon: number
  type: string
  modifier: string
  name: string
  distance: number
}

export type DriveLeg = {
  minutes: number
  meters: number
  coords: Array<[number, number]>
  hint: string
  steps: DriveStep[]
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
  const urls = [
    `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=true`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=true`,
  ]
  let last = 'Netz hat die Route nicht geliefert.'
  for (const url of urls) {
    const once = await fetchRoute(url)
    if (once.ok) return once
    last = once.message
  }
  return { ok: false, message: last }
}

async function fetchRoute(
  url: string,
): Promise<({ ok: true } & DriveLeg) | { ok: false; message: string }> {
  try {
    const { status, json } = await getJson(url, {
      Accept: 'application/json',
      'User-Agent': UA,
    })
    const route = (json.routes as Array<{
      duration?: number
      distance?: number
      geometry?: { coordinates?: Array<[number, number]> }
      legs?: Array<{
        steps?: Array<{
          name?: string
          distance?: number
          maneuver?: { type?: string; modifier?: string; location?: [number, number] }
        }>
      }>
    }> | undefined)?.[0]
    const sec = Number(route?.duration)
    const rawCoords = Array.isArray(route?.geometry?.coordinates) ? route.geometry.coordinates : []
    const coords = compactCoords(
      rawCoords.filter(
        (p): p is [number, number] =>
          Array.isArray(p) && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1])),
      ),
    )
    if (status < 200 || status >= 300 || !Number.isFinite(sec) || coords.length < 2) {
      return { ok: false, message: 'Netz hat die Route nicht geliefert.' }
    }
    const rawSteps = route?.legs?.[0]?.steps || []
    const steps: DriveStep[] = rawSteps
      .map((s) => {
        const loc = s.maneuver?.location
        const lon = Number(loc?.[0])
        const lat = Number(loc?.[1])
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
        return {
          lat,
          lon,
          type: String(s.maneuver?.type || ''),
          modifier: String(s.maneuver?.modifier || ''),
          name: String(s.name || '').trim(),
          distance: Math.max(0, Math.round(Number(s.distance) || 0)),
        }
      })
      .filter((s): s is DriveStep => Boolean(s))
    const next = rawSteps.find((s) => s.maneuver?.type && s.maneuver.type !== 'depart') || rawSteps[0]
    return {
      ok: true,
      minutes: Math.max(1, Math.round(sec / 60)),
      meters: Math.max(1, Math.round(Number(route?.distance) || 0)),
      coords,
      steps,
      hint: next ? maneuverHint(next) : 'Route liegt.',
    }
  } catch {
    return { ok: false, message: 'Netz hat die Route nicht geliefert.' }
  }
}
