import { getJson } from './http-json.ts'
import { loadPlugs } from './plug.ts'
import { getDriveRoute } from './drive.ts'
import { getSpotifyNow, pauseSpotify, resumeSpotify, spotifyLoggedIn } from './spotify.ts'
import { readBattery } from '../native/device.ts'
import { listEvents, listReminders, loadSettings, persistLastList, saveSettings } from './store.ts'
import { formatDue } from './remind-parse.ts'
import { loadFen } from './chess.ts'
import type { ToolMeta } from './tools.ts'
import {
  HUD_CATALOG,
  HUD_DEFAULT_ON,
  organLabel,
  parseHudIntent,
  patchForHudView,
  type BodyOrgan,
  type HudId,
  type HudIntent,
  type HudView,
} from './hud-parse.ts'
import { nearestPlace, noCityInViewLine, resolveLookTarget, unknownPlaceLine } from './globe-geo.ts'
import { briefPlace, CITY_FLY_ZOOM, focusJson, fromPlaceFix } from './globe-brief.ts'
import { clearTour } from './globe-tour.ts'

export { HUD_CATALOG, parseHudIntent, organLabel }
export type { HudId, HudIntent, HudView, BodyOrgan }

export function loadHudModules(): HudId[] {
  try {
    const raw = loadSettings().hud_modules_json
    if (!raw) return [...HUD_DEFAULT_ON]
    const parsed = JSON.parse(raw) as string[]
    const ids = parsed.filter((id): id is HudId => HUD_CATALOG.some((c) => c.id === id))
    return ids.length ? ids : [...HUD_DEFAULT_ON]
  } catch {
    return [...HUD_DEFAULT_ON]
  }
}

export function setHudModule(id: HudId, on: boolean): HudId[] {
  const cur = loadHudModules()
  const next = on ? [...cur.filter((x) => x !== id), id] : cur.filter((x) => x !== id)
  const ordered = HUD_CATALOG.map((c) => c.id).filter((x) => next.includes(x))
  saveSettings({ hud_modules_json: JSON.stringify(ordered) })
  persistLastList('hud', ordered.map((x) => HUD_CATALOG.find((c) => c.id === x)?.label || x))
  return ordered
}

export async function handleHud(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseHudIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'lage') {
    saveSettings({ hud_force: intent.on, hud_hidden: !intent.on })
    return pack(intent.on ? 'Lage an.' : 'Lage aus. Chat wieder voll.')
  }
  if (intent.kind === 'accent') {
    saveSettings({ hud_accent: intent.amber ? 'amber' : 'green' })
    return pack(intent.amber ? 'Lage-Akzent orange. Default bleibt Grün, wenn Sie aus sagen.' : 'Lage-Akzent wieder Grün.')
  }
  if (intent.kind === 'list') {
    const on = loadHudModules()
    persistLastList(
      'hud',
      HUD_CATALOG.map((c) => c.label),
    )
    const line = HUD_CATALOG.map((c) => `${c.label}${on.includes(c.id) ? ' an' : ' aus'}`).join(', ')
    return pack(`Kacheln: ${line}.`)
  }
  if (intent.kind === 'view') {
    saveSettings(patchForHudView(intent.view))
    if (intent.view === 'tiles') clearTour()
    if (intent.view === 'body') return pack('Körper an. Schema in der Lage, Chat bleibt. Antippen startet kein Tool.')
    if (intent.view === 'globe') return pack('Kugel an. Erde in der Lage. Kein Live-Satellitenvideo.')
    return pack('Kugel aus. Lage zu, Chat wieder voll.')
  }
  if (intent.kind === 'organ') {
    saveSettings({
      hud_view: 'body',
      hud_force: true,
      hud_hidden: false,
      last_body_organ: intent.id,
    })
    return pack(`${organLabel(intent.id)} in der Lage. Kein Tool gestartet.`)
  }
  if (intent.kind === 'unknown_place') {
    saveSettings({ hud_view: 'globe', hud_force: true, hud_hidden: false })
    return pack(unknownPlaceLine(intent.asked))
  }
  if (intent.kind === 'look') {
    saveSettings({ hud_view: 'globe', hud_force: true, hud_hidden: false })
    const s = loadSettings()
    const at = resolveLookTarget(s.last_globe_look || '', s.last_globe_focus || '')
    const lat = at?.lat ?? NaN
    const lon = at?.lon ?? NaN
    const hit = nearestPlace(lat, lon)
    if (hit) {
      const cached = (s.last_globe_brief || '').trim()
      if (cached.toLowerCase().includes(hit.name.toLowerCase())) {
        return pack(cached)
      }
      const reply = await briefPlace(fromPlaceFix(hit))
      saveSettings({ last_globe_brief: reply.slice(0, 500) })
      return pack(reply)
    }
    return pack(noCityInViewLine())
  }
  if (intent.kind === 'pin') {
    clearTour()
    const place = { name: intent.name, lat: intent.lat, lon: intent.lon, blurb: intent.blurb }
    saveSettings({
      hud_view: 'globe',
      hud_force: true,
      hud_hidden: false,
      last_globe_focus: focusJson(place, CITY_FLY_ZOOM),
      last_globe_look: JSON.stringify({ lat: intent.lat, lon: intent.lon, zoom: CITY_FLY_ZOOM }),
    })
    const reply = await briefPlace(place)
    saveSettings({ last_globe_brief: reply.slice(0, 500) })
    return pack(reply)
  }
  const next = setHudModule(intent.id, intent.on)
  const label = HUD_CATALOG.find((c) => c.id === intent.id)?.label || intent.id
  return pack(intent.on ? `${label} an.` : `${label} aus.`, next)
}

function pack(reply: string, ids?: HudId[]) {
  return {
    handled: true,
    reply,
    tool: { tool_status: 'executed' as const, tool: 'hud', action: 'layout', label: 'Lage', preview: (ids || loadHudModules()).join(',') },
    lastTool: 'hud',
  }
}

export type HudSnap = {
  weather?: { temp: number; label: string; days: Array<{ d: string; max: number; min: number; rain: number }>; warn?: string }
  spotify?: { title: string; artist: string; playing: boolean; loggedIn: boolean }
  device?: { clock: string; battery?: number; charging?: boolean }
  brief?: { line: string }
  plugs?: { names: string[] }
  tv?: { name: string; on: boolean }
  news?: { line: string }
  drive?: { dest: string; minutes: number; meters: number } | null
  warn?: { line: string }
  fx?: { line: string }
  sport?: { line: string }
  chess?: { fen: string }
  trace?: { host: string; hops: string[] }
  world?: { line: string }
}

let weatherAt = 0
let weatherCache: HudSnap['weather'] | undefined
let batteryAt = 0
let batteryCache: HudSnap['device'] | undefined

export async function fetchHudSnap(): Promise<HudSnap> {
  const s = loadSettings()
  const on = loadHudModules()
  const snap: HudSnap = {}
  if (on.includes('weather')) snap.weather = await weekWeather()
  if (on.includes('spotify')) {
    const now = getSpotifyNow()
    snap.spotify = {
      title: now?.name || '',
      artist: now?.artist || '',
      playing: Boolean(now?.playing),
      loggedIn: spotifyLoggedIn(s),
    }
  }
  if (on.includes('device')) {
    const now = Date.now()
    if (!batteryCache || now - batteryAt > 60_000) {
      batteryAt = now
      const bat = await readBattery()
      batteryCache = {
        clock: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        battery: bat.ok ? bat.percent : undefined,
        charging: bat.charging,
      }
    }
    snap.device = {
      ...batteryCache,
      clock: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }
  }
  if (on.includes('brief')) snap.brief = { line: await briefLine() }
  if (on.includes('plugs')) snap.plugs = { names: loadPlugs().map((p) => p.name) }
  if (on.includes('tv')) snap.tv = { name: s.tv_name || 'Fernseher', on: Boolean(s.tv_enabled && s.tv_paired) }
  if (on.includes('news')) snap.news = { line: s.last_news_line || 'Nachrichten im Chat fragen.' }
  if (on.includes('drive')) {
    const r = getDriveRoute()
    snap.drive = r ? { dest: r.dest, minutes: r.minutes, meters: r.meters } : null
  }
  if (on.includes('warn')) snap.warn = { line: s.last_warn_line || 'Unwetter im Chat fragen.' }
  if (on.includes('fx')) snap.fx = { line: s.last_fx_line || 'Kurs im Chat fragen.' }
  if (on.includes('sport')) snap.sport = { line: s.last_sport_line || 'Sport im Chat fragen.' }
  if (on.includes('chess')) snap.chess = { fen: loadFen() }
  if (on.includes('trace')) {
    let hops: string[] = []
    try {
      hops = s.last_hops_json ? (JSON.parse(s.last_hops_json) as string[]) : []
    } catch {
      hops = []
    }
    snap.trace = { host: s.last_trace_host || '', hops }
  }
  if (on.includes('world')) snap.world = { line: s.last_outlook_line || 'Weltlage im Chat fragen.' }
  return snap
}

async function briefLine(): Promise<string> {
  const now = Date.now()
  const ev = (await listEvents())
    .filter((e) => new Date(e.start_at).getTime() >= now - 60_000)
    .sort((a, b) => (a.start_at < b.start_at ? -1 : 1))[0]
  if (ev) return `${ev.title} · ${formatDue(new Date(ev.start_at))}`
  const rem = (await listReminders())
    .filter((r) => r.status === 'open' && r.kind !== 'timer')
    .sort((a, b) => (a.due_at < b.due_at ? -1 : 1))[0]
  if (rem) return `${rem.title} · ${formatDue(new Date(rem.due_at))}`
  return 'Nichts geplant.'
}

async function weekWeather(): Promise<HudSnap['weather']> {
  const now = Date.now()
  if (weatherCache && now - weatherAt < 10 * 60_000) return weatherCache
  const s = loadSettings()
  const lat = Number(s.last_lat)
  const lon = Number(s.last_lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { temp: NaN, label: s.last_weather_line || 'Ort einmal erlauben.', days: [] }
  }
  try {
    const q = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: 'temperature_2m,weather_code,rain',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      forecast_days: '7',
      timezone: 'auto',
    })
    const { status, json } = await getJson(`https://api.open-meteo.com/v1/forecast?${q}`)
    if (status < 200 || status >= 300) return { temp: NaN, label: 'Wetterdienst fehlt.', days: [] }
    const daily = json.daily as {
      time?: string[]
      temperature_2m_max?: number[]
      temperature_2m_min?: number[]
      precipitation_probability_max?: number[]
    }
    const days = (daily.time || []).map((d, i) => ({
      d: d.slice(5),
      max: Number(daily.temperature_2m_max?.[i]),
      min: Number(daily.temperature_2m_min?.[i]),
      rain: Number(daily.precipitation_probability_max?.[i] || 0),
    }))
    const cur = json.current as { temperature_2m?: number; rain?: number }
    const rainNow = Number(cur?.rain || 0)
    weatherAt = now
    weatherCache = {
      temp: Number(cur?.temperature_2m),
      label: rainNow > 0 ? `${s.last_place || 'hier'} · Regen` : s.last_place || 'hier',
      days,
      warn: s.last_warn_line || undefined,
    }
    return weatherCache
  } catch {
    return { temp: NaN, label: 'Wetterdienst fehlt.', days: [] }
  }
}

export async function hudSpotifyToggle(playing: boolean): Promise<void> {
  if (playing) await pauseSpotify()
  else await resumeSpotify()
}
