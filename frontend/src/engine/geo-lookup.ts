import { getJson } from './http-json.ts'
import { looksLikeAddress, looksLikeBareStreet } from './places-parse.ts'
import { asLonLat, compactCoords, decodePolyline, isRoadTrack, simplifyTrack } from './drive-map.ts'
import { loadSettings } from './store.ts'

export type Fix = { lat: number; lon: number; place: string }

const STREET_FAR_M = 80_000
const UA = 'Jarvis/2.1.0 (local.jarvis.app)'
const DACH = { latMin: 47.2, latMax: 55.2, lonMin: 5.7, lonMax: 15.2 }

function cityAsk(street: string): string {
  return `In welcher Stadt liegt ${street}? Eine Straße ohne Ort rate ich nicht.`
}

function lastNear(near?: { lat: number; lon: number } | null): { lat: number; lon: number } | undefined {
  if (near && Number.isFinite(near.lat) && Number.isFinite(near.lon) && Math.abs(near.lat) > 0.2) return near
  const s = loadSettings()
  const lat = Number(s.last_lat)
  const lon = Number(s.last_lon)
  if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) > 0.2) return { lat, lon }
  return undefined
}

function rewriteGeoQuery(q: string): string {
  const s = loadSettings()
  const homeish = `${s.last_place || ''} ${s.home_lat ? 'home' : ''}`
  if (/\bingersheim\b/i.test(homeish) || /\bkehrsbach/i.test(q)) {
    return q.replace(/\bingelheim\b/gi, 'Ingersheim')
  }
  return q
}

export async function geocodePlace(
  name: string,
  near?: { lat: number; lon: number } | null,
): Promise<{ ok: true; fix: Fix } | { ok: false; message: string }> {
  const q = rewriteGeoQuery(name.trim())
  const around = lastNear(near)
  if (!q) return { ok: false, message: 'Welcher Ort?' }
  if (looksLikeBareStreet(q)) {
    if (!around) return { ok: false, message: cityAsk(q) }
    const street = await geocodeNominatim(q, around)
    if (street.ok) {
      if (haversineM({ lat: around.lat, lon: around.lon, place: '' }, street.fix) > STREET_FAR_M) {
        return { ok: false, message: cityAsk(q) }
      }
      return street
    }
    return { ok: false, message: cityAsk(q) }
  }
  if (looksLikeAddress(q)) {
    const addr = await geocodeNominatim(q, around)
    if (addr.ok) return addr
  }
  const primary = await geocodeOpenMeteo(q, around)
  if (primary.ok) {
    if (around) {
      const far = haversineM({ lat: around.lat, lon: around.lon, place: '' }, primary.fix)
      if (far > 40_000) {
        const fallback = await geocodeNominatim(q, around)
        if (fallback.ok) {
          const local = haversineM({ lat: around.lat, lon: around.lon, place: '' }, fallback.fix)
          if (local + 2_000 < far) return fallback
        }
      }
    }
    return primary
  }
  const fallback = await geocodeNominatim(q, around)
  if (fallback.ok) return fallback
  return primary
}

function inDach(lat: number, lon: number): boolean {
  return lat >= DACH.latMin && lat <= DACH.latMax && lon >= DACH.lonMin && lon <= DACH.lonMax
}

function placeLabel(name: string, admin?: string, country?: string): string {
  const bits = [name.trim()]
  if (admin && !name.toLowerCase().includes(admin.toLowerCase())) bits.push(admin.trim())
  if (country && country !== 'Deutschland' && country !== 'DE') bits.push(country)
  return bits.filter(Boolean).join(', ')
}

/** Nächster Treffer zum GPS, sonst DE vor FR — Ingersheim BW statt Grand Est. Exakter Name vor Münchenstein. */
export function pickGeoHits(
  rows: Array<{ lat: number; lon: number; place: string; country?: string; name?: string; population?: number }>,
  near?: { lat: number; lon: number },
  want?: string,
): Fix | null {
  const fixes = rows.filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon))
  if (!fixes.length) return null
  const qn = (want || '').trim().toLowerCase()
  let best = fixes[0]
  let bestScore = -Infinity
  for (const f of fixes) {
    let s = 0
    const label = (f.name || f.place.split(',')[0] || '').trim().toLowerCase()
    if (qn) {
      if (label === qn) s += 1_000_000
      else if (label.startsWith(qn) && label.length >= qn.length + 3) s -= 500_000
      else if (label.includes(qn)) s += 80_000
    }
    const c = (f.country || '').toUpperCase()
    if (c === 'DE' || c === 'DEU' || c === 'GERMANY' || /deutschland/i.test(f.place)) s += 80_000
    else if (c === 'FR' || c === 'CH' || c === 'CHE') s -= 25_000
    if (f.population && f.population > 0) s += Math.min(180_000, Math.log10(f.population + 10) * 30_000)
    if (near && Number.isFinite(near.lat) && Number.isFinite(near.lon)) {
      s -= haversineM({ lat: near.lat, lon: near.lon, place: '' }, f) / 80
    }
    if (s > bestScore) {
      best = f
      bestScore = s
    }
  }
  return { lat: best.lat, lon: best.lon, place: best.place }
}

async function geocodeOpenMeteo(
  name: string,
  near?: { lat: number; lon: number },
): Promise<{ ok: true; fix: Fix } | { ok: false; message: string }> {
  try {
    const q = new URLSearchParams({ name, count: '8', language: 'de', format: 'json' })
    const { status, json } = await getJson(`https://geocoding-api.open-meteo.com/v1/search?${q}`)
    if (status < 200 || status >= 300) return { ok: false, message: `Ort „${name}“ nicht gefunden.` }
    const raw = (json.results as Array<Record<string, unknown>> | undefined) || []
    const rows = raw.map((row) => {
      const lat = Number(row.latitude)
      const lon = Number(row.longitude)
      const name = String(row.name || name)
      const place = placeLabel(name, String(row.admin1 || ''), String(row.country || ''))
      return {
        lat,
        lon,
        place,
        country: String(row.country_code || row.country || ''),
        name,
        population: Number(row.population) || 0,
      }
    })
    const picked = pickGeoHits(rows, near, name)
    if (!picked) return { ok: false, message: `Ort „${name}“ nicht gefunden.` }
    return { ok: true, fix: picked }
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
    const q = new URLSearchParams({ q: name, format: 'json', limit: '8', addressdetails: '1' })
    if (near && inDach(near.lat, near.lon)) q.set('countrycodes', 'de')
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
    const mapped = rows.flatMap((row) => {
      const lat = Number(row.lat)
      const lon = Number(row.lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return []
      const addr = (row.address && typeof row.address === 'object' ? row.address : {}) as Record<string, unknown>
      const city = String(addr.city || addr.town || addr.village || addr.municipality || row.display_name || name)
        .split(',')[0]
        .trim()
      const country = String(addr.country_code || addr.country || '')
      return [{ lat, lon, place: city || name, country, name: city || name }]
    })
    const picked = pickGeoHits(mapped, near, name) || pickNominatim(rows, name, near)
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
  exit?: number
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

function osrmUrl(
  host: string,
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  geometry: 'polyline' | 'geojson',
): string {
  const path = `${from.lon},${from.lat};${to.lon},${to.lat}`
  return `${host}/route/v1/driving/${path}?overview=full&geometries=${geometry}&steps=true&radiuses=80;80`
}

export async function routeDrive(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
): Promise<({ ok: true } & DriveLeg) | { ok: false; message: string }> {
  const hosts = ['https://router.project-osrm.org', 'https://routing.openstreetmap.de/routed-car']
  const urls = hosts.flatMap((host) => [
    osrmUrl(host, from, to, 'polyline'),
    osrmUrl(host, from, to, 'geojson'),
  ])
  return await new Promise((resolve) => {
    let left = urls.length
    let last = 'Netz hat die Route nicht geliefert.'
    let done = false
    for (const url of urls) {
      void fetchRoute(url, to)
        .catch(() => ({ ok: false as const, message: last }))
        .then((once) => {
          if (done) return
          if (once.ok) {
            done = true
            resolve(once)
            return
          }
          last = once.message
          left -= 1
          if (left <= 0) resolve({ ok: false, message: last })
        })
    }
  })
}

function readGeometry(geometry: unknown): Array<[number, number]> {
  if (typeof geometry === 'string' && geometry.length > 4) return decodePolyline(geometry)
  if (geometry && typeof geometry === 'object') {
    const coords = (geometry as { coordinates?: unknown }).coordinates
    if (Array.isArray(coords)) {
      const out: Array<[number, number]> = []
      for (const row of coords) {
        const pair = asLonLat(row)
        if (pair) out.push(pair)
      }
      return out
    }
  }
  return []
}

function pinTail(coords: Array<[number, number]>, dest: { lat: number; lon: number }): Array<[number, number]> {
  if (!coords.length) return coords
  const last = coords[coords.length - 1]
  const d = haversineM({ lat: last[1], lon: last[0], place: '' }, dest)
  if (d > 25 && d < 120) return [...coords, [dest.lon, dest.lat]]
  return coords
}

async function fetchRoute(
  url: string,
  dest: { lat: number; lon: number },
): Promise<({ ok: true } & DriveLeg) | { ok: false; message: string }> {
  try {
    const { status, json } = await getJson(url, {
      Accept: 'application/json',
      'User-Agent': UA,
    })
    const route = (
      json.routes as Array<{
        duration?: number
        distance?: number
        geometry?: unknown
        legs?: Array<{
          steps?: Array<{
            name?: string
            distance?: number
            maneuver?: { type?: string; modifier?: string; location?: [number, number]; exit?: number }
          }>
        }>
      }> | undefined
    )?.[0]
    const sec = Number(route?.duration)
    const meters = Math.max(0, Math.round(Number(route?.distance) || 0))
    const coords = compactCoords(simplifyTrack(pinTail(readGeometry(route?.geometry), dest)))
    if (status < 200 || status >= 300 || !Number.isFinite(sec) || !isRoadTrack(coords, meters)) {
      return { ok: false, message: 'Netz hat die Route nicht geliefert.' }
    }
    const rawSteps = route?.legs?.[0]?.steps || []
    const steps: DriveStep[] = rawSteps
      .map((s) => {
        const loc = asLonLat(s.maneuver?.location)
        if (!loc) return null
        const step: DriveStep = {
          lon: loc[0],
          lat: loc[1],
          type: String(s.maneuver?.type || ''),
          modifier: String(s.maneuver?.modifier || ''),
          name: String(s.name || '').trim(),
          distance: Math.max(0, Math.round(Number(s.distance) || 0)),
        }
        const exitN = Number(s.maneuver?.exit)
        if (Number.isFinite(exitN) && exitN >= 1) step.exit = Math.round(exitN)
        return step
      })
      .filter((s): s is DriveStep => Boolean(s))
    const next = rawSteps.find((s) => s.maneuver?.type && s.maneuver.type !== 'depart') || rawSteps[0]
    return {
      ok: true,
      minutes: Math.max(1, Math.round(sec / 60)),
      meters: Math.max(1, meters),
      coords,
      steps,
      hint: next ? maneuverHint(next) : 'Route liegt.',
    }
  } catch {
    return { ok: false, message: 'Netz hat die Route nicht geliefert.' }
  }
}
