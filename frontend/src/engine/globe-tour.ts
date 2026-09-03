/** Welt-Tour: Allowlist-Länder leuchten, Seite erklärt, Zoom-Kette. Tagesschau + DW. */

import { CITY_FLY_ZOOM, TOUR_OVERVIEW_ZOOM } from './globe-gibs.ts'
import { countryById, matchCountry } from './globe-countries.ts'
import { loadSettings, saveSettings } from './store.ts'
import { prefersReducedMotion } from './motion.ts'
import type { GeoFix } from './globe-geo.ts'
import type { OutlookNews } from './outlook.ts'
import type { OutlookTag } from './outlook-tags.ts'
import { decodeHtml } from './html-text.ts'

export const TOUR_SKIP =
  /\b(fußball|fussball|bundesliga|premier[- ]league|wetter|unwetter|unfall|stau|verkehr|sport|tennis|formel\s*1|handball|olympia|boxen|nachruf|gestorben|kunstmuseum|biennale)\b/i

export const TOUR_OVERVIEW_MS = 2500
export const TOUR_STOP_MS = 7500
export const TOUR_MAX = 5

export type GlobeTourStop = {
  id: string
  name: string
  lat: number
  lon: number
  title: string
  teaser: string
  provider: string
  url: string
  line: string
}

export type GlobeTour = {
  on: boolean
  phase: 'overview' | 'stops' | 'done'
  i: number
  stops: GlobeTourStop[]
  nextAt: number
  reduced: boolean
}

const TAG_FALLBACK: Partial<Record<OutlookTag, string>> = {
  hormus: 'hormus',
  ukraine: 'ua',
  opec: 'at',
  ezb: 'de',
}

export function buildTourStops(news: OutlookNews[]): GlobeTourStop[] {
  const stops: GlobeTourStop[] = []
  const seen = new Set<string>()
  for (const n of news) {
    const blob = `${n.title} ${n.teaser}`
    if (TOUR_SKIP.test(blob)) continue
    let c = matchCountry(n.title) || matchCountry(`${n.title} ${n.teaser}`)
    if (!c) {
      const tag = (n.tags || []).find((t) => TAG_FALLBACK[t])
      const id = tag ? TAG_FALLBACK[tag] : ''
      c = id ? countryById(id) : null
    }
    if (!c || seen.has(c.id)) continue
    seen.add(c.id)
    const teaser = decodeHtml(n.teaser || '').slice(0, 140)
    const title = decodeHtml(n.title)
    const line = `${c.name}: ${title}.${teaser ? ` ${teaser}` : ''} Quelle ${n.provider}, kein Live.`
    stops.push({
      id: c.id,
      name: c.name,
      lat: c.lat,
      lon: c.lon,
      title: title,
      teaser: teaser,
      provider: n.provider,
      url: n.url,
      line,
    })
    if (stops.length >= TOUR_MAX) break
  }
  return stops
}

export function readTour(): GlobeTour | null {
  try {
    const raw = loadSettings().last_globe_tour_json
    if (!raw) return null
    const t = JSON.parse(raw) as GlobeTour
    if (!Array.isArray(t.stops)) return null
    return t
  } catch {
    return null
  }
}

export function startTour(stops: GlobeTourStop[]): GlobeTour {
  const reduced = prefersReducedMotion()
  const first = stops[0]
  const now = Date.now()
  const tour: GlobeTour = {
    on: stops.length > 0,
    phase: reduced || !stops.length ? 'done' : 'overview',
    i: 0,
    stops,
    nextAt: now + TOUR_OVERVIEW_MS,
    reduced,
  }
  const focus = first
    ? { name: first.name, lat: first.lat, lon: first.lon, zoom: TOUR_OVERVIEW_ZOOM }
    : null
  const brief = stops.length
    ? reduced
      ? stops.map((s) => s.line).join(' ')
      : `Heute leuchten ${stops.map((s) => s.name).join(', ')}. ${first.line}`
    : 'Keine weltpolitische Lage, die ich einem Land zuordnen kann.'
  saveSettings({
    last_globe_tour_json: JSON.stringify(tour),
    globe_tour_on: tour.on,
    last_globe_brief: brief.slice(0, 500),
    hud_view: 'globe',
    hud_force: true,
    hud_hidden: false,
    last_globe_focus: focus ? JSON.stringify(focus) : loadSettings().last_globe_focus,
    last_globe_look: first
      ? JSON.stringify({ lat: first.lat, lon: first.lon, zoom: reduced ? TOUR_OVERVIEW_ZOOM : TOUR_OVERVIEW_ZOOM })
      : loadSettings().last_globe_look,
  })
  return tour
}

export function stopTour(): void {
  const cur = readTour()
  if (cur) {
    saveSettings({
      last_globe_tour_json: JSON.stringify({ ...cur, on: false, phase: 'done' }),
      globe_tour_on: false,
    })
    return
  }
  saveSettings({ globe_tour_on: false })
}

export function clearTour(): void {
  saveSettings({ last_globe_tour_json: '', globe_tour_on: false })
}

export function advanceTour(): GlobeTourStop | null {
  const cur = readTour()
  if (!cur?.on || cur.reduced) return null
  if (Date.now() < cur.nextAt) return null
  if (cur.phase === 'overview') {
    return applyStop({ ...cur, phase: 'stops', i: 0, nextAt: Date.now() + TOUR_STOP_MS }, 0)
  }
  const nextI = cur.i + 1
  if (nextI >= cur.stops.length) {
    saveSettings({
      last_globe_tour_json: JSON.stringify({ ...cur, on: false, phase: 'done' }),
      globe_tour_on: false,
    })
    return null
  }
  return applyStop({ ...cur, i: nextI, nextAt: Date.now() + TOUR_STOP_MS }, nextI)
}

export function selectTourStop(name: string): GlobeTourStop | null {
  const cur = readTour()
  if (!cur?.stops.length) return null
  const i = cur.stops.findIndex((s) => s.name === name)
  if (i < 0) return null
  return applyStop({ ...cur, on: false, phase: 'done', i, nextAt: Date.now() }, i)
}

function applyStop(tour: GlobeTour, i: number): GlobeTourStop | null {
  const stop = tour.stops[i]
  if (!stop) return null
  saveSettings({
    last_globe_tour_json: JSON.stringify(tour),
    globe_tour_on: tour.on,
    last_globe_brief: stop.line.slice(0, 500),
    last_globe_focus: JSON.stringify({ name: stop.name, lat: stop.lat, lon: stop.lon, zoom: CITY_FLY_ZOOM }),
    last_globe_look: JSON.stringify({ lat: stop.lat, lon: stop.lon, zoom: CITY_FLY_ZOOM }),
    hud_view: 'globe',
    hud_force: true,
    hud_hidden: false,
  })
  return stop
}

export function tourGlowPins(): GeoFix[] {
  const t = readTour()
  if (!t?.stops.length) return []
  const active = t.stops[t.i]?.name
  return t.stops.map((s) => ({
    name: s.name,
    lat: s.lat,
    lon: s.lon,
    kind: 'glow' as const,
    line: s.line,
    hot: s.name === active,
  }))
}

export function overviewLine(stops: GlobeTourStop[]): string {
  if (!stops.length) {
    return 'Keine Länder-Tour aus den Meldungen. Die Schlagzeilen nenne ich trotzdem, ohne etwas zu erfinden.'
  }
  return `Auf der Kugel leuchten ${stops.map((s) => s.name).join(', ')}. Nacheinander, Stopp bricht ab.`
}

export function tourChatReply(stops: GlobeTourStop[]): string {
  if (!stops.length) return overviewLine(stops)
  const stopLines = stops.map((s, i) => `${i + 1}. ${s.name}: ${s.title}`).join(' ')
  return `${overviewLine(stops)} ${stopLines}`.replace(/\s+/g, ' ').trim()
}
