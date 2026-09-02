/** Stadt-Briefing: Lexikon + Tagesschau + Markt-Kette + Anomalie + Ihr Plan. Fehlendes weglassen. */

import { CITY_FLY_ZOOM } from './globe-gibs.ts'
import { haversineKm, composePlaceBrief, type PlaceFix } from './globe-geo.ts'
import { isGermanPlace, marketKindForPlace } from './globe-countries.ts'
import { tagesschauSearch } from './news.ts'
import { loadOutlookSnap } from './outlook.ts'
import { chainSentences } from './outlook-tags.ts'
import { dwdLineForPlace } from './warn.ts'
import { fetchIssNow } from './globe-pins.ts'
import { getJson } from './http-json.ts'
import { listEvents, listMemory, listReminders, listTodos } from './store.ts'
import { formatDue } from './remind-parse.ts'
import { polishToolLine } from './polish.ts'
import { TOUR_SKIP } from './globe-tour.ts'

export { CITY_FLY_ZOOM, composePlaceBrief }

const ISS_VIEW_KM = 2200
const EONET_KM = 420
const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/6.90.0 (local.jarvis.app)' }

export type PlaceBrief = { name: string; lat: number; lon: number; blurb: string }

export function focusJson(place: PlaceBrief, zoom = CITY_FLY_ZOOM): string {
  return JSON.stringify({ name: place.name, lat: place.lat, lon: place.lon, zoom })
}

export async function briefPlace(place: PlaceBrief): Promise<string> {
  const extras: string[] = []
  const [news, market, warn, plan] = await Promise.all([
    newsLine(place.name),
    marketLine(place.name),
    anomalyLines(place),
    planLine(place.name),
  ])
  if (news) extras.push(news)
  if (market) extras.push(market)
  extras.push(...warn)
  if (plan) extras.push(plan)
  const canned = composePlaceBrief(place, extras)
  return polishToolLine(canned, canned)
}

async function newsLine(name: string): Promise<string | null> {
  try {
    const local = await tagesschauSearch(name)
    const hit = local.hits.find((h) => !TOUR_SKIP.test(h))
    if (!hit) return null
    return `Zur Lage in ${name}: ${hit}`
  } catch {
    return null
  }
}

async function marketLine(name: string): Promise<string | null> {
  const kind = marketKindForPlace(name)
  if (!kind) return null
  try {
    const snap = await loadOutlookSnap(kind === 'ezb' ? 'fx_outlook' : 'oil_why')
    const bits: string[] = []
    if (kind === 'hormus' || kind === 'opec') {
      if (snap.oil) {
        bits.push(`Brent liegt bei ${snap.oil.value.toFixed(2).replace('.', ',')} Dollar je Barrel (${snap.oil.source}, Stand ${snap.oil.date}).`)
      }
      bits.push(...chainSentences(kind === 'hormus' ? ['hormus'] : ['opec']))
    }
    if (kind === 'ezb') {
      if (snap.fx) {
        bits.push(
          `Ein ${snap.fx.from} sind ${snap.fx.last.toFixed(4)} ${snap.fx.to}, Stand ${snap.fx.date} über Frankfurter.app (EZB).`,
        )
      }
      bits.push(...chainSentences(['ezb']))
    }
    const line = bits.filter(Boolean).join(' ').trim()
    if (!line) return null
    return `${line} Kein Kauf-Rat.`
  } catch {
    return null
  }
}

async function anomalyLines(place: PlaceBrief): Promise<string[]> {
  const [dwd, issLine, eonet] = await Promise.all([
    isGermanPlace(place.name)
      ? dwdLineForPlace(place.name).catch(() => null)
      : Promise.resolve(null),
    fetchIssNow()
      .then((iss) => {
        if (!iss || haversineKm(place, iss) > ISS_VIEW_KM) return null
        return `Die ISS steht in der Region um ${place.name} (${iss.lat.toFixed(1)}°, ${iss.lon.toFixed(1)}°; Where The ISS At). Kein Überflug erfunden.`
      })
      .catch(() => null),
    eonetLine(place),
  ])
  return [dwd, issLine, eonet].filter((x): x is string => Boolean(x))
}

async function eonetLine(place: PlaceBrief): Promise<string | null> {
  try {
    const timed = new Promise<null>((resolve) => {
      globalThis.setTimeout(() => resolve(null), 4000)
    })
    const fetched = (async () => {
      const { status, json } = await getJson('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=16', UA)
      return { status, json }
    })()
    const raced = await Promise.race([fetched, timed])
    if (!raced) return null
    const { status, json } = raced
    if (status < 200 || status >= 300) return null
    const events = (json.events as Array<Record<string, unknown>> | undefined) || []
    for (const ev of events) {
      const title = String(ev.title || '').trim()
      if (!title) continue
      const geos = (ev.geometry as Array<{ coordinates?: number[] }> | undefined) || []
      for (const g of geos) {
        const lon = Number(g.coordinates?.[0])
        const lat = Number(g.coordinates?.[1])
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
        if (haversineKm(place, { lat, lon }) <= EONET_KM) {
          return `NASA EONET nennt „${title.slice(0, 80)}“ in der Region, kein Live.`
        }
      }
    }
    return null
  } catch {
    return null
  }
}

async function planLine(name: string): Promise<string | null> {
  const needle = name.trim()
  if (!needle) return null
  const re = placeRe(needle)
  const now = Date.now()
  try {
    const ev = (await listEvents())
      .filter((e) => new Date(e.start_at).getTime() >= now - 60_000)
      .filter((e) => re.test(`${e.title} ${e.place || ''}`))
      .sort((a, b) => (a.start_at < b.start_at ? -1 : 1))[0]
    if (ev) {
      return `Sie haben ${ev.title} in ${needle} · ${formatDue(new Date(ev.start_at))}.`
    }
  } catch {
    /* skip */
  }
  try {
    const todo = (await listTodos()).find((t) => t.status === 'open' && re.test(t.title))
    if (todo) return `Offen bei Ihnen: ${todo.title} (${needle}).`
  } catch {
    /* skip */
  }
  try {
    const mem = (await listMemory()).find((m) => re.test(`${m.key} ${m.value}`))
    if (mem) return `Bei Ihnen steht zu ${needle}: ${mem.value.slice(0, 120)}.`
  } catch {
    /* skip */
  }
  try {
    const rem = (await listReminders())
      .filter((r) => r.status === 'open' && r.kind !== 'timer')
      .find((r) => re.test(r.title))
    if (rem) return `Erinnerung: ${rem.title} · ${formatDue(new Date(rem.due_at))}.`
  } catch {
    /* skip */
  }
  return null
}

function placeRe(name: string): RegExp {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${esc}\\b`, 'i')
}

export function fromPlaceFix(p: Pick<PlaceFix, 'name' | 'lat' | 'lon' | 'blurb'>): PlaceBrief {
  return { name: p.name, lat: p.lat, lon: p.lon, blurb: p.blurb }
}
