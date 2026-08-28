import { getJson, getText } from './http-json.ts'
import { type ResearchMeta, type ResearchSource } from './research-parse.ts'
import type { ToolMeta } from './tools.ts'
import { loadSettings, persistLastList, saveSettings } from './store.ts'
import { parseOutlookFollowUp, parseOutlookIntent, type OutlookIntent, type OutlookKind } from './outlook-parse.ts'
import { chainSentences, tagLabel, tagNewsText, type OutlookTag } from './outlook-tags.ts'
import {
  cacheFresh,
  fetchBrent,
  fetchFxHistory,
  pickAnalog,
  readE10Spot,
  type E10Spot,
  type FxHistory,
  type OilQuote,
  type SeriesPoint,
} from './outlook-series.ts'
import { buildTourStops, startTour, stopTour, tourChatReply } from './globe-tour.ts'
import { decodeHtml } from './html-text.ts'

export { parseOutlookIntent, parseOutlookFollowUp } from './outlook-parse.ts'
export type { OutlookIntent, OutlookKind }

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/4.0.0 (local.jarvis.app)' }
const TS = 'https://www.tagesschau.de/api2u'
const DW_RSS = 'https://rss.dw.com/xml/rss-de-all'

const FORBIDDEN =
  /\b(wird\s+(sicher|garantiert)\s+fallen|kaufen\s+sie|verkaufen\s+sie|ist\s+gewiss|fällt\s+morgen(?:\s+\d)?)\b/i

export type OutlookNews = {
  title: string
  teaser: string
  url: string
  date: string
  tags: OutlookTag[]
  provider: string
}

export type OutlookSnap = {
  at: string
  news: OutlookNews[]
  oil: OilQuote | null
  oilMissing: 'no_key' | 'fetch' | null
  oilPoints: SeriesPoint[]
  fx: FxHistory | null
  e10: E10Spot | null
  analog: { label: string; pct: number; from: string; to: string } | null
}

export function hasForbiddenClaim(reply: string): boolean {
  return FORBIDDEN.test(reply)
}

export function formatOutlookReply(snap: OutlookSnap, kind: OutlookKind): string {
  if (kind === 'stock_ask') {
    return 'Ob eine Aktie morgen fällt, sage ich nicht als Fakt und gebe keinen Kauf- oder Verkaufsrat. Für die Lage der Welt fragen Sie nach Öl, Benzin oder dem Dollar-Ausblick.'
  }

  const parts: string[] = []
  const tags = uniqueTags(snap.news)

  if (kind === 'fx_outlook') {
    if (snap.fx) {
      const d7 = snap.fx.d7 != null ? ` In sieben Tagen ${signedPct(snap.fx.d7)}.` : ''
      parts.push(
        `Ein ${snap.fx.from} sind ${snap.fx.last.toFixed(4)} ${snap.fx.to}, Stand ${snap.fx.date} über Frankfurter.app (EZB).${d7} Das ist der Trend der Serie, kein Modell.`,
      )
    } else {
      parts.push('Einen Euro-Dollar-Verlauf liefert Frankfurter.app gerade nicht. Ich rate nicht.')
    }
    parts.push('Wenn der jüngste Trend anhält, bewegt sich der Kurs weiter in diese Richtung; kehrt er, gilt das Gegenteil. Unsicher, kein Kauf-Rat.')
    return joinSentences(parts)
  }

  if (snap.oil) {
    parts.push(
      `Brent liegt bei ${formatBarrel(snap.oil.value)} je Barrel (${snap.oil.source}, Stand ${snap.oil.date}).`,
    )
  } else if (snap.oilMissing === 'no_key') {
    parts.push(
      'Eine Rohöl-Zahl fehlt. Legen Sie in den Einstellungen unter Weltlage einen kostenlosen FRED-Key ab — sonst nenne ich keinen Preis.',
    )
  } else if (kind === 'oil_why' || kind === 'fuel_outlook' || kind === 'world') {
    parts.push('Eine Rohöl-Zahl fehlt gerade, ich erfinde sie nicht.')
  }

  const cited = snap.news.slice(0, kind === 'world' ? 5 : 3)
  if (cited.length) {
    const bits = cited.map((n) => {
      const tag = n.tags.length ? ` [${n.tags.map(tagLabel).join(', ')}]` : ''
      const teaser = n.teaser ? ` ${n.teaser.slice(0, 120)}` : ''
      return `${n.title}.${teaser}${tag}`
    })
    parts.push(`Meldungen (${cited[0].provider}): ${bits.join(' ')}`)
  } else {
    parts.push('Die Tagesschau liefert gerade keine verwertbare Meldung. Eine Lage würde ich nicht erfinden.')
  }

  parts.push(...chainSentences(tags))

  if (snap.analog) {
    parts.push(
      `Beim vergleichbaren Fenster ${snap.analog.label} bewegte sich der Preis in der Serie um etwa ${signedPct(snap.analog.pct)} — damals, n begrenzt, nicht dasselbe Ereignis.`,
    )
  }

  if (kind === 'fuel_outlook' || kind === 'oil_why' || kind === 'world') {
    if (snap.e10) {
      parts.push(
        `Benzin an deutschen Tankstellen folgt dem Rohöl oft verzögert, das ist keine Naturgesetz-Frist. E10 bei Ihnen zuletzt ${snap.e10.price.toFixed(3).replace('.', ',')} Euro.`,
      )
    } else if (kind === 'fuel_outlook') {
      parts.push('Einen E10-Spot habe ich noch nicht — einmal „Tanke“ sagen, dann liegt der Preis vor. Ohne Spot und ohne Brent sage ich nicht, dass Benzin teurer wird.')
    }
    parts.push(
      'Szenario A: die Enge bleibt, tendenziell höherer Rohölpreis, E10 folgt verzögert. Szenario B: sie lässt nach, der Aufschlag kann zurückgehen. Unsicher, kein Kauf-Rat.',
    )
  }

  const reply = joinSentences(parts)
  return hasForbiddenClaim(reply) ? 'Die Lage nenne ich nur mit Quelle. Eine Gewissheit oder einen Kauf-Rat gebe ich nicht.' : reply
}

export async function handleOutlook(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; research?: ResearchMeta; lastTool?: string }> {
  const last = loadSettings().last_step_tool === 'outlook' ? 'outlook' : ''
  const intent = parseOutlookIntent(text, last) || (last ? parseOutlookFollowUp(text) : null)
  if (!intent) return { handled: false }

  if (intent.kind === 'tour_stop') {
    stopTour()
    return {
      handled: true,
      reply: 'Tour aus. Die Kugel bleibt.',
      tool: { tool_status: 'executed', tool: 'outlook', action: 'tour_stop', label: 'Weltlage' },
      lastTool: 'outlook',
    }
  }

  if (intent.kind === 'stock_ask') {
    const reply = formatOutlookReply(emptySnap(), 'stock_ask')
    return pack(reply, [], 'Aktie', intent.kind)
  }

  const snap = await loadOutlookSnap(intent.kind)
  let reply = formatOutlookReply(snap, intent.kind)
  if (intent.kind === 'world') {
    const stops = buildTourStops(snap.news)
    startTour(stops)
    reply = tourChatReply(stops)
  }
  const sources = intent.kind === 'world' ? sourcesFromSnap(snap, true) : sourcesFromSnap(snap)
  persistLastList('outlook', snap.news.map((n) => n.title).slice(0, 8))
  return pack(reply, sources, intent.kind, intent.kind)
}

export async function loadOutlookSnap(kind: OutlookKind | 'watch' = 'world'): Promise<OutlookSnap> {
  const s = loadSettings()
  const cached = readCachedSnap()
  const ttlOk = cached && cacheFresh(cached.at)
  const needOil = kind === 'oil_why' || kind === 'fuel_outlook' || kind === 'world' || kind === 'watch'
  const needFx = kind === 'fx_outlook' || kind === 'watch'
  if (ttlOk && cached && (kind === 'world' || kind === 'watch' || (needOil && cached.oil !== undefined))) {
    const e10 = readE10Spot()
    const next = { ...cached, e10 }
    if (needFx && !next.fx) next.fx = await fetchFxHistory()
    rememberSnap(next)
    return next
  }

  const news = await ingestNews(kind)
  const oilBundle = needOil ? await fetchBrent(s.outlook_fred_key || '') : { quote: null, points: [] as SeriesPoint[], missing: 'no_key' as const }
  const fx = needFx || kind === 'world' ? await fetchFxHistory() : null
  const e10 = readE10Spot()
  const tags = uniqueTags(news)
  const analog = oilBundle.points.length && tags.length ? pickAnalog(oilBundle.points, tags) : null
  const snap: OutlookSnap = {
    at: new Date().toISOString(),
    news,
    oil: oilBundle.quote,
    oilMissing: oilBundle.missing,
    oilPoints: oilBundle.points.slice(-8),
    fx,
    e10,
    analog,
  }
  rememberSnap(snap)
  return snap
}

function emptySnap(): OutlookSnap {
  return {
    at: new Date().toISOString(),
    news: [],
    oil: null,
    oilMissing: 'no_key',
    oilPoints: [],
    fx: null,
    e10: null,
    analog: null,
  }
}

function pack(
  reply: string,
  sources: ResearchSource[],
  query: string,
  action: string,
): { handled: boolean; reply: string; tool: ToolMeta; research: ResearchMeta; lastTool: string } {
  const line = reply.slice(0, 220)
  saveSettings({ last_outlook_line: line })
  return {
    handled: true,
    reply,
    research: {
      used: sources.length > 0,
      status: sources.length ? 'ok' : 'empty',
      status_label: 'Weltlage',
      query,
      sources,
      privacy_note: 'Öffentliche Meldungen und Serien, kein Insider, kein Kauf-Rat.',
    },
    tool: { tool_status: 'executed', tool: 'outlook', action, label: 'Weltlage' },
    lastTool: 'outlook',
  }
}

function sourcesFromSnap(snap: OutlookSnap, newsOnly = false): ResearchSource[] {
  const now = new Date().toISOString()
  const sources: ResearchSource[] = []
  for (const n of snap.news) {
    if (!n.url) continue
    sources.push({
      title: decodeHtml(n.title),
      url: n.url,
      snippet: decodeHtml(n.teaser).slice(0, 200),
      provider: n.provider,
      retrieved_at: now,
    })
  }
  if (!newsOnly && snap.oil) {
    sources.push({
      title: `Brent ${formatBarrel(snap.oil.value)}`,
      url: 'https://fred.stlouisfed.org/series/DCOILBRENTEU',
      snippet: `${snap.oil.source}, Stand ${snap.oil.date}`,
      provider: 'fred',
      retrieved_at: now,
    })
  }
  if (!newsOnly && snap.fx) {
    sources.push({
      title: `${snap.fx.from}/${snap.fx.to} ${snap.fx.last.toFixed(4)}`,
      url: 'https://www.frankfurter.app/',
      snippet: `EZB über Frankfurter.app, Stand ${snap.fx.date}`,
      provider: 'frankfurter',
      retrieved_at: now,
    })
  }
  return sources
}

async function ingestNews(kind: OutlookKind | 'watch'): Promise<OutlookNews[]> {
  const home = await tagesschauHome()
  const extra =
    kind === 'oil_why' || kind === 'fuel_outlook'
      ? await tagesschauSearch('Ölpreis')
      : kind === 'world' || kind === 'watch'
        ? await dwRss()
        : []
  const merged = dedupeNews([...home, ...extra])
  const tagged = merged.filter((n) => n.tags.length)
  const pick = (tagged.length ? tagged : merged).slice(0, 5)
  return pick
}

async function tagesschauHome(): Promise<OutlookNews[]> {
  try {
    const { status, json } = await getJson(`${TS}/news`, UA)
    if (status < 200 || status >= 300) return []
    const news = (json.news as Array<Record<string, unknown>> | undefined) || []
    return takeNews(news, 'tagesschau', 12)
  } catch {
    return []
  }
}

async function tagesschauSearch(q: string): Promise<OutlookNews[]> {
  try {
    const { status, json } = await getJson(`${TS}/search?${new URLSearchParams({ searchText: q })}`, UA)
    if (status < 200 || status >= 300) return []
    const rows = (json.searchResults as Array<Record<string, unknown>> | undefined) || []
    return takeNews(rows, 'tagesschau', 8)
  } catch {
    return []
  }
}

async function dwRss(): Promise<OutlookNews[]> {
  try {
    const { status, text } = await getText(DW_RSS, { Accept: 'application/rss+xml, text/xml', 'User-Agent': UA['User-Agent'] })
    if (status < 200 || status >= 300 || !text) return []
    return parseRssItems(text).slice(0, 8)
  } catch {
    return []
  }
}

export function parseRssItems(xml: string): OutlookNews[] {
  const items: OutlookNews[] = []
  const blocks = xml.split(/<item[\s>]/i).slice(1)
  for (const block of blocks) {
    const title = stripCdata(tagInner(block, 'title'))
    const url = stripCdata(tagInner(block, 'link'))
    const teaser = stripCdata(tagInner(block, 'description')).replace(/<[^>]+>/g, '').trim()
    const date = stripCdata(tagInner(block, 'pubDate'))
    if (!title || !url) continue
    const tags = tagNewsText(`${title} ${teaser}`)
    items.push({ title, teaser: teaser.slice(0, 200), url, date, tags, provider: 'dw' })
  }
  return items
}

function tagInner(block: string, name: string): string {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i').exec(block)
  return m ? m[1].trim() : ''
}

function stripCdata(raw: string): string {
  return decodeHtml(raw.replace(/^<!\[CDATA\[/i, '').replace(/\]\]>$/i, ''))
}

function takeNews(rows: Array<Record<string, unknown>>, provider: string, n: number): OutlookNews[] {
  const out: OutlookNews[] = []
  const seen = new Set<string>()
  for (const r of rows) {
    if (out.length >= n) break
    if (String(r.type || '') === 'video' && !r.title) continue
    const title = String(r.title || '').trim()
    if (!title) continue
    const teaser = String(r.firstSentence || r.teaser || '').trim()
    const urlRaw = String(r.shareURL || r.details || '').trim()
    const url = urlRaw.startsWith('http') ? urlRaw : urlRaw ? `https://www.tagesschau.de${urlRaw.startsWith('/') ? '' : '/'}${urlRaw}` : ''
    if (url && seen.has(url)) continue
    if (url) seen.add(url)
    const tagField = Array.isArray(r.tags) ? r.tags.map((x) => String((x as { tag?: string }).tag || '')).join(' ') : ''
    const tags = tagNewsText(`${title} ${teaser} ${tagField}`)
    out.push({ title, teaser: teaser.slice(0, 200), url, date: String(r.date || ''), tags, provider })
  }
  return out
}

function dedupeNews(rows: OutlookNews[]): OutlookNews[] {
  const seen = new Set<string>()
  const out: OutlookNews[] = []
  for (const r of rows) {
    const key = (r.url || r.title).toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out
}

function uniqueTags(news: OutlookNews[]): OutlookTag[] {
  const out: OutlookTag[] = []
  for (const n of news) {
    for (const t of n.tags) {
      if (!out.includes(t)) out.push(t)
    }
  }
  return out
}

function rememberSnap(snap: OutlookSnap): void {
  let hist: E10Spot[] = []
  try {
    const prev = loadSettings().last_outlook_json ? (JSON.parse(loadSettings().last_outlook_json) as { e10_history?: E10Spot[] }) : {}
    hist = Array.isArray(prev.e10_history) ? prev.e10_history : []
  } catch {
    hist = []
  }
  if (snap.e10) {
    const last = hist[hist.length - 1]
    if (!last || last.at !== snap.e10.at || last.price !== snap.e10.price) hist = [...hist, snap.e10].slice(-30)
  }
  const stored = { ...snap, oilPoints: snap.oilPoints.slice(-8), e10_history: hist }
  saveSettings({
    last_outlook_json: JSON.stringify(stored),
    last_outlook_line: formatOutlookReply(snap, 'world').slice(0, 220),
  })
}

function readCachedSnap(): OutlookSnap | null {
  try {
    const raw = loadSettings().last_outlook_json
    if (!raw) return null
    const parsed = JSON.parse(raw) as OutlookSnap
    if (!parsed?.at || !Array.isArray(parsed.news)) return null
    return {
      at: parsed.at,
      news: parsed.news,
      oil: parsed.oil || null,
      oilMissing: parsed.oilMissing || (parsed.oil ? null : 'no_key'),
      oilPoints: Array.isArray(parsed.oilPoints) ? parsed.oilPoints : [],
      fx: parsed.fx || null,
      e10: parsed.e10 || null,
      analog: parsed.analog || null,
    }
  } catch {
    return null
  }
}

function formatBarrel(n: number): string {
  return `${n.toFixed(2).replace('.', ',')} Dollar`
}

function signedPct(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1).replace('.', ',')} %`
}

function joinSentences(parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function outlookFingerprint(snap: OutlookSnap): string {
  const urls = snap.news.map((n) => n.url).filter(Boolean).sort().join('|')
  const oil = snap.oil ? `${snap.oil.date}:${snap.oil.value}` : ''
  return `${urls}#${oil}`
}

export function outlookNotifyLine(snap: OutlookSnap): string {
  const first = snap.news[0]
  const cause = first ? first.title.slice(0, 90) : 'Neue öffentliche Meldung'
  const num = snap.oil ? ` Brent ${formatBarrel(snap.oil.value)}.` : ''
  return `${cause}.${num} Öffnen für Quellen.`
}
