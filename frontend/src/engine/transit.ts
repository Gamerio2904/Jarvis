import { getJson } from './http-json'
import { geocodePlace } from './geo-lookup'
import { mapsDirUrl } from './places-parse'
import { parseTransitIntent } from './transit-parse'
import { resolveWeatherHere } from './weather'
import type { ResearchMeta, ResearchSource } from './research-parse'
import type { ToolMeta } from './tools'

export { parseTransitIntent } from './transit-parse'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/1.48.3 (local.jarvis.app)' }
const REST = 'https://v6.db.transport.rest'

type Stop = { id: string; name: string; lat: number; lon: number }

export async function handleTransit(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; research?: ResearchMeta; lastTool?: string }> {
  const intent = parseTransitIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'ask') {
    return {
      handled: true,
      reply: 'Wohin darf es gehen — Bahn oder Bus? Zum Beispiel nach Heilbronn.',
      tool: { tool_status: 'executed', tool: 'transit', action: 'ask', label: 'Wohin' },
      lastTool: 'transit',
    }
  }

  const fromFix = intent.from
    ? await geocodePlace(intent.from)
    : await resolveWeatherHere()
  if (!fromFix.ok) {
    return {
      handled: true,
      reply: fromFix.message || 'Der Startort fehlt. Standort erlauben, oder von einem Ort nach …',
      tool: { tool_status: 'error', tool: 'transit', action: 'locate', label: 'Start fehlt' },
      lastTool: 'transit',
    }
  }
  const toFix = await geocodePlace(intent.to)
  if (!toFix.ok) {
    return {
      handled: true,
      reply: toFix.message,
      tool: { tool_status: 'error', tool: 'transit', action: 'locate', label: 'Ziel fehlt' },
      lastTool: 'transit',
    }
  }

  const lines = (await restJourneys(fromFix.fix.place, toFix.fix.place)) || (await transitousPlan(fromFix.fix, toFix.fix))
  const maps = mapsDirUrl(toFix.fix.place, 'transit')
  const source: ResearchSource = {
    title: lines?.provider || 'Fahrplan',
    url: lines?.url || 'https://v6.db.transport.rest/',
    snippet: lines?.lines[0] || '',
    provider: lines?.provider || 'transit',
    retrieved_at: new Date().toISOString(),
  }
  if (!lines?.lines.length) {
    return {
      handled: true,
      reply: `Einen Fahrplan habe ich gerade nicht. Eine Abfahrt würde ich nicht erfinden. Die ÖPNV-Route nach ${toFix.fix.place} liegt in Maps.`,
      tool: {
        tool_status: 'error',
        tool: 'transit',
        action: 'fetch',
        label: 'Fahrplan fehlt',
        preview: toFix.fix.place,
        result: { url: maps, destination: toFix.fix.place, routes: [{ title: toFix.fix.place, url: maps }] },
      },
      lastTool: 'transit',
    }
  }
  return {
    handled: true,
    reply: `Nach ${toFix.fix.place}: ${lines.lines.join(' ')} Angaben ohne Gewähr — am Gleis prüfen.`,
    research: {
      used: true,
      status: 'ok',
      status_label: 'Fahrplan · Quelle',
      query: `Bahn ${fromFix.fix.place} ${toFix.fix.place}`,
      sources: [source],
      privacy_note: 'Fahrplan öffentlich, kein Raten.',
    },
    tool: {
      tool_status: 'executed',
      tool: 'transit',
      action: 'plan',
      label: 'Bahn',
      preview: toFix.fix.place,
      result: { url: maps, destination: toFix.fix.place, routes: [{ title: toFix.fix.place, url: maps }] },
    },
    lastTool: 'transit',
  }
}

async function restJourneys(
  fromName: string,
  toName: string,
): Promise<{ lines: string[]; provider: string; url: string } | null> {
  try {
    const from = await restStop(fromName)
    const to = await restStop(toName)
    if (!from || !to) return null
    const q = new URLSearchParams({ from: from.id, to: to.id, results: '3' })
    const { status, json } = await getJson(`${REST}/journeys?${q}`, UA)
    if (status < 200 || status >= 300) return null
    const journeys = (json.journeys as Array<Record<string, unknown>> | undefined) || []
    const lines = journeys.slice(0, 3).map((j) => formatRestJourney(j)).filter(Boolean)
    if (!lines.length) return null
    return { lines, provider: 'transport.rest', url: 'https://v6.db.transport.rest/' }
  } catch {
    return null
  }
}

async function restStop(query: string): Promise<Stop | null> {
  const q = new URLSearchParams({ query, results: '1' })
  const { status, json } = await getJson(`${REST}/locations?${q}`, UA)
  if (status < 200 || status >= 300) return null
  const rows = Array.isArray(json) ? (json as unknown as Array<Record<string, unknown>>) : []
  const first = rows[0]
  if (!first) return null
  const loc = (first.location || first) as Record<string, unknown>
  const lat = Number(loc.latitude ?? first.latitude)
  const lon = Number(loc.longitude ?? first.longitude)
  const id = String(first.id || '')
  if (!id) return null
  return { id, name: String(first.name || query), lat, lon }
}

function formatRestJourney(j: Record<string, unknown>): string {
  const legs = (j.legs as Array<Record<string, unknown>> | undefined) || []
  const first = legs.find((l) => l.line) || legs[0]
  const last = legs[legs.length - 1]
  const line = first?.line as Record<string, unknown> | undefined
  const name = String(line?.name || line?.fahrtNr || 'Bahn')
  const dep = clock(String(first?.departure || first?.plannedDeparture || ''))
  const arr = clock(String(last?.arrival || last?.plannedArrival || ''))
  const mins = Number(j.duration) ? Math.round(Number(j.duration) / 60) : null
  const xfer = Math.max(0, legs.filter((l) => l.line).length - 1)
  const dur = mins != null ? `, ${mins} Min` : ''
  const um = xfer ? `, ${xfer} Umstieg` : ', ohne Umstieg'
  if (!dep) return ''
  return `${name} ${dep}${arr ? ` an ${arr}` : ''}${dur}${um}.`
}

async function transitousPlan(
  from: { lat: number; lon: number; place: string },
  to: { lat: number; lon: number; place: string },
): Promise<{ lines: string[]; provider: string; url: string } | null> {
  try {
    const q = new URLSearchParams({
      fromPlace: `${from.lat},${from.lon}`,
      toPlace: `${to.lat},${to.lon}`,
      numItineraries: '3',
    })
    const { status, json } = await getJson(`https://api.transitous.org/api/v1/plan?${q}`, UA)
    if (status < 200 || status >= 300) return null
    const its = (json.itineraries as Array<Record<string, unknown>> | undefined) || []
    const lines = its.slice(0, 3).map((it) => formatTransitous(it)).filter(Boolean)
    if (!lines.length) return null
    return { lines, provider: 'Transitous', url: 'https://transitous.org/' }
  } catch {
    return null
  }
}

function formatTransitous(it: Record<string, unknown>): string {
  const legs = (it.legs as Array<Record<string, unknown>> | undefined) || []
  const ride = legs.find((l) => {
    const mode = String(l.mode || '')
    return mode && mode !== 'WALK' && mode !== 'BICYCLE'
  })
  const name = String(ride?.routeShortName || ride?.route || ride?.headsign || 'Bahn')
  const dep = clock(String(it.startTime || ride?.startTime || ''))
  const arr = clock(String(it.endTime || ''))
  const mins = Number(it.duration) ? Math.round(Number(it.duration) / 60) : null
  const xfer = Number(it.transfers)
  const dur = mins != null ? `, ${mins} Min` : ''
  const um = xfer > 0 ? `, ${xfer} Umstieg` : ', ohne Umstieg'
  if (!dep) return ''
  return `${name} ${dep}${arr ? ` an ${arr}` : ''}${dur}${um}.`
}

function clock(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    const m = /T(\d{2}):(\d{2})/.exec(iso)
    return m ? `${m[1]}:${m[2]}` : ''
  }
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}
