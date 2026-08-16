import { parseDriveIntent } from './drive-parse'
import { handleSpotifyCommand, parseSpotifyIntent } from './spotify'
import { geocodePlace, routeDrive } from './geo-lookup'
import { displayPlaceName, normalizePlaceName, parsePlaceNav } from './places-parse'
import { readDeviceLocation, requestLocationPermission } from '../native/geo'
import { listMemory, loadSettings, saveSettings } from './store'
import type { ToolMeta } from './tools'

export { parseDriveIntent } from './drive-parse'

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
}

let active: DriveRoute | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const cb of listeners) cb()
}

export function getDriveRoute(): DriveRoute | null {
  return active
}

export function subscribeDrive(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function closeDrive() {
  saveSettings({ drive_mode: false })
  active = null
  emit()
}

function driveTool(action: string, label: string, route?: DriveRoute): ToolMeta {
  return {
    tool_status: 'executed',
    tool: 'drive',
    action,
    label,
    preview: route?.dest || '',
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
        }
      : { internal: true },
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

async function startRoute(_label: string, place: string): Promise<{
  handled: true
  reply: string
  tool: ToolMeta
  lastTool: string
}> {
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
    }
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
    active = {
      dest: dest.fix.place,
      destLat: dest.fix.lat,
      destLon: dest.fix.lon,
      fromLat: here.lat,
      fromLon: here.lon,
      coords: [
        [here.lon, here.lat],
        [dest.fix.lon, dest.fix.lat],
      ],
      minutes: 0,
      meters: 0,
      hint: ride.message,
    }
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
  }
  emit()
  const km = ride.meters >= 1000 ? `${(ride.meters / 1000).toFixed(1)} km` : `${ride.meters} m`
  return {
    handled: true,
    reply: `Fahrmodus nach ${dest.fix.place}: etwa ${ride.minutes} Min, ${km}. ${ride.hint} Karte intern, nicht Google.`,
    tool: driveTool('nav', 'Fahrmodus', active),
    lastTool: 'drive',
  }
}

export async function handleDrive(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const s = loadSettings()
  if (s.drive_mode) {
    const music = parseSpotifyIntent(text)
    if (music) {
      const hit = await handleSpotifyCommand(music)
      return {
        handled: true,
        reply: hit.reply,
        tool: driveTool('music', 'Spotify'),
        lastTool: 'drive',
      }
    }
  }
  const intent = parseDriveIntent(text, Boolean(s.drive_mode))
  if (intent?.kind === 'off') {
    saveSettings({ drive_mode: false })
    active = null
    emit()
    return {
      handled: true,
      reply: 'Fahrmodus aus.',
      tool: driveTool('close', 'Fahrmodus aus'),
      lastTool: 'drive',
    }
  }
  if (intent?.kind === 'on') {
    saveSettings({ drive_mode: true })
    emit()
    if (intent.dest) {
      const place = (await resolveDest(intent.dest)) || intent.dest
      return startRoute(intent.dest, place)
    }
    return {
      handled: true,
      reply: 'Fahrmodus an. Wohin? Zum Beispiel „zur Freundin“ oder „nach Heilbronn“.',
      tool: driveTool('open', 'Fahrmodus'),
      lastTool: 'drive',
    }
  }
  if (!s.drive_mode) return { handled: false }

  if (intent?.kind === 'dest' && intent.query) {
    const place = (await resolveDest(intent.query)) || intent.query
    return startRoute(intent.query, place)
  }
  const nav = parsePlaceNav(text)
  if (nav && nav.kind === 'navigate') {
    const place = (await resolveDest(nav.query)) || nav.query
    return startRoute(nav.query, place)
  }
  return { handled: false }
}
