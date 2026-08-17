import { parseDriveIntent, type DriveTab } from './drive-parse'
import { handleSpotifyCommand, parseSpotifyIntent } from './spotify'
import { geocodePlace, haversineM, routeDrive, type DriveStep } from './geo-lookup'
import { displayPlaceName, normalizePlaceName, parsePlaceNav } from './places-parse'
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
let announced = new Map<number, Set<string>>()
const listeners = new Set<() => void>()

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
  saveSettings({ drive_mode: false })
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

function resetAnnounced() {
  announced = new Map()
}

/** GPS später da oder Standort hat sich bewegt: Route nachziehen. */
export async function refreshDriveRoute(here: DriveFix): Promise<DriveGuidance | null> {
  lastFix = here
  if (!active) {
    emit()
    return null
  }
  const off = nextManeuver(asNavSteps(active.steps), active.coords, here)
  const weak = active.coords.length < 2 || active.minutes <= 0
  const moved = haversineM({ lat: active.fromLat, lon: active.fromLon, place: '' }, here)
  const needReroute = weak || Boolean(off?.offRoute) || moved > 900
  if (needReroute) {
    const ride = await routeDrive(here, { lat: active.destLat, lon: active.destLon })
    if (!ride.ok) {
      if (weak) {
        active = {
          ...active,
          fromLat: here.lat,
          fromLon: here.lon,
          coords: [
            [here.lon, here.lat],
            [active.destLon, active.destLat],
          ],
          hint: ride.message,
          steps: active.steps || [],
        }
        emit()
      }
      return guidanceFor(here)
    }
    const sameDest =
      Math.abs(active.fromLat - here.lat) < 1e-5 && Math.abs(active.fromLon - here.lon) < 1e-5
    if (!sameDest) resetAnnounced()
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
    const seen = announced.get(nxt.index) || new Set<string>()
    if (!seen.has(phase)) {
      seen.add(phase)
      announced.set(nxt.index, seen)
      cue = formatNavCue(nxt.dir, nxt.meters, phase)
    }
  }
  return { ...banner, cue, offRoute: nxt.offRoute }
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

async function resolveDest(query: string): Promise<string | null> {
  const q = normalizePlaceName(query)
  const mem = await listMemory()
  const hit = mem.find(
    (m) =>
      (m.category === 'place' || m.category === 'contact') &&
      (m.key === q || m.key.includes(q) || q.includes(m.key)),
  )
  if (hit?.category === 'place' && hit.value) return hit.value
  if (q.length >= 2) return displayPlaceName(q) === q ? query.trim() : query.trim()
  return query.trim() || null
}

function emptyRoute(dest: string, destLat: number, destLon: number, fromLat: number, fromLon: number, hint: string): DriveRoute {
  return {
    dest,
    destLat,
    destLon,
    fromLat,
    fromLon,
    coords: [
      [fromLon, fromLat],
      [destLon, destLat],
    ],
    minutes: 0,
    meters: 0,
    hint,
    steps: [],
  }
}

async function startRoute(_label: string, place: string): Promise<{
  handled: true
  reply: string
  tool: ToolMeta
  lastTool: string
}> {
  tab = 'map'
  const granted = await requestLocationPermission()
  const here = granted ? await readDeviceLocation() : { ok: false as const, lat: undefined, lon: undefined }
  const dest = await geocodePlace(place)
  if (!dest.ok) {
    return {
      handled: true,
      reply: dest.message,
      tool: driveTool('ask', 'Ort fehlt'),
      lastTool: 'drive',
    }
  }
  if (!here.ok || here.lat == null || here.lon == null) {
    active = {
      dest: dest.fix.place,
      destLat: dest.fix.lat,
      destLon: dest.fix.lon,
      fromLat: dest.fix.lat,
      fromLon: dest.fix.lon,
      coords: [[dest.fix.lon, dest.fix.lat]],
      minutes: 0,
      meters: 0,
      hint: 'Kein GPS. Ziel liegt, Route folgt wenn Standort da ist.',
      steps: [],
    }
    resetAnnounced()
    emit()
    return {
      handled: true,
      reply: `Fahrmodus: Ziel ${dest.fix.place}. Standort erlauben für die Route — intern, nicht Google Maps.`,
      tool: driveTool('nav', 'Fahrmodus', active),
      lastTool: 'drive',
    }
  }
  const ride = await routeDrive({ lat: here.lat, lon: here.lon }, dest.fix)
  if (!ride.ok) {
    active = emptyRoute(dest.fix.place, dest.fix.lat, dest.fix.lon, here.lat, here.lon, ride.message)
    resetAnnounced()
    emit()
    return {
      handled: true,
      reply: `${ride.message} Ziel ${dest.fix.place} liegt trotzdem im Fahrmodus.`,
      tool: driveTool('nav', 'Fahrmodus', active),
      lastTool: 'drive',
    }
  }
  active = {
    dest: dest.fix.place,
    destLat: dest.fix.lat,
    destLon: dest.fix.lon,
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
  emit()
  const km = ride.meters >= 1000 ? `${(ride.meters / 1000).toFixed(1)} km` : `${ride.meters} m`
  return {
    handled: true,
    reply: `Fahrmodus nach ${dest.fix.place}: etwa ${ride.minutes} Min, ${km}. ${ride.hint} Karte intern, nicht Google.`,
    tool: driveTool('nav', 'Fahrmodus', active),
    lastTool: 'drive',
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
  if (music && (s.drive_mode || namesSpotify)) {
    openDrive()
    tab = 'spotify'
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
      reply: intent.tab === 'spotify' ? 'Spotify.' : 'Karte.',
      tool: driveTool(intent.tab === 'spotify' ? 'music' : 'open', intent.tab === 'spotify' ? 'Spotify' : 'Karte'),
      lastTool: 'drive',
    }
  }
  if (intent?.kind === 'on') {
    openDrive()
    tab = 'map'
    if (intent.dest) {
      const place = (await resolveDest(intent.dest)) || intent.dest
      return startRoute(intent.dest, place)
    }
    return {
      handled: true,
      reply: 'Fahrmodus an. Wohin? Zum Beispiel „zur Freundin“. Musik: „Spiel … auf Spotify“.',
      tool: driveTool('open', 'Fahrmodus'),
      lastTool: 'drive',
    }
  }
  if (!s.drive_mode && intent?.kind !== 'dest') return { handled: false }

  if (intent?.kind === 'dest' && intent.query) {
    openDrive()
    const place = (await resolveDest(intent.query)) || intent.query
    return startRoute(intent.query, place)
  }
  const nav = parsePlaceNav(text)
  if (nav && nav.kind === 'navigate' && (s.drive_mode || loadSettings().drive_mode)) {
    const place = (await resolveDest(nav.query)) || nav.query
    return startRoute(nav.query, place)
  }
  return { handled: false }
}
