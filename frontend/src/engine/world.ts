import { getJson, getUnknown } from './http-json'
import { landOf } from './holiday'
import { loadSettings } from './store'
import { parseWorldIntent, type WorldKind } from './world-parse'
import { readSensors } from '../native/device'
import type { ToolMeta } from './tools'
import { fillResearchLinks } from './web-search'
import { formatResearchReply, researchHasSources } from './research-parse'

export { parseWorldIntent } from './world-parse'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/2.29.0 (local.jarvis.app)' }

type Hit = { handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }

export async function handleWorld(text: string): Promise<Hit> {
  const intent = parseWorldIntent(text)
  if (!intent) return { handled: false }
  const reply = await run(intent.kind, intent.q, intent)
  return {
    handled: true,
    reply,
    tool: { tool_status: 'executed', tool: 'world', action: intent.kind, label: labelOf(intent.kind) },
    lastTool: 'world',
  }
}

async function run(kind: WorldKind, q: string, extra: { land?: string; move?: string; reset?: boolean }): Promise<string> {
  if (kind === 'dwd') return dwd()
  if (kind === 'ferien') return ferien(extra.land)
  if (kind === 'fx') return fx(q)
  if (kind === 'food') return food(q)
  if (kind === 'library') return library(q)
  if (kind === 'sport') return sport(q)
  if (kind === 'plant') return plant(q)
  if (kind === 'sky') return sky(q)
  if (kind === 'fauna') return fauna(q)
  if (kind === 'flight') return flight()
  if (kind === 'law') return law(q)
  if (kind === 'household') return household(q)
  if (kind === 'sensors') return sensors(q)
  return chess(extra.move, extra.reset)
}

function labelOf(kind: WorldKind): string {
  const m: Record<WorldKind, string> = {
    dwd: 'Unwetter',
    ferien: 'Ferien',
    fx: 'Kurs',
    food: 'Lebensmittel',
    library: 'Buch',
    sport: 'Sport',
    plant: 'Pflanze',
    sky: 'Himmel',
    fauna: 'Tier',
    flight: 'Flug',
    law: 'Gesetz',
    household: 'Haushalt',
    sensors: 'Sensor',
    chess: 'Schach',
  }
  return m[kind]
}

async function dwd(): Promise<string> {
  const s = loadSettings()
  const lat = Number(s.last_lat)
  const lon = Number(s.last_lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return 'Ohne Standort keine DWD-Warnung für Ihren Ort. Freigabe oder „Wo bin ich?“ — ich rate die Lage nicht.'
  }
  try {
    const { status, json } = await getJson(
      `https://api.brightsky.dev/alerts?lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}`,
      UA,
    )
    if (status < 200 || status >= 300) return 'Die DWD-Warnungen sind gerade nicht da. Eine Warnung würde ich nicht erfinden.'
    const alerts = Array.isArray((json as { alerts?: unknown }).alerts)
      ? ((json as { alerts: Array<{ event?: string; headline?: string; severity?: string; expires?: string }> }).alerts)
      : []
    const place = (s.last_place || 'Ihrem Ort').trim()
    if (!alerts.length) return `Für ${place} liegt gerade keine Unwetterwarnung vor (Bright Sky/DWD).`
    const top = alerts.slice(0, 3).map((a) => {
      const ev = String(a.headline || a.event || 'Warnung').trim()
      const until = a.expires ? ` bis ${fmtWhen(a.expires)}` : ''
      return `${ev}${until}`
    })
    return `Warnlage ${place}: ${top.join(' ')} Quelle Bright Sky, DWD.`
  } catch {
    return 'Die Warnlage ist nicht erreichbar. Ich rate kein Unwetter.'
  }
}

async function ferien(landWord?: string): Promise<string> {
  const code = ferienCode(landWord) || ferienCodeFromPlace(loadSettings().last_place || '') || 'BW'
  const year = new Date().getFullYear()
  try {
    const { status, data } = await getUnknown(`https://ferien-api.de/api/v1/holidays/${code}/${year}`, UA)
    if (status < 200 || status >= 300 || !Array.isArray(data)) {
      return `Die Ferienliste für ${code} ist nicht da. Ob frei ist, würde ich nicht raten.`
    }
    const today = isoDay(new Date())
    const rows = data as Array<{ start?: string; end?: string; name?: string }>
    const now = rows.find((r) => String(r.start || '').slice(0, 10) <= today && String(r.end || '').slice(0, 10) >= today)
    if (now) {
      return `In ${code} sind gerade ${now.name || 'Schulferien'}, bis ${fmtDay(String(now.end).slice(0, 10))}. Quelle ferien-api.de.`
    }
    const next = rows.find((r) => String(r.start || '').slice(0, 10) > today)
    if (next) {
      return `In ${code} gerade keine Schulferien. Als Nächstes ${next.name || 'Ferien'} ab ${fmtDay(String(next.start).slice(0, 10))}.`
    }
    return `Für ${code} ${year} stehen in der Liste keine weiteren Schulferien.`
  } catch {
    return 'Die Ferien-API antwortet nicht. Ich rate nicht, ob Schule ist.'
  }
}

async function fx(q: string): Promise<string> {
  const pair = fxPair(q)
  try {
    const { status, json } = await getJson(
      `https://api.frankfurter.app/latest?from=${pair.from}&to=${pair.to}`,
      UA,
    )
    if (status < 200 || status >= 300) return 'Der EZB-Kurs ist gerade nicht da. Einen Wechselkurs würde ich nicht schätzen.'
    const rates = json.rates && typeof json.rates === 'object' ? (json.rates as Record<string, number>) : {}
    const val = rates[pair.to]
    const date = String(json.date || '')
    if (typeof val !== 'number') return 'In der EZB-Liste steht dieser Kurs nicht.'
    return `Ein ${pair.from} sind ${val.toFixed(4)} ${pair.to} (EZB ${date || 'heute'}, frankfurter.app).`
  } catch {
    return 'Kein EZB-Kurs erreichbar. Ich nenne keinen erfundenen Dollar.'
  }
}

async function food(q: string): Promise<string> {
  const term = q.replace(/.*produkt\s+/i, '').replace(/^(?:was ist das für ein|open food facts)\s*/i, '').trim() || q
  const search = encodeURIComponent(term.slice(0, 80))
  try {
    const { status, json } = await getJson(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${search}&search_simple=1&action=process&json=1&page_size=3`,
      { ...UA, 'User-Agent': 'Jarvis/2.29.0 - https://github.com/Gamerio2904/Jarvis' },
    )
    if (status < 200 || status >= 300) return 'Open Food Facts ist nicht da. Ein Produkt würde ich nicht erraten.'
    const products = Array.isArray((json as { products?: unknown }).products)
      ? ((json as { products: Array<{ product_name?: string; brands?: string; nutriments?: { 'energy-kcal_100g'?: number } }> }).products)
      : []
    const hit = products.find((p) => p.product_name)
    if (!hit) return `Dazu steht bei Open Food Facts nichts unter „${term.slice(0, 40)}“. Unbekannt bleibt unbekannt.`
    const kcal = hit.nutriments?.['energy-kcal_100g']
    const extra = typeof kcal === 'number' ? ` ${Math.round(kcal)} kcal/100 g.` : ''
    return `${hit.product_name}${hit.brands ? `, ${hit.brands}` : ''}.${extra} Quelle Open Food Facts.`
  } catch {
    return 'Open Food Facts nicht erreichbar. Essbarkeit behaupte ich nicht.'
  }
}

async function library(q: string): Promise<string> {
  const term = q.replace(/.*buch\s+/i, '').replace(/^(?:was ist das für ein|open library)\s*/i, '').trim() || q
  try {
    const { status, json } = await getJson(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(term.slice(0, 80))}&limit=3`,
      UA,
    )
    if (status < 200 || status >= 300) return 'Open Library antwortet nicht. Einen Titel würde ich nicht erfinden.'
    const docs = Array.isArray((json as { docs?: unknown }).docs)
      ? ((json as { docs: Array<{ title?: string; author_name?: string[]; first_publish_year?: number }> }).docs)
      : []
    const hit = docs.find((d) => d.title)
    if (!hit) return `Open Library kennt „${term.slice(0, 40)}“ so nicht.`
    const author = hit.author_name?.[0] ? ` von ${hit.author_name[0]}` : ''
    const year = hit.first_publish_year ? `, ${hit.first_publish_year}` : ''
    return `${hit.title}${author}${year}. Quelle Open Library.`
  } catch {
    return 'Open Library nicht erreichbar.'
  }
}

async function sport(q: string): Promise<string> {
  const year = new Date().getFullYear()
  const league = /\b(2\.?\s*liga|zweite)\b/i.test(q) ? 'bl2' : 'bl1'
  try {
    let { status, data } = await getUnknown(`https://api.openligadb.de/getmatchdata/${league}/${year}`, UA)
    if ((status < 200 || status >= 300 || !Array.isArray(data) || !data.length) && year > 2020) {
      const prev = await getUnknown(`https://api.openligadb.de/getmatchdata/${league}/${year - 1}`, UA)
      status = prev.status
      data = prev.data
    }
    if (status < 200 || status >= 300 || !Array.isArray(data)) {
      return 'OpenLigaDB liefert gerade keine Spiele. Ein Ergebnis würde ich nicht erfinden.'
    }
    const rows = data as Array<{
      team1?: { teamName?: string }
      team2?: { teamName?: string }
      matchResults?: Array<{ pointsTeam1?: number; pointsTeam2?: number; resultTypeId?: number }>
      matchDateTime?: string
      matchIsFinished?: boolean
    }>
    const needle = teamNeedle(q)
    const finished = rows.filter((r) => r.matchIsFinished)
    const pool = needle
      ? finished.filter((r) => nameOf(r).toLowerCase().includes(needle))
      : finished
    const hit = pool[pool.length - 1] || finished[finished.length - 1]
    if (!hit) return 'In der Liga-Liste steht noch kein fertiges Spiel.'
    const res = (hit.matchResults || []).find((x) => x.resultTypeId === 2) || hit.matchResults?.slice(-1)[0]
    const a = hit.team1?.teamName || 'Heim'
    const b = hit.team2?.teamName || 'Gast'
    if (!res || res.pointsTeam1 == null || res.pointsTeam2 == null) {
      return `${a} gegen ${b} steht ohne Endstand in OpenLigaDB.`
    }
    return `${a} ${res.pointsTeam1}:${res.pointsTeam2} ${b}. Quelle OpenLigaDB, kein Tipp.`
  } catch {
    return 'OpenLigaDB nicht erreichbar. Kein erfundenes Tor.'
  }
}

async function plant(q: string): Promise<string> {
  const term = q.replace(/.*(?:pflanze|kraut|garten)\s+/i, '').trim() || q
  try {
    const { status, json } = await getJson(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(term.slice(0, 60))}&rank=species,genus&per_page=3`,
      UA,
    )
    if (status < 200 || status >= 300) return 'iNaturalist ist nicht da. Eine Art würde ich nicht raten, und essbar sage ich nicht.'
    const results = Array.isArray((json as { results?: unknown }).results)
      ? ((json as { results: Array<{ preferred_common_name?: string; name?: string; wikipedia_url?: string }> }).results)
      : []
    const hit = results.find((r) => r.name)
    if (!hit) return `Keine Art zu „${term.slice(0, 40)}“. Foto hilft nur mit Treffer — Giftpilze gebe ich nicht frei.`
    const common = hit.preferred_common_name ? `${hit.preferred_common_name}, ` : ''
    const wiki = hit.wikipedia_url ? ` ${hit.wikipedia_url}` : ''
    return `${common}${hit.name}.${wiki} Quelle iNaturalist. Ob essbar, sage ich nicht.`
  } catch {
    return 'Pflanzenbestimmung nicht erreichbar. Keine Essbarkeit.'
  }
}

async function sky(q: string): Promise<string> {
  if (/\bmond/i.test(q)) return `Mondphase heute: ${moonPhase(new Date())}. Lokal gerechnet, kein Live-Foto.`
  try {
    const { status, json } = await getJson('https://api.wheretheiss.at/v1/satellites/25544', UA)
    if (status < 200 || status >= 300) return 'Die ISS-Position ist nicht da. Eine Überflugzeit würde ich nicht schätzen.'
    const lat = Number(json.latitude)
    const lon = Number(json.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 'ISS ohne Koordinaten in der Quelle.'
    return `Die ISS steht laut Where The ISS At bei ${lat.toFixed(1)}°, ${lon.toFixed(1)}°. Sichtbarkeit überm Haus rechne ich daraus nicht.`
  } catch {
    return 'ISS-Dienst nicht erreichbar.'
  }
}

async function fauna(q: string): Promise<string> {
  const term = q.replace(/.*(?:vogel|tier)\s+/i, '').trim() || q
  try {
    const { status, json } = await getJson(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(term.slice(0, 60))}&rank=species&per_page=3`,
      UA,
    )
    if (status < 200 || status >= 300) return 'Ohne Treffer bleibt die Art offen. Ich bestimme nichts aus der Luft.'
    const results = Array.isArray((json as { results?: unknown }).results)
      ? ((json as { results: Array<{ preferred_common_name?: string; name?: string }> }).results)
      : []
    const hit = results.find((r) => r.name)
    if (!hit) return `Keine Art zu „${term.slice(0, 40)}“. Ohne Clip oder klares Foto keine Bestimmung.`
    return `${hit.preferred_common_name || hit.name} (${hit.name}). Quelle iNaturalist.`
  } catch {
    return 'Tierbestimmung nicht erreichbar.'
  }
}

async function flight(): Promise<string> {
  const s = loadSettings()
  const lat = Number(s.last_lat)
  const lon = Number(s.last_lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return 'Ohne GPS sage ich nicht, was überm Haus fliegt. Freigabe oder Ort.'
  }
  const d = 0.6
  const url = `https://opensky-network.org/api/states/all?lamin=${(lat - d).toFixed(3)}&lomin=${(lon - d).toFixed(3)}&lamax=${(lat + d).toFixed(3)}&lomax=${(lon + d).toFixed(3)}`
  try {
    const { status, json } = await getJson(url, UA)
    if (status === 401 || status === 403) return 'OpenSky will gerade Anmeldung. Ohne Daten kein Flugzeug raten.'
    if (status < 200 || status >= 300) return 'OpenSky antwortet nicht. Was da fliegt, bleibt offen.'
    const states = Array.isArray(json.states) ? (json.states as unknown[]) : []
    if (!states.length) return 'Im Umkreis von etwa 60 km meldet OpenSky gerade keinen Flug.'
    const row = states[0]
    const call = Array.isArray(row) ? String(row[1] || '').trim() : ''
    const alt = Array.isArray(row) && typeof row[7] === 'number' ? Math.round(Number(row[7])) : null
    const who = call || 'ein Flug'
    const height = alt != null ? ` in rund ${alt} Metern` : ''
    return `${who}${height}, laut OpenSky. Keine Passagiere.`
  } catch {
    return 'OpenSky nicht erreichbar.'
  }
}

async function law(q: string): Promise<string> {
  const query = /\bkündigungsfrist\b/i.test(q) ? 'BGB Kündigungsfrist Wohnung § 573c' : q
  const research = await fillResearchLinks(`${query} site:gesetze-im-internet.de`, '', {
    query,
    used: false,
    status: 'empty',
    sources: [],
  })
  if (!researchHasSources(research)) {
    return 'Dazu habe ich keinen Gesetzestext mit Link. Anwalts-Rat gebe ich nicht.'
  }
  const body = formatResearchReply(query, research.sources || [], false)
  return `${body} Das ist der Text, kein Mandat und kein „Sie sollten klagen“.`
}

function household(q: string): string {
  const t = q.toLowerCase()
  if (/waschschüssel|waschbottich|wanne/.test(t)) {
    return 'Die Waschschüssel auf dem Etikett ist das Waschsymbol: Zahl darin = Höchsttemperatur in Grad. Hand in der Schüssel = Handwäsche. Durchgekreuzt = nicht waschen. Kein Live-Labor, festes Wissen.'
  }
  if (/bügelsymbol|eisen/.test(t)) {
    return 'Das Bügeleisen: Punkte sind die Temperatur, durchgekreuzt heißt nicht bügeln.'
  }
  if (/fleck/.test(t)) {
    return 'Für Flecken gilt: erst Etikett, dann kalt vorklopfen. Spezielle Chemie würde ich nicht erfinden — ohne Quelle kein Mittel.'
  }
  return 'Haushaltssymbol: Waschschüssel, Dreieck Bleichen, Kreis Reinigen, Quadrat Trocknen. Unklares Zeichen = Foto oder ehrlich unklar.'
}

async function sensors(q: string): Promise<string> {
  const s = await readSensors()
  if (!s.ok) return s.message || 'Sensoren nur auf dem Handy, und nur mit Freigabe.'
  const parts: string[] = []
  if (/\bschritt/i.test(q)) {
    parts.push(s.steps != null ? `Schritte seit Boot: ${s.steps}.` : 'Schrittzähler nicht lesbar. Keine Gesundheitsdiagnose.')
  }
  if (/\bluftdruck|barometer/i.test(q)) {
    parts.push(s.pressureHpa != null ? `Luftdruck ${s.pressureHpa.toFixed(1)} hPa.` : 'Kein Barometer an diesem Gerät.')
  }
  if (/\bkompass|nord/i.test(q)) {
    parts.push(s.heading != null ? `Kompass etwa ${Math.round(s.heading)} Grad (0 ist Nord).` : 'Kompass nicht lesbar.')
  }
  if (!parts.length) {
    if (s.steps != null) parts.push(`Schritte ${s.steps}.`)
    if (s.pressureHpa != null) parts.push(`${s.pressureHpa.toFixed(1)} hPa.`)
    if (s.heading != null) parts.push(`Richtung ${Math.round(s.heading)}°.`)
  }
  return parts.length ? `${parts.join(' ')} Lokal am Gerät.` : 'Sensor ohne Wert. Ich schätze keinen Fitness-Stand.'
}

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

let chessFen = START_FEN

function chess(move?: string, reset?: boolean): string {
  if (reset) {
    chessFen = START_FEN
    return 'Neues Spiel. Weiß am Zug. Sagen Sie zum Beispiel Schach e2e4.'
  }
  if (!move) return `Stellung: ${chessFen}. Zug als e2e4.`
  const next = applyMove(chessFen, move)
  if (!next.ok) return next.message || 'Ungültiger Zug.'
  chessFen = next.fen
  return `Zug ${move}. ${next.fen}`
}

function applyMove(fen: string, uci: string): { ok: boolean; fen: string; message?: string } {
  const m = /^([a-h])([1-8])([a-h])([1-8])([qrnb])?$/.exec(uci)
  if (!m) return { ok: false, fen, message: 'Zug unklar. Notation e2e4.' }
  const board = fenToBoard(fen)
  const from = sq(m[1], m[2])
  const to = sq(m[3], m[4])
  const piece = board[from]
  if (!piece) return { ok: false, fen, message: 'Auf dem Startfeld steht nichts.' }
  const white = piece === piece.toUpperCase()
  const turn = fen.split(' ')[1] === 'w'
  if (white !== turn) return { ok: false, fen, message: turn ? 'Weiß ist am Zug.' : 'Schwarz ist am Zug.' }
  if (!pseudoLegal(board, from, to, piece)) return { ok: false, fen, message: 'Der Zug ist so nicht legal.' }
  board[to] = m[5] ? (white ? m[5].toUpperCase() : m[5]) : piece
  board[from] = ''
  const parts = fen.split(' ')
  parts[0] = boardToFen(board)
  parts[1] = white ? 'b' : 'w'
  const full = Number(parts[5] || '1')
  if (!white) parts[5] = String(full + 1)
  return { ok: true, fen: parts.join(' ') }
}

function sq(file: string, rank: string): number {
  return (Number(rank) - 1) * 8 + (file.charCodeAt(0) - 97)
}

function fenToBoard(fen: string): string[] {
  const rows = fen.split(' ')[0].split('/')
  const board: string[] = Array(64).fill('')
  for (let r = 0; r < 8; r += 1) {
    let c = 0
    for (const ch of rows[7 - r] || '') {
      if (/\d/.test(ch)) c += Number(ch)
      else {
        board[r * 8 + c] = ch
        c += 1
      }
    }
  }
  return board
}

function boardToFen(board: string[]): string {
  const rows: string[] = []
  for (let r = 7; r >= 0; r -= 1) {
    let empty = 0
    let line = ''
    for (let c = 0; c < 8; c += 1) {
      const p = board[r * 8 + c]
      if (!p) empty += 1
      else {
        if (empty) line += String(empty)
        empty = 0
        line += p
      }
    }
    if (empty) line += String(empty)
    rows.push(line)
  }
  return rows.join('/')
}

function pseudoLegal(board: string[], from: number, to: number, piece: string): boolean {
  if (to < 0 || to > 63 || from === to) return false
  const dest = board[to]
  const white = piece === piece.toUpperCase()
  if (dest && (dest === dest.toUpperCase()) === white) return false
  const df = (to % 8) - (from % 8)
  const dr = Math.floor(to / 8) - Math.floor(from / 8)
  const k = piece.toLowerCase()
  if (k === 'n') return (Math.abs(df) === 1 && Math.abs(dr) === 2) || (Math.abs(df) === 2 && Math.abs(dr) === 1)
  if (k === 'k') return Math.abs(df) <= 1 && Math.abs(dr) <= 1
  if (k === 'p') {
    const dir = white ? 1 : -1
    if (df === 0 && !dest && dr === dir) return true
    if (df === 0 && !dest && dr === 2 * dir && board[from + dir * 8] === '' && (white ? Math.floor(from / 8) === 1 : Math.floor(from / 8) === 6))
      return true
    if (Math.abs(df) === 1 && dr === dir && dest) return true
    return false
  }
  const stepF = Math.sign(df)
  const stepR = Math.sign(dr)
  if (k === 'b' && Math.abs(df) !== Math.abs(dr)) return false
  if (k === 'r' && df !== 0 && dr !== 0) return false
  if (k === 'q' && df !== 0 && dr !== 0 && Math.abs(df) !== Math.abs(dr)) return false
  if (k === 'b' || k === 'r' || k === 'q') {
    let f = (from % 8) + stepF
    let r = Math.floor(from / 8) + stepR
    while (f !== to % 8 || r !== Math.floor(to / 8)) {
      if (f < 0 || f > 7 || r < 0 || r > 7) return false
      if (board[r * 8 + f]) return false
      f += stepF
      r += stepR
    }
    return true
  }
  return false
}

function ferienCode(word?: string): string | undefined {
  if (!word) return undefined
  const w = word.toLowerCase()
  if (/baden|bw/.test(w)) return 'BW'
  if (/bayern/.test(w)) return 'BY'
  if (/berlin/.test(w)) return 'BE'
  if (/brandenburg/.test(w)) return 'BB'
  if (/bremen/.test(w)) return 'HB'
  if (/hamburg/.test(w)) return 'HH'
  if (/hessen/.test(w)) return 'HE'
  if (/mecklenburg/.test(w)) return 'MV'
  if (/niedersachsen/.test(w)) return 'NI'
  if (/nordrhein|nrw/.test(w)) return 'NW'
  if (/rheinland/.test(w)) return 'RP'
  if (/saarland/.test(w)) return 'SL'
  if (/sachsen-anhalt/.test(w)) return 'ST'
  if (/sachsen/.test(w)) return 'SN'
  if (/schleswig/.test(w)) return 'SH'
  if (/thüringen|thueringen/.test(w)) return 'TH'
  return undefined
}

function ferienCodeFromPlace(place: string): string | undefined {
  const land = landOf(place)
  return land ? land.replace('DE-', '') : undefined
}

function fxPair(q: string): { from: string; to: string } {
  const t = q.toLowerCase()
  if (/pfund|gbp/.test(t)) return { from: 'GBP', to: 'EUR' }
  if (/yen|jpy/.test(t)) return { from: 'JPY', to: 'EUR' }
  if (/franken|chf/.test(t)) return { from: 'CHF', to: 'EUR' }
  if (/euro\s+in\s+dollar|eur.*usd/.test(t)) return { from: 'EUR', to: 'USD' }
  return { from: 'USD', to: 'EUR' }
}

function teamNeedle(q: string): string {
  const m =
    /\b(bayern|dortmund|leverkusen|leipzig|stuttgart|vfb|frankfurt|wolfsburg|gladbach|union|freiburg|mainz|augsburg|bremen|köln|koeln|heidenheim|hoffenheim|st.? pauli)\b/i.exec(
      q,
    )
  if (!m) return ''
  const w = m[1].toLowerCase()
  if (w === 'vfb') return 'stuttgart'
  return w.replace('ö', 'o').replace('ä', 'a')
}

function nameOf(r: { team1?: { teamName?: string }; team2?: { teamName?: string } }): string {
  return `${r.team1?.teamName || ''} ${r.team2?.teamName || ''}`
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })
}

function fmtWhen(iso: string): string {
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return iso
  return dt.toLocaleString('de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function moonPhase(now: Date): string {
  const syn = 29.53058867
  const known = Date.UTC(2000, 0, 6, 18, 14)
  const age = ((now.getTime() - known) / 86400000) % syn
  const a = age < 0 ? age + syn : age
  if (a < 1.8 || a > 27.7) return 'Neumond'
  if (a < 7.4) return 'zunehmende Sichel'
  if (a < 9.2) return 'zunehmender Halbmond'
  if (a < 13.8) return 'zunehmend'
  if (a < 15.7) return 'Vollmond'
  if (a < 20.3) return 'abnehmend'
  if (a < 22.1) return 'abnehmender Halbmond'
  return 'abnehmende Sichel'
}
