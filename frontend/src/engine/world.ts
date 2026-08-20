import { getJson, getText } from './http-json'
import { applyMove, boardText, fenOf, parseFen, START_FEN } from './chess'
import { loadSettings, saveSettings } from './store'
import type { ToolMeta } from './tools'
import { parseWorldIntent } from './world-parse'
import { resolveWeatherHere } from './weather'

export { parseWorldIntent, isMusicHonesty } from './world-parse'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/2.37.0 (local.jarvis.app)' }

type Hit = { handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }

function tool(action: string, label: string, status: ToolMeta['tool_status'] = 'executed'): ToolMeta {
  return { tool_status: status, tool: 'world', action, label }
}

export async function handleWorld(text: string): Promise<Hit> {
  const intent = parseWorldIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'warn') return warn()
  if (intent.kind === 'ferien') return ferien(intent.land)
  if (intent.kind === 'fx') return fx(intent.from, intent.to)
  if (intent.kind === 'food') return food(intent.query)
  if (intent.kind === 'book') return book(intent.query)
  if (intent.kind === 'sport') return sport(intent.query, intent.league)
  if (intent.kind === 'plant') return taxa(intent.query, 'pflanze')
  if (intent.kind === 'animal') return taxa(intent.query, 'vogel')
  if (intent.kind === 'iss') return iss()
  if (intent.kind === 'moon') return moon()
  if (intent.kind === 'flights') return flights()
  if (intent.kind === 'law') return law(intent.query)
  if (intent.kind === 'house') return house(intent.query)
  return chess(intent.move, intent.reset)
}

async function warn(): Promise<Hit> {
  const urls = [
    'https://s3.eu-central-1.amazonaws.com/app-prod-static.warnwetter.de/v16/warnings.json',
    'https://s3.eu-central-1.amazonaws.com/app-prod-static.warnwetter.de/v16/community_warnings.json',
  ]
  for (const url of urls) {
    try {
      const { status, json } = await getJson(url, UA)
      if (status < 200 || status >= 300) continue
      const line = summarizeWarn(json)
      if (line) {
        return {
          handled: true,
          reply: line,
          tool: tool('warn', 'DWD'),
          lastTool: 'world',
        }
      }
    } catch {
      /* nächste Quelle */
    }
  }
  return {
    handled: true,
    reply: 'DWD-Warnungen gerade nicht lesbar. Ich rate keine Unwetterlage.',
    tool: tool('warn', 'DWD fehlt', 'error'),
    lastTool: 'world',
  }
}

function summarizeWarn(json: Record<string, unknown>): string | null {
  const warnings = json.warnings
  const list = Array.isArray(warnings)
    ? warnings
    : warnings && typeof warnings === 'object'
      ? Object.values(warnings as Record<string, unknown>)
      : []
  const flat: Array<Record<string, unknown>> = []
  for (const row of list) {
    if (Array.isArray(row)) {
      for (const inner of row) {
        if (inner && typeof inner === 'object') flat.push(inner as Record<string, unknown>)
      }
    } else if (row && typeof row === 'object') flat.push(row as Record<string, unknown>)
  }
  if (!flat.length) return 'Keine aktuelle DWD-Unwetterwarnung in der Liste.'
  const s = loadSettings()
  const place = (s.last_place || '').toLowerCase()
  const land = landFromPlace(s.last_place || '')
  const landLabel = land ? landName(land).toLowerCase() : ''
  const local = place
    ? flat.filter((row) => {
        const blob = JSON.stringify(row).toLowerCase()
        return (place.length >= 3 && blob.includes(place)) || (landLabel && blob.includes(landLabel))
      })
    : []
  const use = local.length ? local : flat
  const first = use[0]
  const head = String(first.headline || first.event || first.description || '').replace(/\s+/g, ' ').trim()
  if (!head) return 'Keine aktuelle DWD-Unwetterwarnung in der Liste.'
  const more = use.length > 1 ? ` ${use.length} Einträge bei DWD.` : ''
  const scope = local.length
    ? ` Für ${s.last_place}.`
    : place
      ? ` Keine treffgenaue Warnung für ${s.last_place} — bundesweit.`
      : ' Quelle DWD, bundesweit (Ort in der Wetterfrage hilft).'
  return `${head.slice(0, 220)}.${scope}${more}`
}

async function ferien(land?: string): Promise<Hit> {
  const code = land || landFromPlace(loadSettings().last_place) || 'BW'
  const year = new Date().getFullYear()
  const rows = (await ferienFromDe(code, year)) || (await ferienFromOpenHolidays(code, year))
  if (!rows) {
    return {
      handled: true,
      reply: 'Die Ferien-API antwortet nicht. Ich rate keine Termine.',
      tool: tool('ferien', 'Ferien fehlt', 'error'),
      lastTool: 'world',
    }
  }
  const today = isoDate(new Date())
  const now = rows.find((r) => r.start && r.end && r.start <= today && today <= r.end)
  const next = rows.find((r) => r.start && r.start > today)
  const name = landName(code)
  if (now) {
    return {
      handled: true,
      reply: `In ${name} sind ${now.name || 'Ferien'} bis ${fmtDay(now.end || '')}. Quelle Schulferien.`,
      tool: tool('ferien', 'Ferien'),
      lastTool: 'world',
    }
  }
  if (next) {
    return {
      handled: true,
      reply: `In ${name} als Nächstes ${next.name || 'Ferien'} ab ${fmtDay(next.start || '')}. Quelle Schulferien.`,
      tool: tool('ferien', 'Ferien'),
      lastTool: 'world',
    }
  }
  return {
    handled: true,
    reply: `Für ${name} ${year} keine weiteren Ferien in der Liste.`,
    tool: tool('ferien', 'Ferien'),
    lastTool: 'world',
  }
}

type FerienRow = { name?: string; start?: string; end?: string }

async function ferienFromDe(code: string, year: number): Promise<FerienRow[] | null> {
  try {
    const { status, json } = await getJson(`https://ferien-api.de/api/v1/holidays/${code}/${year}`, UA)
    if (status < 200 || status >= 300) return null
    const raw = Array.isArray(json)
      ? json
      : Array.isArray((json as { data?: unknown }).data)
        ? ((json as { data: unknown[] }).data)
        : []
    const rows = (raw as Array<{ name?: string; start?: string; end?: string }>)
      .map((r) => ({ name: r.name, start: r.start?.slice(0, 10), end: r.end?.slice(0, 10) }))
      .filter((r) => r.start && r.end)
    return rows.length ? rows : null
  } catch {
    return null
  }
}

async function ferienFromOpenHolidays(code: string, year: number): Promise<FerienRow[] | null> {
  const sub = openHolidayLand(code)
  if (!sub) return null
  try {
    const q = new URLSearchParams({
      countryIsoCode: 'DE',
      subdivisionCode: sub,
      validFrom: `${year}-01-01`,
      validTo: `${year}-12-31`,
    })
    const { status, json } = await getJson(`https://openholidaysapi.org/SchoolHolidays?${q}`, UA)
    if (status < 200 || status >= 300) return null
    const raw = Array.isArray(json) ? json : []
    const rows = (raw as Array<{ startDate?: string; endDate?: string; name?: Array<{ text?: string }> }>)
      .map((r) => ({
        name: r.name?.find((n) => n.text)?.text || 'Ferien',
        start: r.startDate?.slice(0, 10),
        end: r.endDate?.slice(0, 10),
      }))
      .filter((r) => r.start && r.end)
      .sort((a, b) => String(a.start).localeCompare(String(b.start)))
    return rows.length ? rows : null
  } catch {
    return null
  }
}

function openHolidayLand(code: string): string | null {
  const map: Record<string, string> = {
    BW: 'DE-BW',
    BY: 'DE-BY',
    BE: 'DE-BE',
    BB: 'DE-BB',
    HB: 'DE-HB',
    HH: 'DE-HH',
    HE: 'DE-HE',
    MV: 'DE-MV',
    NI: 'DE-NI',
    NW: 'DE-NW',
    RP: 'DE-RP',
    SL: 'DE-SL',
    SN: 'DE-SN',
    ST: 'DE-ST',
    SH: 'DE-SH',
    TH: 'DE-TH',
  }
  return map[code] || null
}

async function fx(from: string, to: string): Promise<Hit> {
  try {
    const { status, json } = await getJson(`https://api.frankfurter.app/latest?from=${from}&to=${to}`, UA)
    if (status < 200 || status >= 300) throw new Error('fx')
    const rates = json.rates as Record<string, number> | undefined
    const rate = rates?.[to]
    if (!Number.isFinite(rate)) throw new Error('fx')
    const date = String(json.date || '')
    return {
      handled: true,
      reply: `1 ${from} = ${rate} ${to}${date ? ` (${date})` : ''}. EZB über frankfurter.app.`,
      tool: tool('fx', 'Kurs'),
      lastTool: 'world',
    }
  } catch {
    return {
      handled: true,
      reply: 'Wechselkurs gerade nicht da. Ich rate keinen Dollar.',
      tool: tool('fx', 'Kurs fehlt', 'error'),
      lastTool: 'world',
    }
  }
}

async function food(query: string): Promise<Hit> {
  if (!query) {
    return {
      handled: true,
      reply: 'Produktname oder EAN sagen — oder Foto. Ohne Treffer bei Open Food Facts rate ich nicht, ob es essbar ist.',
      tool: tool('food', 'Food Facts'),
      lastTool: 'world',
    }
  }
  try {
    const q = encodeURIComponent(query.slice(0, 80))
    const url = /^\d{8,14}$/.test(query)
      ? `https://world.openfoodfacts.org/api/v0/product/${query}.json`
      : `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=1`
    const { status, json } = await getJson(url, UA)
    if (status < 200 || status >= 300) throw new Error('food')
    const product =
      json.product && typeof json.product === 'object'
        ? (json.product as Record<string, unknown>)
        : Array.isArray(json.products)
          ? (json.products[0] as Record<string, unknown> | undefined)
          : undefined
    if (!product) {
      return {
        handled: true,
        reply: 'Kein Treffer bei Open Food Facts. Unbekannt bleibt unbekannt.',
        tool: tool('food', 'Food Facts', 'error'),
        lastTool: 'world',
      }
    }
    const name = String(product.product_name || product.brands || query).trim()
    const brand = String(product.brands || '').trim()
    const link = String(product.url || `https://world.openfoodfacts.org/product/${product.code || query}`)
    return {
      handled: true,
      reply: `${name}${brand ? ` (${brand})` : ''}. ${link}`,
      tool: tool('food', 'Food Facts'),
      lastTool: 'world',
    }
  } catch {
    return {
      handled: true,
      reply: 'Open Food Facts nicht erreichbar. Keine Essbarkeit raten.',
      tool: tool('food', 'Food Facts fehlt', 'error'),
      lastTool: 'world',
    }
  }
}

async function book(query: string): Promise<Hit> {
  if (!query) {
    return {
      handled: true,
      reply: 'Welcher Titel? Ohne Treffer bei Open Library erfinde ich kein Buch.',
      tool: tool('book', 'Library'),
      lastTool: 'world',
    }
  }
  try {
    const q = encodeURIComponent(query.slice(0, 80))
    const { status, json } = await getJson(`https://openlibrary.org/search.json?q=${q}&limit=1`, UA)
    if (status < 200 || status >= 300) throw new Error('book')
    const doc = Array.isArray(json.docs) ? (json.docs[0] as Record<string, unknown> | undefined) : undefined
    if (!doc) {
      return {
        handled: true,
        reply: 'Kein Treffer bei Open Library.',
        tool: tool('book', 'Library', 'error'),
        lastTool: 'world',
      }
    }
    const title = String(doc.title || query)
    const author = Array.isArray(doc.author_name) ? String(doc.author_name[0] || '') : ''
    const year = doc.first_publish_year ? String(doc.first_publish_year) : ''
    const key = String(doc.key || '')
    const link = key ? `https://openlibrary.org${key}` : 'https://openlibrary.org'
    return {
      handled: true,
      reply: `${title}${author ? ` — ${author}` : ''}${year ? `, ${year}` : ''}. ${link}`,
      tool: tool('book', 'Library'),
      lastTool: 'world',
    }
  } catch {
    return {
      handled: true,
      reply: 'Open Library antwortet nicht. Keinen Autor erfinden.',
      tool: tool('book', 'Library fehlt', 'error'),
      lastTool: 'world',
    }
  }
}

async function sport(query: string, league = 'bl1'): Promise<Hit> {
  const year = new Date().getFullYear()
  const season = new Date().getMonth() >= 6 ? year : year - 1
  const code = league || 'bl1'
  try {
    const { status, json } = await getJson(`https://api.openligadb.de/getmatchdata/${code}/${season}`, UA)
    if (status < 200 || status >= 300) throw new Error('sport')
    const rows = Array.isArray(json)
      ? (json as unknown as Array<{
          team1?: { teamName?: string }
          team2?: { teamName?: string }
          matchResults?: Array<{ pointsTeam1?: number; pointsTeam2?: number }>
          matchIsFinished?: boolean
          matchDateTime?: string
        }>)
      : []
    if (!rows.length) throw new Error('empty')
    const needle = clubNeedle(query)
    const hit =
      rows
        .filter((m) => {
          const a = m.team1?.teamName || ''
          const b = m.team2?.teamName || ''
          return !needle || a.toLowerCase().includes(needle) || b.toLowerCase().includes(needle)
        })
        .sort((a, b) => String(b.matchDateTime || '').localeCompare(String(a.matchDateTime || '')))[0] || rows[0]
    const a = hit.team1?.teamName || 'Heim'
    const b = hit.team2?.teamName || 'Gast'
    const res = (hit.matchResults || []).at(-1)
    if (!hit.matchIsFinished || res?.pointsTeam1 == null) {
      return {
        handled: true,
        reply: `${a} gegen ${b} — noch kein Endergebnis in OpenLigaDB.`,
        tool: tool('sport', 'Bundesliga'),
        lastTool: 'world',
      }
    }
    return {
      handled: true,
      reply: `${a} ${res.pointsTeam1}:${res.pointsTeam2} ${b}. OpenLigaDB, kein Tipp.`,
      tool: tool('sport', 'Bundesliga'),
      lastTool: 'world',
    }
  } catch {
    return {
      handled: true,
      reply: 'OpenLigaDB nicht erreichbar. Keine Tore erfinden.',
      tool: tool('sport', 'Sport fehlt', 'error'),
      lastTool: 'world',
    }
  }
}

function clubNeedle(q: string): string {
  const map: Array<[RegExp, string]> = [
    [/\bvfb|stuttgart\b/i, 'stuttgart'],
    [/\bbayern\b/i, 'bayern'],
    [/\bdortmund|bvb\b/i, 'dortmund'],
    [/\bleipzig\b/i, 'leipzig'],
    [/\bleverkusen\b/i, 'leverkusen'],
    [/\bfrankfurt\b/i, 'frankfurt'],
    [/\bunion\b/i, 'union'],
    [/\bwolfsburg\b/i, 'wolfsburg'],
    [/\bhoffenheim\b/i, 'hoffenheim'],
    [/\baugsburg\b/i, 'augsburg'],
    [/\bmainz\b/i, 'mainz'],
    [/\bfreiburg\b/i, 'freiburg'],
    [/\bgladbach\b/i, 'gladbach'],
    [/\bköln|koeln\b/i, 'köln'],
  ]
  for (const [re, n] of map) {
    if (re.test(q)) return n
  }
  return ''
}

async function taxa(query: string, kind: 'pflanze' | 'vogel'): Promise<Hit> {
  if (!query) {
    return {
      handled: true,
      reply:
        kind === 'pflanze'
          ? 'Pflanze nennen oder Foto. Ohne iNaturalist-Treffer keine Essbarkeit.'
          : 'Vogel oder Tier nennen. Ohne Clip und ohne Treffer keine Art erfinden.',
      tool: tool(kind, kind === 'pflanze' ? 'Pflanze' : 'Tier'),
      lastTool: 'world',
    }
  }
  try {
    const q = encodeURIComponent(query.slice(0, 80))
    const { status, json } = await getJson(`https://api.inaturalist.org/v1/taxa?q=${q}&per_page=1`, UA)
    if (status < 200 || status >= 300) throw new Error('taxa')
    const row = Array.isArray(json.results) ? (json.results[0] as Record<string, unknown> | undefined) : undefined
    if (!row) {
      return {
        handled: true,
        reply: 'Kein Treffer bei iNaturalist. Unbekannt.',
        tool: tool(kind, 'iNaturalist', 'error'),
        lastTool: 'world',
      }
    }
    const name = String(row.preferred_common_name || row.name || query)
    const latin = String(row.name || '')
    const id = row.id
    const link = id ? `https://www.inaturalist.org/taxa/${id}` : 'https://www.inaturalist.org'
    return {
      handled: true,
      reply: `${name}${latin && latin !== name ? ` (${latin})` : ''}. ${link} Keine Essbarkeit.`,
      tool: tool(kind, 'iNaturalist'),
      lastTool: 'world',
    }
  } catch {
    return {
      handled: true,
      reply: 'iNaturalist nicht erreichbar. Keine Art raten.',
      tool: tool(kind, 'iNaturalist fehlt', 'error'),
      lastTool: 'world',
    }
  }
}

async function iss(): Promise<Hit> {
  try {
    const { status, json } = await getJson('https://api.open-notify.org/iss-now.json', UA)
    if (status < 200 || status >= 300) throw new Error('iss')
    const pos = json.iss_position as { latitude?: string; longitude?: string } | undefined
    const lat = Number(pos?.latitude)
    const lon = Number(pos?.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('iss')
    return {
      handled: true,
      reply: `ISS gerade bei ${lat.toFixed(1)}°, ${lon.toFixed(1)}° (Open Notify). Überflug lokal hängt vom Horizont ab, den rechne ich nicht.`,
      tool: tool('iss', 'ISS'),
      lastTool: 'world',
    }
  } catch {
    return {
      handled: true,
      reply: 'ISS-Position nicht da. Open Notify schweigt.',
      tool: tool('iss', 'ISS fehlt', 'error'),
      lastTool: 'world',
    }
  }
}

function moon(): Promise<Hit> {
  const now = new Date()
  const synodic = 29.530588
  const known = Date.UTC(2000, 0, 6, 18, 14) / 86400000
  const day = now.getTime() / 86400000
  const age = ((day - known) % synodic + synodic) % synodic
  const phase =
    age < 1.8
      ? 'Neumond'
      : age < 6.4
        ? 'zunehmende Sichel'
        : age < 8.4
          ? 'zunehmender Halbmond'
          : age < 13.8
            ? 'zunehmend'
            : age < 16.6
              ? 'Vollmond'
              : age < 21.9
                ? 'abnehmend'
                : age < 23.9
                  ? 'abnehmender Halbmond'
                  : 'abnehmende Sichel'
  return Promise.resolve({
    handled: true,
    reply: `Mondphase grob ${phase} (lokale Rechnung aus dem Datum, keine NASA-Live-API).`,
    tool: tool('moon', 'Mond'),
    lastTool: 'world',
  })
}

async function flights(): Promise<Hit> {
  const here = await resolveWeatherHere()
  if (!here.ok) {
    return {
      handled: true,
      reply: here.message,
      tool: tool('flights', 'OpenSky', 'error'),
      lastTool: 'world',
    }
  }
  const { lat, lon } = here.fix
  const d = 0.35
  try {
    const q = `lamin=${lat - d}&lomin=${lon - d}&lamax=${lat + d}&lomax=${lon + d}`
    const { status, json } = await getJson(`https://opensky-network.org/api/states/all?${q}`, UA)
    if (status < 200 || status >= 300) throw new Error('sky')
    const states = Array.isArray(json.states) ? (json.states as unknown[]) : []
    if (!states.length) {
      return {
        handled: true,
        reply: `OpenSky: gerade kein Flugzeug im Kasten um ${here.fix.place}.`,
        tool: tool('flights', 'OpenSky'),
        lastTool: 'world',
      }
    }
    const row = states[0] as unknown[]
    const call = String(row[1] || '').trim() || 'unbekannt'
    const alt = Number(row[7])
    const altM = Number.isFinite(alt) ? `${Math.round(alt)} m` : 'Höhe unbekannt'
    return {
      handled: true,
      reply: `OpenSky: ${call}, ${altM}. Keine Passagiere.`,
      tool: tool('flights', 'OpenSky'),
      lastTool: 'world',
    }
  } catch {
    return {
      handled: true,
      reply: 'OpenSky nicht erreichbar. Ich identifiziere keine Passagiere.',
      tool: tool('flights', 'OpenSky fehlt', 'error'),
      lastTool: 'world',
    }
  }
}

async function law(query: string): Promise<Hit> {
  const topic = query.replace(/\b(kündigungsfrist|wohnung|mietrecht|bgb|gesetz|paragraph|was\s+sagt\s+das)\b/gi, ' ').trim() ||
    'Kündigungsfrist Wohnung'
  try {
    const q = encodeURIComponent(`Kündigungsfrist Wohnung BGB ${topic}`.slice(0, 80))
    const { status, text } = await getText(
      `https://de.wikipedia.org/w/api.php?action=opensearch&search=${q}&limit=1&namespace=0&format=json`,
      { Accept: 'application/json', 'User-Agent': UA['User-Agent'] },
    )
    if (status < 200 || status >= 400 || !text) throw new Error('wiki')
    const data = JSON.parse(text) as unknown
    const title = Array.isArray(data) ? String((data[1] as unknown[])?.[0] || '') : ''
    const url = Array.isArray(data) ? String((data[3] as unknown[])?.[0] || '') : ''
    const gist =
      'Wohnraum: gesetzliche Kündigungsfrist oft § 573c BGB — im Vertrag nachlesen. Das ist kein Anwaltsrat. https://www.gesetze-im-internet.de/bgb/__573c.html'
    if (url) {
      return {
        handled: true,
        reply: `${gist} Wikipedia: ${title || 'Mietrecht'} ${url}`,
        tool: tool('law', 'Gesetz'),
        lastTool: 'world',
      }
    }
    return {
      handled: true,
      reply: gist,
      tool: tool('law', 'Gesetz'),
      lastTool: 'world',
    }
  } catch {
    return {
      handled: true,
      reply:
        'Gesetzestext: https://www.gesetze-im-internet.de/bgb/__573c.html — kein Anwaltsrat, nichts erfinden wenn die Seite fehlt.',
      tool: tool('law', 'Gesetz'),
      lastTool: 'world',
    }
  }
}

const WASH: Array<[RegExp, string]> = [
  [/waschschüssel|waschbecken|wanne\s+mit\s+zahl|30\s*°|40\s*°|60\s*°/i, 'Wanne mit Gradzahl: Höchsttemperatur der Wäsche. Quelle festes Pflegesymbol, kein Live-Labor.'],
  [/handwäsche|hand\s+in\s+der\s+wanne/i, 'Hand in der Wanne: Handwäsche. Kein Vollwaschgang.'],
  [/nicht\s+waschen|kreuz\s+durch\s+wanne/i, 'Durchgestrichene Wanne: nicht waschen.'],
  [/trockner|kreis\s+im\s+quadrat/i, 'Kreis im Quadrat: Trockner. Punkte = Temperatur. Durchgestrichen = kein Trockner.'],
  [/bügeleisen|bügeln/i, 'Bügeleisen: Punkte = Hitze. Durchgestrichen = nicht bügeln.'],
  [/bleiche|dreieck/i, 'Dreieck: Bleichen. Durchgestrichen = keine Bleiche. Schrägstriche = Sauerstoffbleiche.'],
  [/reinigung|kreis\s+p|kreis\s+f/i, 'Kreis mit Buchstabe: chemische Reinigung (P, F). Durchgestrichen = keine Reinigung.'],
  [/fettfleck|ölfleck|fett/i, 'Fett: oft Gallseife kalt, nicht heiß fixieren. Kein Universalrezept für jeden Stoff.'],
  [/weinfleck|rotwein/i, 'Rotwein: sofort Wasser, dann haushaltsüblicher Fleckentferner laut Etikett. Kein Wunder-Tipp.'],
]

function house(query: string): Promise<Hit> {
  const hit = WASH.find(([re]) => re.test(query))
  const reply = hit
    ? hit[1]
    : 'Waschsymbol: Wanne = Waschen, Kreis im Quadrat = Trockner, Bügeleisen, Dreieck = Bleiche, Kreis = Reinigung. Ohne klares Symbol rate ich den Stoff nicht.'
  return Promise.resolve({
    handled: true,
    reply,
    tool: tool('house', 'Haushalt'),
    lastTool: 'world',
  })
}

function chess(move?: string, reset?: boolean): Promise<Hit> {
  if (reset || !loadSettings().chess_fen) {
    saveSettings({ chess_fen: START_FEN })
  }
  let state = parseFen(loadSettings().chess_fen || START_FEN)
  if (reset) {
    return Promise.resolve({
      handled: true,
      reply: `Neue Partie.\n${boardText(state)}`,
      tool: tool('chess', 'Schach'),
      lastTool: 'world',
    })
  }
  if (!move) {
    return Promise.resolve({
      handled: true,
      reply: `${boardText(state)}\nZug z. B. e2e4 oder Nf3.`,
      tool: tool('chess', 'Schach'),
      lastTool: 'world',
    })
  }
  const hit = applyMove(state, move)
  if (!hit.ok) {
    return Promise.resolve({
      handled: true,
      reply: `${hit.message}\n${boardText(state)}`,
      tool: tool('chess', 'Schach', 'error'),
      lastTool: 'world',
    })
  }
  saveSettings({ chess_fen: fenOf(hit.next) })
  return Promise.resolve({
    handled: true,
    reply: `${move}: ausgeführt.\n${boardText(hit.next)}`,
    tool: tool('chess', 'Schach'),
    lastTool: 'world',
  })
}

function landFromPlace(place: string): string | null {
  const p = place.toLowerCase()
  if (/baden|württemb|stuttgart|heilbronn|ingersheim|bietigheim/.test(p)) return 'BW'
  if (/bayern|münchen/.test(p)) return 'BY'
  if (/berlin/.test(p)) return 'BE'
  if (/hamburg/.test(p)) return 'HH'
  if (/nrw|köln|düsseldorf/.test(p)) return 'NW'
  return null
}

function landName(code: string): string {
  const map: Record<string, string> = {
    BW: 'Baden-Württemberg',
    BY: 'Bayern',
    BE: 'Berlin',
    BB: 'Brandenburg',
    HB: 'Bremen',
    HH: 'Hamburg',
    HE: 'Hessen',
    MV: 'Mecklenburg-Vorpommern',
    NI: 'Niedersachsen',
    NW: 'Nordrhein-Westfalen',
    RP: 'Rheinland-Pfalz',
    SL: 'Saarland',
    SN: 'Sachsen',
    ST: 'Sachsen-Anhalt',
    SH: 'Schleswig-Holstein',
    TH: 'Thüringen',
  }
  return map[code] || code
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y) return iso
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
