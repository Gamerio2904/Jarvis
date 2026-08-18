import { readDeviceLocation, requestLocationPermission, hasLocationPermission } from '../native/geo'
import { completeGemini, geminiReady } from './gemini'
import { geocodePlace, reversePlace } from './geo-lookup'
import { getJson } from './http-json'
import type { ResearchMeta, ResearchSource } from './research-parse'
import { syncGlance } from './glance'
import { loadSettings, saveSettings } from './store'
import type { ToolMeta } from './tools'
import { formatWeatherBrief, wmoLabel, type WeatherDay, type WeatherSnapshot } from './weather-brief'
import { parseWeatherFollowup, parseWeatherIntent, type WeatherLast } from './weather-parse'

export { parseWeatherIntent } from './weather-parse'
export { formatWeatherBrief } from './weather-brief'

type Fix = { lat: number; lon: number; place: string }

export async function handleWeather(
  content: string,
): Promise<{ handled: boolean; reply?: string; research?: ResearchMeta; tool?: ToolMeta }> {
  const last = readLastWeather()
  const intent = parseWeatherFollowup(content, last) || parseWeatherIntent(content)
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
  const research: ResearchMeta = {
    used: true,
    status: 'ok',
    status_label: 'Wetter · Quelle',
    query: `Wetter ${fix.fix.place}`,
    sources: [source],
    privacy_note: 'Lage über Open-Meteo, kein Raten.',
  }

  const reply = formatWeatherBrief(snapshot, intent.when, intent.focus)
  rememberWeather(intent, reply, fix.fix.place)
  await syncGlance()
  return {
    handled: true,
    reply,
    research,
    tool: { tool_status: 'executed', tool: 'weather', action: intent.when, label: 'Wetter' },
  }
}

function readLastWeather(): WeatherLast | null {
  const s = loadSettings()
  if (!s.last_weather_kind) return null
  if (s.last_weather_kind === 'place' && s.last_weather_place) {
    return {
      kind: 'place',
      place: s.last_weather_place,
      when: (s.last_weather_when as WeatherLast['when']) || 'now',
      focus: (s.last_weather_focus as WeatherLast['focus']) || 'general',
    }
  }
  return {
    kind: 'here',
    when: (s.last_weather_when as WeatherLast['when']) || 'now',
    focus: (s.last_weather_focus as WeatherLast['focus']) || 'general',
  }
}

function rememberWeather(
  intent: { kind: 'here' | 'place'; place?: string; when: string; focus: string },
  line: string,
  place: string,
) {
  saveSettings({
    last_weather_kind: intent.kind,
    last_weather_place: intent.kind === 'place' ? intent.place || place : place,
    last_weather_when: intent.when,
    last_weather_focus: intent.focus,
    last_weather_line: line.slice(0, 80),
  })
}

async function resolveHere(): Promise<{ ok: true; fix: Fix } | { ok: false; message: string }> {
  const s = loadSettings()
  const granted = await hasLocationPermission()
  const cached = granted ? readCachedFix(s) : null
  if (cached) return { ok: true, fix: cached }

  if (!granted) {
    await requestLocationPermission()
  }
  const loc = await readDeviceLocation()
  if (!loc.ok || loc.lat == null || loc.lon == null) {
    return {
      ok: false,
      message:
        loc.message ||
        'Standort einmal erlauben. Sagen Sie „aktivieren“, dann kommt die Android-Abfrage. Oder „Wetter in …“. Ich rate nicht.',
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

async function fetchOpenMeteo(fix: Fix): Promise<WeatherSnapshot | null> {
  try {
    const q = new URLSearchParams({
      latitude: String(fix.lat),
      longitude: String(fix.lon),
      current: 'temperature_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m',
      hourly: 'precipitation_probability',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      forecast_days: '7',
      timezone: 'auto',
    })
    const { status, json } = await getJson(`https://api.open-meteo.com/v1/forecast?${q}`)
    if (status < 200 || status >= 300) return null
    return snapshotFrom(json, fix.place)
  } catch {
    return null
  }
}

export function snapshotFrom(json: Record<string, unknown>, place: string): WeatherSnapshot | null {
  const current = json.current as Record<string, unknown> | undefined
  const temp = Number(current?.temperature_2m)
  const code = Number(current?.weather_code)
  if (!Number.isFinite(temp)) return null
  const feelsRaw = Number(current?.apparent_temperature)
  const windRaw = Number(current?.wind_speed_10m)
  const precipRaw = Number(current?.precipitation)
  const days = readDays(json)
  const soon = readSoon(json, String(current?.time || ''))
  return {
    place,
    temp: Math.round(temp),
    feels: Number.isFinite(feelsRaw) ? Math.round(feelsRaw) : null,
    label: wmoLabel(Number.isFinite(code) ? code : -1),
    code: Number.isFinite(code) ? code : -1,
    wind: Number.isFinite(windRaw) ? Math.round(windRaw) : null,
    precipNow: Number.isFinite(precipRaw) ? precipRaw : null,
    today: days.today,
    tomorrow: days.tomorrow,
    saturday: days.saturday,
    sunday: days.sunday,
    rainSoon: soon.rainSoon,
    maxPrecipSoon: soon.maxPrecipSoon,
  }
}

function readDays(json: Record<string, unknown>): {
  today: WeatherDay | null
  tomorrow: WeatherDay | null
  saturday: WeatherDay | null
  sunday: WeatherDay | null
} {
  const daily = json.daily as Record<string, unknown> | undefined
  const times = (daily?.time as string[] | undefined) || []
  const maxs = (daily?.temperature_2m_max as number[] | undefined) || []
  const mins = (daily?.temperature_2m_min as number[] | undefined) || []
  const probs = (daily?.precipitation_probability_max as number[] | undefined) || []
  const codes = (daily?.weather_code as number[] | undefined) || []
  let today: WeatherDay | null = null
  let tomorrow: WeatherDay | null = null
  let saturday: WeatherDay | null = null
  let sunday: WeatherDay | null = null
  for (let i = 0; i < times.length; i += 1) {
    const date = times[i]
    const max = Number(maxs[i])
    const min = Number(mins[i])
    if (!date || !Number.isFinite(max) || !Number.isFinite(min)) continue
    const prob = Number(probs[i])
    const day: WeatherDay = {
      date,
      min: Math.round(min),
      max: Math.round(max),
      precipProb: Number.isFinite(prob) ? Math.round(prob) : null,
      label: wmoLabel(Number(codes[i])),
    }
    const wd = weekdayUtc(date)
    if (i === 0) today = day
    if (i === 1) tomorrow = day
    if (wd === 6 && !saturday) saturday = day
    if (wd === 0 && !sunday) sunday = day
  }
  return { today, tomorrow, saturday, sunday }
}

function weekdayUtc(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map((n) => Number(n))
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).getUTCDay()
}

function readSoon(
  json: Record<string, unknown>,
  currentTime: string,
): { rainSoon: boolean; maxPrecipSoon: number | null } {
  const hourly = json.hourly as Record<string, unknown> | undefined
  const times = (hourly?.time as string[] | undefined) || []
  const probs = (hourly?.precipitation_probability as number[] | undefined) || []
  let start = times.findIndex((t) => t === currentTime)
  if (start < 0) start = 0
  let max = -1
  for (let i = start; i < times.length && i < start + 7; i += 1) {
    const p = Number(probs[i])
    if (Number.isFinite(p) && p > max) max = p
  }
  if (max < 0) return { rainSoon: false, maxPrecipSoon: null }
  return { rainSoon: max >= 45, maxPrecipSoon: Math.round(max) }
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
