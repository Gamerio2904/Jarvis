import { parseDriveIntent, type DriveTab } from './drive-parse'
import { isFuelPlace } from './fuel-parse'
import { handleSpotifyCommand, parseSpotifyIntent } from './spotify'
import { geocodePlace, haversineM, routeDrive, type DriveStep } from './geo-lookup'
import { compactCoords, isRoadTrack, simplifyTrack } from './drive-map'
import { displayPlaceName, isHomeName, isRelationName, normalizePlaceName, parsePlaceNav } from './places-parse'
import { readDeviceLocation, requestLocationPermission } from '../native/geo'
import { listMemory, loadSettings, saveSettings } from './store'
import type { ToolMeta } from './tools'
import {
  formatNavBanner,
  formatNavCue,
  navPhase,
  nextManeuver,
  type NavStep,
} from './nav-speak'

export { parseDriveIntent } from './drive-parse'
export type { DriveTab } from './drive-parse'

export type DriveRoute = {
  dest: string
  destLat: number
  destLon: number
  fromLat: number
  fromLon: number
  coords: Array<[number, number]>
  minutes: number
  meters: number
  hint: string
  steps: DriveStep[]
}

export type DriveFix = {
  lat: number
  lon: number
  bearing?: number
  speed?: number
}

export type DriveGuidance = {
  arrow: string
  line: string
  sub: string
  cue?: string
  offRoute: boolean
}

let active: DriveRoute | null = null
let tab: DriveTab = 'map'
let lastFix: DriveFix | null = null
let announced = new Map<string, Set<string>>()
let offSince = 0
let lastRerouteAt = 0
const listeners = new Set<() => void>()

function persistActive() {
  if (!active) {
    saveSettings({ last_drive_json: '' })
    return
  }
  const slim: DriveRoute = {
    ...active,
    coords: compactCoords(simplifyTrack(active.coords)),
    steps: (active.steps || []).slice(0, 48),
  }
  saveSettings({ last_drive_json: JSON.stringify(slim) })
}

function restoreActive() {
  try {
    const s = loadSettings()
    if (!s.drive_mode || !s.last_drive_json) return
    const parsed = JSON.parse(s.last_drive_json) as DriveRoute
    if (!parsed?.dest || !Number.isFinite(parsed.destLat) || !Number.isFinite(parsed.destLon)) return
    if (!Array.isArray(parsed.coords) || !isRoadTrack(parsed.coords, parsed.meters)) parsed.coords = []
    active = parsed
  } catch {
    /* kaputte letzte Route ignorieren */
  }
}

restoreActive()

function emit() {
  for (const cb of listeners) cb()
}

export function getDriveRoute(): DriveRoute | null {
  return active
}

export function getDriveTab(): DriveTab {
  return tab
}

export function getDriveFix(): DriveFix | null {
  return lastFix
}

export function setDriveTab(next: DriveTab) {
  if (tab === next) return
  tab = next
  emit()
}

export function subscribeDrive(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function closeDrive() {
  saveSettings({ drive_mode: false, last_drive_json: '' })
  active = null
  lastFix = null
  tab = 'map'
  announced = new Map()
  emit()
}

function asNavSteps(steps: DriveStep[] | undefined): NavStep[] {
  return (steps || []).map((s) => ({
    lat: s.lat,
    lon: s.lon,
    type: s.type,
    modifier: s.modifier,
    name: s.name,
  }))
}

function cueKey(dir: string, name: string): string {
  return `${dir}|${(name || '').toLowerCase()}`
}

function resetAnnounced() {
  announced = new Map()
}

/** GPS später da oder Standort hat sich bewegt: Route nachziehen. */
export async function refreshDriveRoute(here: DriveFix): Promise<DriveGuidance | null> {
  lastFix = here
  if (!active) return null
  const off = nextManeuver(asNavSteps(active.steps), active.coords, here)
  const weak = !isRoadTrack(active.coords, active.meters) || active.minutes <= 0
  const moved = haversineM({ lat: active.fromLat, lon: active.fromLon, place: '' }, here)
  let clearlyOff = Boolean(off?.offRoute)
  if (clearlyOff) {
    if (!offSince) offSince = Date.now()
    clearlyOff = Date.now() - offSince >= 4_000
  } else {
    offSince = 0
  }
  const needReroute = weak || clearlyOff || moved > 900
  if (needReroute) {
    const now = Date.now()
    if (weak && !clearlyOff && now - lastRerouteAt < 8_000) return guidanceFor(here)
    lastRerouteAt = now
    const ride = await routeDrive(here, { lat: active.destLat, lon: active.destLon })
    if (!ride.ok) {
      if (weak) {
        active = {
          ...active,
          fromLat: here.lat,
          fromLon: here.lon,
          coords: [],
          hint: ride.message,
          steps: active.steps || [],
        }
        persistActive()
        emit()
      }
      return guidanceFor(here)
    }
    active = {
      ...active,
      fromLat: here.lat,
      fromLon: here.lon,
      coords: ride.coords,
      minutes: ride.minutes,
      meters: ride.meters,
      hint: ride.hint,
      steps: ride.steps || [],
    }
    persistActive()
    emit()
  }
  return guidanceFor(here)
}

function guidanceFor(here: DriveFix): DriveGuidance | null {
  if (!active) return null
  const nxt = nextManeuver(asNavSteps(active.steps), active.coords, here)
  if (!nxt) {
    return {
      arrow: '↑',
      line: active.hint || 'Route',
      sub: active.dest,
      offRoute: false,
    }
  }
  const banner = formatNavBanner(nxt.dir, nxt.meters, nxt.name)
  const phase = navPhase(nxt.meters)
  let cue: string | undefined
  if (phase) {
    const key = cueKey(nxt.dir, nxt.name)
    const seen = announced.get(key) || new Set<string>()
    if (!seen.has(phase)) {
      seen.add(phase)
      announced.set(key, seen)
      cue = formatNavCue(nxt.dir, nxt.meters, phase)
    }
  }
  return { ...banner, cue, offRoute: nxt.offRoute }
}

export function formatRestweg(route: DriveRoute): string {
  const km = route.meters >= 1000 ? `${(route.meters / 1000).toFixed(1)} km` : `${route.meters} m`
  if (route.minutes <= 0 && route.meters <= 0) {
    return `Ziel ${route.dest} liegt. Restweg fehlt — Standort oder Netz.`
  }
  return `Noch etwa ${route.minutes} Min, ${km} bis ${route.dest}.`
}

function driveTool(action: string, label: string, route?: DriveRoute): ToolMeta {
  return {
    tool_status: 'executed',
    tool: 'drive',
    action,
    label,
    preview: route?.dest || tab,
    result: route
      ? {
          dest: route.dest,
          destLat: route.destLat,
          destLon: route.destLon,
          fromLat: route.fromLat,
          fromLon: route.fromLon,
          minutes: route.minutes,
          meters: route.meters,
          hint: route.hint,
          coords: route.coords,
          internal: true,
          tab,
        }
      : { internal: true, tab },
  }
}

async function resolveDest(query: string): Promise<{ place: string } | { ask: string }> {
  const q = normalizePlaceName(query)
  const mem = await listMemory()
  const hit = mem.find(
    (m) =>
      (m.category === 'place' || m.category === 'contact') &&
      (m.key === q || m.key.includes(q) || q.includes(m.key)),
  )
  if (hit?.category === 'place' && hit.value) return { place: hit.value }
  if (isHomeName(q) || isRelationName(q)) {
    const who = displayPlaceName(q)
    return {
      ask: `Wo wohnt ${who}? Sagen Sie zum Beispiel „${who} wohnt in …“. Ich rate den Ort nicht.`,
    }
  }
  if (q.length >= 2) return { place: query.trim() }
  return { place: query.trim() }
}

function emptyRoute(dest: string, destLat: number, destLon: number, fromLat: number, fromLon: number, hint: string): DriveRoute {
  return {
    dest,
    destLat,
    destLon,
    fromLat,
    fromLon,
    coords: [],
    minutes: 0,
    meters: 0,
    hint,
    steps: [],
  }
}

function cacheNearDest(lat: number, lon: number, destLat: number, destLon: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) < 0.2) return false
  return haversineM({ lat, lon, place: '' }, { lat: destLat, lon: destLon }) < 8_000
}

export async function beginDriveTo(
  destName: string,
  destLat: number,
  destLon: number,
): Promise<{ route: DriveRoute; tool: ToolMeta; hereOk: boolean; rideOk: boolean }> {
  openDrive()
  tab = 'map'
  const granted = await requestLocationPermission()
  const here = granted ? await readDeviceLocation() : { ok: false as const, lat: undefined, lon: undefined }
  if (!here.ok || here.lat == null || here.lon == null) {
    const kept = lastFix || {
      lat: Number(loadSettings().last_lat),
      lon: Number(loadSettings().last_lon),
    }
    const fromOk = cacheNearDest(kept.lat, kept.lon, destLat, destLon)
    active = {
      dest: destName,
      destLat,
      destLon,
      fromLat: fromOk ? kept.lat : destLat,
      fromLon: fromOk ? kept.lon : destLon,
      coords: [],
      minutes: 0,
      meters: 0,
      hint: 'Kein GPS. Ziel liegt, Route folgt wenn Standort da ist.',
      steps: [],
    }
    resetAnnounced()
    persistActive()
    emit()
    return { route: active, tool: driveTool('nav', 'Fahrmodus', active), hereOk: false, rideOk: false }
  }
  const ride = await routeDrive({ lat: here.lat, lon: here.lon }, { lat: destLat, lon: destLon })
  if (!ride.ok) {
    active = emptyRoute(destName, destLat, destLon, here.lat, here.lon, ride.message)
    lastFix = { lat: here.lat, lon: here.lon }
    resetAnnounced()
    persistActive()
    emit()
    return { route: active, tool: driveTool('nav', 'Fahrmodus', active), hereOk: true, rideOk: false }
  }
  active = {
    dest: destName,
    destLat,
    destLon,
    fromLat: here.lat,
    fromLon: here.lon,
    coords: ride.coords,
    minutes: ride.minutes,
    meters: ride.meters,
    hint: ride.hint,
    steps: ride.steps || [],
  }
  lastFix = { lat: here.lat, lon: here.lon }
  resetAnnounced()
  persistActive()
  emit()
  return { route: active, tool: driveTool('nav', 'Fahrmodus', active), hereOk: true, rideOk: true }
}

async function startRoute(_label: string, place: string): Promise<{
  handled: true
  reply: string
  tool: ToolMeta
  lastTool: string
}> {
  const s = loadSettings()
  const lat = Number(s.last_lat)
  const lon = Number(s.last_lon)
  const near = Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null
  const dest = await geocodePlace(place, near)
  if (!dest.ok) {
    return {
      handled: true,
      reply: dest.message,
      tool: driveTool('ask', 'Ort fehlt'),
      lastTool: 'drive',
    }
  }
  const { route, tool, hereOk, rideOk } = await beginDriveTo(dest.fix.place, dest.fix.lat, dest.fix.lon)
  if (!hereOk) {
    return {
      handled: true,
      reply: `Fahrmodus: Ziel ${dest.fix.place}. Standort erlauben für die Route — intern, nicht Google Maps.`,
      tool,
      lastTool: 'drive',
    }
  }
  if (!rideOk) {
    return {
      handled: true,
      reply: `${route.hint || 'Netz hat die Route nicht geliefert.'} Ziel ${dest.fix.place} liegt trotzdem im Fahrmodus.`,
      tool,
      lastTool: 'drive',
    }
  }
  const km = route.meters >= 1000 ? `${(route.meters / 1000).toFixed(1)} km` : `${route.meters} m`
  return {
    handled: true,
    reply: `Fahrmodus nach ${dest.fix.place}: etwa ${route.minutes} Min, ${km}. ${route.hint} Karte intern, nicht Google.`,
    tool,
    lastTool: 'drive',
  }
}

async function destOrAsk(raw: string): Promise<
  | { place: string }
  | { handled: true; reply: string; tool: ToolMeta; lastTool: string }
> {
  const resolved = await resolveDest(raw)
  if ('ask' in resolved) {
    openDrive()
    return {
      handled: true,
      reply: resolved.ask,
      tool: driveTool('ask', 'Ort fehlt'),
      lastTool: 'drive',
    }
  }
  return { place: resolved.place }
}

function lastPoiHit(): { name: string; lat: number; lon: number } | null {
  try {
    const raw = loadSettings().last_poi_json
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      hits?: Array<{ name?: string; street?: string; place?: string; lat?: number; lon?: number }>
    }
    const h = parsed?.hits?.[0]
    const lat = Number(h?.lat)
    const lon = Number(h?.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
    const name = [h?.name, h?.street, h?.place].filter(Boolean).join(', ') || 'Ziel'
    return { name, lat, lon }
  } catch {
    return null
  }
}

function openDrive() {
  saveSettings({ drive_mode: true })
  emit()
}

export async function handleDrive(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const s = loadSettings()
  const music = parseSpotifyIntent(text)
  const namesSpotify = /\bspotify\b/i.test(text)
  const volish =
    music?.kind === 'volume_set' || music?.kind === 'volume_up' || music?.kind === 'volume_down'
  const lastMusic = s.last_medium === 'spotify' || s.last_medium === 'drive'
  if (music && (s.drive_mode || namesSpotify || (volish && lastMusic))) {
    const showTab =
      /\boverlay\b/i.test(text) ||
      music.kind === 'play' ||
      music.kind === 'resume' ||
      (s.drive_mode && (music.kind === 'next' || music.kind === 'prev'))
    if (showTab && (s.drive_mode || /\boverlay\b/i.test(text))) {
      openDrive()
      tab = 'spotify'
    }
    const hit = await handleSpotifyCommand(music)
    emit()
    return {
      handled: true,
      reply: hit.reply,
      tool: driveTool('music', 'Spotify'),
      lastTool: 'drive',
    }
  }
  const intent = parseDriveIntent(text, Boolean(s.drive_mode))
  if (intent?.kind === 'off') {
    closeDrive()
    return {
      handled: true,
      reply: 'Fahrmodus aus.',
      tool: driveTool('close', 'Fahrmodus aus'),
      lastTool: 'drive',
    }
  }
  if (intent?.kind === 'tab') {
    openDrive()
    tab = intent.tab
    emit()
    return {
      handled: true,
      reply:
        intent.tab === 'spotify'
          ? 'Spotify-Overlay. Interner Tab, nicht Apple CarPlay.'
          : 'Fahrmodus. Karte intern, nicht Apple CarPlay.',
      tool: driveTool(intent.tab === 'spotify' ? 'music' : 'open', intent.tab === 'spotify' ? 'Spotify' : 'Karte'),
      lastTool: 'drive',
    }
  }
  if (intent?.kind === 'on') {
    openDrive()
    tab = 'map'
    if (intent.dest) {
      if (isFuelPlace(intent.dest)) return { handled: false }
      const got = await destOrAsk(intent.dest)
      if ('handled' in got) return got
      return startRoute(intent.dest, got.place)
    }
    return {
      handled: true,
      reply: 'Fahrmodus an. Intern, nicht Apple CarPlay. Wohin?',
      tool: driveTool('open', 'Fahrmodus'),
      lastTool: 'drive',
    }
  }
  if (intent?.kind === 'eta') {
    openDrive()
    emit()
    const route = getDriveRoute()
    if (!route) {
      return {
        handled: true,
        reply: 'Keine Route im Fahrmodus. Wohin?',
        tool: driveTool('ask', 'Restweg'),
        lastTool: 'drive',
      }
    }
    return {
      handled: true,
      reply: formatRestweg(route),
      tool: driveTool('eta', 'Restweg', route),
      lastTool: 'drive',
    }
  }
  if (intent?.kind === 'route') {
    openDrive()
    tab = 'map'
    emit()
    if (active && active.minutes > 0) {
      return {
        handled: true,
        reply: formatRestweg(active),
        tool: driveTool('open', 'Karte', active),
        lastTool: 'drive',
      }
    }
    const poi = lastPoiHit()
    if (poi) {
      const { route, tool, hereOk, rideOk } = await beginDriveTo(poi.name, poi.lat, poi.lon)
      if (!hereOk) {
        return {
          handled: true,
          reply: `Fahrmodus: Ziel ${poi.name}. Standort erlauben für die Route — intern, nicht Google Maps.`,
          tool,
          lastTool: 'drive',
        }
      }
      if (!rideOk) {
        return {
          handled: true,
          reply: `${route.hint || 'Netz hat die Route nicht geliefert.'} Ziel ${poi.name} liegt trotzdem im Fahrmodus.`,
          tool,
          lastTool: 'drive',
        }
      }
      const km = route.meters >= 1000 ? `${(route.meters / 1000).toFixed(1)} km` : `${route.meters} m`
      return {
        handled: true,
        reply: `Fahrmodus nach ${poi.name}: etwa ${route.minutes} Min, ${km}. Karte intern, nicht Google.`,
        tool,
        lastTool: 'drive',
      }
    }
    return {
      handled: true,
      reply: 'Wohin? Ein Ort in der Nähe, oder „nächstes Café“.',
      tool: driveTool('ask', 'Route'),
      lastTool: 'drive',
    }
  }
  if (!s.drive_mode && intent?.kind !== 'dest') return { handled: false }

  if (intent?.kind === 'dest' && intent.query) {
    if (isFuelPlace(intent.query)) return { handled: false }
    openDrive()
    const got = await destOrAsk(intent.query)
    if ('handled' in got) return got
    return startRoute(intent.query, got.place)
  }
  const nav = parsePlaceNav(text)
  if (nav && nav.kind === 'navigate' && (s.drive_mode || loadSettings().drive_mode)) {
    const got = await destOrAsk(nav.query)
    if ('handled' in got) return got
    return startRoute(nav.query, got.place)
  }
  return { handled: false }
}
