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
  parseHudIntent,
  type HudId,
  type HudIntent,
} from './hud-parse.ts'

export { HUD_CATALOG, parseHudIntent }
export type { HudId, HudIntent }

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
    return pack(intent.on ? 'Lage an. Querformat oder Tablet zeigt die Kacheln.' : 'Lage aus. Chat wieder voll.')
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
    const bat = await readBattery()
    snap.device = {
      clock: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      battery: bat.ok ? bat.percent : undefined,
      charging: bat.charging,
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
      current: 'temperature_2m,weather_code',
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
    const cur = json.current as { temperature_2m?: number }
    return {
      temp: Number(cur?.temperature_2m),
      label: s.last_place || 'hier',
      days,
      warn: s.last_warn_line || undefined,
    }
  } catch {
    return { temp: NaN, label: 'Wetterdienst fehlt.', days: [] }
  }
}

export async function hudSpotifyToggle(playing: boolean): Promise<void> {
  if (playing) await pauseSpotify()
  else await resumeSpotify()
}
