import { readDeviceLocation, requestLocationPermission } from '../native/geo'
import { completeGemini, geminiReady } from './gemini'
import { getJson } from './http-json'
import type { ResearchMeta, ResearchSource } from './research-parse'
import { loadSettings, saveSettings } from './store'
import type { ToolMeta } from './tools'
import { parseWeatherIntent } from './weather-parse'

export { parseWeatherIntent } from './weather-parse'

const WMO: Record<number, string> = {
  0: 'klar',
  1: 'überwiegend klar',
  2: 'wolkig',
  3: 'bedeckt',
  45: 'Nebel',
  48: 'Nebel',
  51: 'Niesel',
  53: 'Niesel',
  55: 'Niesel',
  61: 'leichter Regen',
  63: 'Regen',
  65: 'starker Regen',
  71: 'leichter Schnee',
  73: 'Schnee',
  75: 'starker Schnee',
  80: 'Schauer',
  81: 'Schauer',
  82: 'starke Schauer',
  95: 'Gewitter',
  96: 'Gewitter',
  99: 'Gewitter',
}

function wmoLabel(code: number): string {
  return WMO[code] || 'wechselhaft'
}

type Fix = { lat: number; lon: number; place: string }

export async function handleWeather(
  content: string,
): Promise<{ handled: boolean; reply?: string; research?: ResearchMeta; tool?: ToolMeta }> {
  const intent = parseWeatherIntent(content)
  if (!intent) return { handled: false }

  const fix =
    intent.kind === 'place' ? await geocodePlace(intent.place) : await resolveHere()
  if (!fix.ok) {
    return {
      handled: true,
      reply: fix.message,
      tool: { tool_status: 'error', tool: 'weather', action: 'locate', label: 'Kein Ort' },
    }
  }

  const snapshot = await fetchOpenMeteo(fix.fix)
  if (!snapshot) {
    const s = loadSettings()
    if (s.research_opt_in && geminiReady()) {
      return geminiWeather(content, fix.fix)
    }
    return {
      handled: true,
      reply: 'Wetterdienst nicht erreichbar. Ich rate nicht.',
      tool: { tool_status: 'error', tool: 'weather', action: 'fetch', label: 'Wetter fehlt' },
    }
  }

  const source: ResearchSource = {
    title: 'Open-Meteo',
    url: 'https://open-meteo.com/',
    snippet: `${snapshot.temp} °C, ${snapshot.label}`,
    provider: 'open-meteo',
    retrieved_at: new Date().toISOString(),
  }
  let research: ResearchMeta = {
    used: true,
    status: 'ok',
    status_label: 'Wetter · Quelle',
    query: `Wetter ${fix.fix.place}`,
    sources: [source],
    privacy_note: 'Lage über Open-Meteo, kein Raten.',
  }

  const s = loadSettings()
  if (s.research_opt_in && geminiReady()) {
    try {
      const extra = await completeGemini(
        [
          {
            role: 'user',
            content: `Kurzer Wetterlage-Satz für ${fix.fix.place}. Zahlen nur wenn sicher. Eine Zeile.`,
          },
        ],
        undefined,
        { search: true },
      )
      if (extra.research?.sources?.length) {
        research = {
          ...research,
          sources: [...(research.sources || []), ...extra.research.sources],
          query: extra.research.query || research.query,
        }
      }
    } catch {
      /* Open-Meteo reicht */
    }
  }

  return {
    handled: true,
    reply: `${fix.fix.place}: ${snapshot.temp} °C, ${snapshot.label}. Quelle: Open-Meteo.`,
    research,
    tool: { tool_status: 'executed', tool: 'weather', action: 'now', label: 'Wetter' },
  }
}

async function resolveHere(): Promise<{ ok: true; fix: Fix } | { ok: false; message: string }> {
  const s = loadSettings()
  const cached = readCachedFix(s)
  if (cached) return { ok: true, fix: cached }

  await requestLocationPermission()
  const loc = await readDeviceLocation()
  if (!loc.ok || loc.lat == null || loc.lon == null) {
    return {
      ok: false,
      message:
        loc.message ||
        'Standort einmal erlauben — dann sage ich das Wetter hier, ohne Ortsname. Oder „Wetter in …“.',
    }
  }
  const place = (await reversePlace(loc.lat, loc.lon)) || 'hier'
  const fix = { lat: loc.lat, lon: loc.lon, place }
  saveSettings({
    last_lat: String(loc.lat),
    last_lon: String(loc.lon),
    last_place: place,
    last_fix_at: new Date().toISOString(),
  })
  return { ok: true, fix }
}

function readCachedFix(s: ReturnType<typeof loadSettings>): Fix | null {
  const lat = Number(s.last_lat)
  const lon = Number(s.last_lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const at = Date.parse(s.last_fix_at || '')
  if (!Number.isFinite(at) || Date.now() - at > 2 * 3_600_000) return null
  return { lat, lon, place: s.last_place || 'hier' }
}

async function geocodePlace(name: string): Promise<{ ok: true; fix: Fix } | { ok: false; message: string }> {
  try {
    const q = new URLSearchParams({
      name,
      count: '1',
      language: 'de',
      format: 'json',
    })
    const { status, json } = await getJson(`https://geocoding-api.open-meteo.com/v1/search?${q}`)
    if (status < 200 || status >= 300) {
      return { ok: false, message: `Ort „${name}“ nicht gefunden.` }
    }
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

async function reversePlace(lat: number, lon: number): Promise<string | null> {
  try {
    const q = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      localityLanguage: 'de',
    })
    const { status, json } = await getJson(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${q}`,
    )
    if (status < 200 || status >= 300) return null
    const city = String(json.city || json.locality || json.principalSubdivision || '').trim()
    return city || null
  } catch {
    return null
  }
}

async function fetchOpenMeteo(fix: Fix): Promise<{ temp: number; label: string } | null> {
  try {
    const q = new URLSearchParams({
      latitude: String(fix.lat),
      longitude: String(fix.lon),
      current: 'temperature_2m,weather_code',
      timezone: 'auto',
    })
    const { status, json } = await getJson(`https://api.open-meteo.com/v1/forecast?${q}`)
    if (status < 200 || status >= 300) return null
    const current = json.current as Record<string, unknown> | undefined
    const temp = Number(current?.temperature_2m)
    const code = Number(current?.weather_code)
    if (!Number.isFinite(temp)) return null
    return { temp: Math.round(temp), label: wmoLabel(Number.isFinite(code) ? code : -1) }
  } catch {
    return null
  }
}

async function geminiWeather(
  content: string,
  fix: Fix,
): Promise<{ handled: boolean; reply?: string; research?: ResearchMeta; tool?: ToolMeta }> {
  const { text, research } = await completeGemini(
    [
      {
        role: 'user',
        content: `${content}\nOrt: ${fix.place} (${fix.lat.toFixed(2)}, ${fix.lon.toFixed(2)}). Nur belegte Lage, Quellen.`,
      },
    ],
    undefined,
    { search: true },
  )
  return {
    handled: true,
    reply: text,
    research,
    tool: { tool_status: 'executed', tool: 'weather', action: 'search', label: 'Wetter' },
  }
}
