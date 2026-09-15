import { gazetteerHit, pinLineFor, PLACES, type PlaceFix } from './globe-geo.ts'
import { geocodePlace } from './geo-lookup.ts'
import { listMessages, loadSettings } from './store.ts'
import { fromPlaceFix, type PlaceBrief } from './globe-brief.ts'

const SKIP_NAME =
  /^(?:ich|du|wir|sie|das|es|hier|dort|urlaub|karte|kugel|erde|lage|heute|morgen|strand|küste|kueste)$/i

const NAMED = /\b(?:in|nach|bei|ort)\s+([A-ZÄÖÜ][\wäöüß-]{2,40})\b/g

function fromFix(p: PlaceFix): PlaceBrief {
  return fromPlaceFix(p)
}

export function focusPlace(): PlaceBrief | null {
  const s = loadSettings()
  try {
    const f = JSON.parse(s.last_globe_focus || '{}') as { name?: string; lat?: unknown; lon?: unknown }
    const name = String(f.name || '').trim()
    const lat = Number(f.lat)
    const lon = Number(f.lon)
    if (!name || /^iss$/i.test(name) || !Number.isFinite(lat) || !Number.isFinite(lon)) return null
    const hit = gazetteerHit(name)
    return {
      name: hit?.name || name,
      lat,
      lon,
      blurb: hit?.blurb || pinLineFor(name, s.last_globe_brief),
    }
  } catch {
    return null
  }
}

function fromGps(): PlaceBrief | null {
  const s = loadSettings()
  const lat = Number(s.last_lat)
  const lon = Number(s.last_lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (Math.abs(lat) < 0.2 && Math.abs(lon) < 0.2)) return null
  const name = (s.last_place || '').trim()
  const hit = name ? gazetteerHit(name) : null
  return {
    name: hit?.name || name || 'Standort',
    lat: hit?.lat ?? lat,
    lon: hit?.lon ?? lon,
    blurb: hit?.blurb || name || 'GPS',
  }
}

export function placesInText(blob: string): PlaceFix[] {
  const t = blob || ''
  const hits: PlaceFix[] = []
  const seen = new Set<string>()
  for (const p of PLACES) {
    if (!p.re.test(t) || seen.has(p.name)) continue
    seen.add(p.name)
    hits.push(p)
  }
  return hits
}

function lastNamedHint(blob: string): string {
  let last = ''
  NAMED.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = NAMED.exec(blob))) {
    const name = (m[1] || '').trim()
    if (name && !SKIP_NAME.test(name)) last = name
  }
  return last
}

async function fromRecentChat(conversationId?: string): Promise<PlaceBrief | null> {
  if (!conversationId) return null
  let rows: { content?: string }[] = []
  try {
    rows = (await listMessages(conversationId)).slice(-8)
  } catch {
    return null
  }
  const blob = rows.map((m) => String(m.content || '')).join('\n')
  const known = placesInText(blob)
  if (known.length) return fromFix(known[known.length - 1])
  const hint = lastNamedHint(blob)
  if (!hint) return null
  const hit = gazetteerHit(hint)
  if (hit) return fromFix(hit)
  const geo = await geocodePlace(hint)
  if (!geo.ok) return null
  return { name: geo.fix.place.split(',')[0]?.trim() || hint, lat: geo.fix.lat, lon: geo.fix.lon, blurb: geo.fix.place }
}

export async function resolveShowPlace(asked: string, conversationId?: string): Promise<PlaceBrief | null> {
  const q = (asked || '').trim()
  if (q) {
    const hit = gazetteerHit(q)
    if (hit) return fromFix(hit)
    const geo = await geocodePlace(q)
    if (geo.ok) {
      return { name: geo.fix.place.split(',')[0]?.trim() || q, lat: geo.fix.lat, lon: geo.fix.lon, blurb: geo.fix.place }
    }
    return null
  }
  const s = loadSettings()
  const step = gazetteerHit(s.last_step_title || '') || gazetteerHit(s.last_step_utterance || '')
  if (step) return fromFix(step)
  const chat = await fromRecentChat(conversationId)
  if (chat) return chat
  const focus = focusPlace()
  if (focus) return focus
  return fromGps()
}
