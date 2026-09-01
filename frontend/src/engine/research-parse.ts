import { normalizeUtterance } from './utterance.ts'

export type ResearchSource = {
  title: string
  url: string
  snippet: string
  provider: string
  retrieved_at: string
}

export type ResearchMeta = {
  used?: boolean
  status?: string
  query?: string
  sources?: ResearchSource[]
  error?: string | null
  diverges?: boolean
  privacy_note?: string | null
  badge?: string | null
  audit_id?: string
  status_label?: string | null
  network_attempted?: boolean
}

export function isLiveLookup(text: string, discount = false): boolean {
  const t = text.trim()
  if (!t || t.length > 240) return false
  if (/\b(suche|recherchier(?:e|en)?|google(?:n)?|im internet|im netz|schau(?:e)? nach)\b/i.test(t)) {
    return true
  }
  if (/\b(wetter|temperatur|nachrichten|news)\b/i.test(t)) return true
  if (/\baktuell(?:e[nrs]?)?\b/i.test(t) && /\b(preis|kurs|spielstand|wetter|zahlen|daten|wert|statistik|wirtschaft)\b/i.test(t)) {
    return true
  }
  if (/\b(?:eintritt|zugangsgebühr|city[- ]?tax|touristenabgabe|contributo)\b/i.test(t)) return true
  if (/\bmuss\s+man\b/i.test(t) && /\b(?:zahl|gebühr|eintritt|beitrag)\b/i.test(t)) return true
  if (/\b(?:tweet|tweets|twitter|getweetet|gepostet)\b/i.test(t)) return true
  if (/\bauf\s+x\b/i.test(t) && /\b(?:post|geschrieben|gesagt|zuletzt|letztes)\b/i.test(t)) return true
  if (/\bwas\s+hat\s+\S.{0,40}\s+(?:als\s+letztes\s+)?(?:getweetet|gepostet|getwittert)\b/i.test(t)) return true
  if (isTableAsk(t) && /\b(?:bip|gdp|deutschland|zahlen|statistik|daten|wirtschaft)\b/i.test(t)) return true
  if (isProductLookup(t, discount)) return true
  if (isFactLookup(t)) return true
  return false
}

/** Firmen-/Stückzahlen, nicht Einkaufsliste und nicht „wie viele Timer habe ich“. */
export function isFactLookup(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 240) return false
  if (/\b(?:ich|wir|mich|uns|meine?|meiner|meinen|unser)\b/i.test(t)) return false
  if (/\b(?:einkauf(?:sliste)?|wecker|timer|todo|notiz(?:en)?|erinnerung)\b/i.test(t)) return false
  const qty = /\bwie\s+viele?n?\b|\bwie\s+viel\b/i.test(t)
  const verb =
    /\b(?:verkauf(?:t|en)?|produziert|liefert|herstellt|umsatz|mitarbeiter(?:zahl)?|stück(?:zahl)?|exemplare)\b/i.test(
      t,
    )
  const period = /\b(?:am|pro)\s+tag\b|\btäglich\b|\bpro\s+jahr\b|\bjährlich\b|\bweltweit\b/i.test(t)
  if (qty && verb) return true
  if (verb && period) return true
  if (/\b(?:umsatz|geschäftsbericht|marktanteil|stückzahl)\b/i.test(t)) return true
  if (
    /\b(?:bip|b\.i\.p\.|gdp|bruttoinlandsprodukt|wirtschaftsdaten|wirtschaftszahlen|staatsverschuldung|inflationsrate|arbeitslosenquote)\b/i.test(
      t,
    )
  ) {
    return true
  }
  if (
    /\bwas\s+ist\s+(?:der|die|das)\s+\S.{0,40}\b(?:in|von)\s+(?:deutschland|europa|der\s+welt|österreich|der\s+schweiz)\b/i.test(
      t,
    )
  ) {
    return true
  }
  return false
}

/** Reihen oder Vergleich als Texttabelle, kein Markdown. */
export function isTableAsk(text: string): boolean {
  return /\b(?:tabelle|tabellarisch|als\s+tabelle|in\s+einer\s+tabelle)\b/i.test(text)
}

/** Produkt, Preis, Shop — bestehende Suche, nicht ein neues Tool. */
export function isProductLookup(text: string, discount = false): boolean {
  const t = text.trim()
  if (!t || t.length > 240) return false
  if (/\b(preis(?:e|vergleich)?|günstig(?:er|ste[rn]?)?|was kostet|angebot(?:e)?|rabatt|idealo|geizhals)\b/i.test(t)) {
    return true
  }
  if (discount && /\b(gutschein(?:code)?|rabattcode|coupon|promo(?:code)?)\b/i.test(t)) {
    return true
  }
  if (/\b(kaufen|shop)\b/i.test(t) && /\b(amazon|mediamarkt|otto|idealo|geizhals)\b/i.test(t)) {
    return true
  }
  if (/\b(küchengerät(?:e)?|elektronik|smartphone|laptop|waschmaschine|staubsauger|kaffeemaschine)\b/i.test(t)) {
    return true
  }
  return false
}

export function parseShopDiscountIntent(text: string): { on: boolean } | null {
  const t = normalizeUtterance(text.trim())
  const m =
    /^\s*rabatt(?:-|\s*)suche\s+(an|aus|aktivieren|deaktivieren|ein|aktiviert|ausgeschaltet)\s*[.!?]*$/i.exec(t)
  if (!m) return null
  const w = m[1].toLowerCase()
  return { on: w === 'an' || w === 'aktivieren' || w === 'ein' || w === 'aktiviert' }
}

export function isSearchRefusal(text: string): boolean {
  return /keine live-suche|kann ich keine (?:live-)?suche|nutzen sie einen browser|i cannot (?:perform )?(?:a )?(?:live )?search|keinen zugriff aufs? internet|kann (?:das )?internet nicht|bitte nutzen sie (?:einen browser|eine app)|keine verifizierten zahlen|keine gesicherten (?:zahlen|daten)|tabellen kann ich.{0,48}nicht|kann ich in diesem format.{0,24}nicht/i.test(
    text,
  )
}

/** Modell sagt, es wisse Live-Fakten nicht — dann selbst suchen. */
export function isKnowledgeGap(text: string): boolean {
  if (isSearchRefusal(text)) return true
  return /liegen mir im moment keine|liegt mir im moment nicht vor|kein entsprechender systemzugriff|zu den aktuellen .{0,48}liegen mir|dazu (?:liegen|gibt es) (?:mir )?keine|weiß ich (?:leider )?nicht|keine aktuellen (?:zahlen|daten|werte)|keine belegten zahlen/i.test(
    text,
  )
}

/** Frage, bei der eine Websuche sinnvoll ist, wenn die erste Antwort leer bleibt. */
export function isAutoResearchAsk(text: string, discount = false): boolean {
  if (isLiveLookup(text, discount)) return true
  const t = text.trim()
  if (!t || t.length < 8 || t.length > 240) return false
  if (/^\s*(?:hallo|hi|hey|guten\s+(?:morgen|abend|tag)|wie\s+geht)/i.test(t)) return false
  if (/\b(?:wer\s+bist\s+du|was\s+machst\s+du|was\s+sie\s+tun)\b/i.test(t)) return false
  if (
    /\b(?:ich|wir|mich|uns|meine?|meiner|meinen|unser)\b/i.test(t) &&
    !/\b(?:deutschland|europa|bip|gdp|welt)\b/i.test(t)
  ) {
    return false
  }
  return /\b(?:was\s+ist|wie\s+viel|wie\s+hoch|wie\s+groß|wer\s+ist|wann\s+(?:war|ist)|erklär|tabelle|statistik|zahlen|quote|kurs)\b/i.test(
    t,
  )
}

export function shouldRetrySearch(userText: string, reply: string, discount = false): boolean {
  if (!reply.trim()) return false
  if (!isKnowledgeGap(reply)) return false
  return isAutoResearchAsk(userText, discount)
}

const EURO =
  /(?:€\s*)(\d{1,5}(?:[.,]\d{1,2})?)|(\d{1,5}(?:[.,]\d{1,2})?)\s*(?:€|eur(?:o)?)/gi

export function parseEuroPrices(text: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  EURO.lastIndex = 0
  while ((m = EURO.exec(text))) {
    const raw = (m[1] || m[2] || '').replace('.', ',')
    if (!raw || seen.has(raw)) continue
    seen.add(raw)
    out.push(`${raw} €`)
  }
  return out
}

export function researchQuery(text: string): string {
  const t = text.trim().replace(/[.!?]+$/g, '')
  const m =
    /^\s*(?:suche(?:\s+(?:im\s+)?(?:internet|netz|web))?(?:\s+nach)?|recherchier(?:e|en)?(?:\s+nach)?|google(?:n)?(?:\s+nach)?|schau(?:e)?\s+nach)\s+(.+?)\s*$/i.exec(
      t,
    )
  if (m) return m[1].replace(/^(?:nach\s+)/i, '').trim() || t
  return t
}

export function researchStatusLabel(r?: ResearchMeta | null): string {
  const n = r?.sources?.filter((s) => s.url).length || 0
  if (n === 1) return 'Quelle'
  if (n > 1) return 'Quellen'
  if (r?.network_attempted) return 'Suche ohne Links'
  if (r?.status && r.status !== 'empty' && r.status !== 'ok') return r.status
  return 'Quellen'
}

export const RESEARCH_OFF_REPLY =
  'Suche ist aus. Unter Einstellungen Internet-Research an — oder „ja bitte“ für einmal suchen. Sonst erfinde ich keine Live-Zahlen.'

export const RESEARCH_NEEDS_GEMINI =
  'Research braucht Gemini. Unter Einstellungen Gemini an, dann die Suche nochmal.'

export const RESEARCH_EMPTY =
  'Netz hat nicht geantwortet. Ich rate keine Rezepte und keine Fakten aus dem Kopf.'

export const REPLY_TRUNCATED = 'Die Antwort ist abgebrochen. Bitte den Satz noch einmal sagen.'

export function researchHasSources(r?: ResearchMeta | null): boolean {
  return Boolean(r?.sources?.some((s) => Boolean(s.url)))
}

export function mergeResearchSources(
  base: ResearchMeta | undefined,
  extra: ResearchSource[],
  query: string,
): ResearchMeta {
  const now = new Date().toISOString()
  const seen = new Set<string>()
  const sources: ResearchSource[] = []
  for (const s of [...(base?.sources || []), ...extra]) {
    const url = (s.url || '').trim()
    if (!url || seen.has(url)) continue
    seen.add(url)
    sources.push({
      title: s.title || hostOf(url) || 'Quelle',
      url,
      snippet: s.snippet || '',
      provider: s.provider || 'web',
      retrieved_at: s.retrieved_at || now,
    })
  }
  const q = (base?.query || query).trim()
  return {
    used: sources.length > 0,
    status: sources.length ? 'ok' : 'empty',
    status_label: sources.length ? `${sources.length} Quellen` : 'Suche ohne Links',
    badge: sources.length ? 'Quellen' : 'Suche',
    query: q,
    sources,
    network_attempted: true,
    privacy_note: 'Nur die Suchanfrage ging ins Netz. Tippen öffnet die Seite.',
    error: base?.error || null,
    audit_id: base?.audit_id,
  }
}

export function sourcesFromText(text: string, provider = 'answer'): ResearchSource[] {
  const now = new Date().toISOString()
  const found: ResearchSource[] = []
  const seen = new Set<string>()
  const md = /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g
  let m: RegExpExecArray | null
  while ((m = md.exec(text))) {
    const url = cleanUrl(m[1])
    if (!url || seen.has(url)) continue
    seen.add(url)
    found.push({
      title: hostOf(url) || 'Quelle',
      url,
      snippet: '',
      provider,
      retrieved_at: now,
    })
  }
  const bare = /https?:\/\/[^\s)<>"']+/g
  while ((m = bare.exec(text))) {
    const url = cleanUrl(m[0])
    if (!url || seen.has(url)) continue
    seen.add(url)
    found.push({
      title: hostOf(url) || 'Quelle',
      url,
      snippet: '',
      provider,
      retrieved_at: now,
    })
  }
  return found
}

export function sourcesFromHtml(html: string, provider = 'duckduckgo'): ResearchSource[] {
  const now = new Date().toISOString()
  const out: ResearchSource[] = []
  const seen = new Set<string>()
  const re =
    /<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]{0,700})/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const url = unwrapDdg(m[1])
    if (!url || seen.has(url)) continue
    seen.add(url)
    const title = stripTags(m[2]).trim() || hostOf(url)
    const tail = m[3] || ''
    const snipM = /class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\//i.exec(tail)
    const snippet = stripTags(snipM?.[1] || '').trim().slice(0, 220)
    out.push({ title, url, snippet, provider, retrieved_at: now })
    if (out.length >= 8) break
  }
  if (!out.length) {
    const hrefs = /href="(https?:\/\/[^"]+)"/gi
    while ((m = hrefs.exec(html))) {
      const url = cleanUrl(m[1])
      if (!url || seen.has(url) || /duckduckgo\.com|google\.com\/aclk/i.test(url)) continue
      seen.add(url)
      out.push({
        title: hostOf(url) || 'Quelle',
        url,
        snippet: '',
        provider,
        retrieved_at: now,
      })
      if (out.length >= 6) break
    }
  }
  return out
}

function unwrapDdg(href: string): string {
  try {
    const u = new URL(href, 'https://html.duckduckgo.com/')
    const uddg = u.searchParams.get('uddg')
    if (uddg) return cleanUrl(uddg)
    return cleanUrl(u.href)
  } catch {
    return cleanUrl(href)
  }
}

function cleanUrl(raw: string): string {
  const url = raw.replace(/[.,;:]+$/g, '').trim()
  if (!/^https?:\/\//i.test(url)) return ''
  if (/vertexaisearch\.cloud\.google\.com/i.test(url)) return url
  return url
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ')
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const SHOP_HOST =
  /idealo\.|geizhals\.|mediamarkt\.|saturn\.|otto\.de|amazon\.de|billiger\.de|lidl\.de|kaufland\.de|mydealz\.|sparwelt\./i

export function shopRank(url: string): number {
  const h = hostOf(url)
  if (/idealo\./i.test(h)) return 0
  if (/geizhals\./i.test(h)) return 1
  if (/billiger\./i.test(h)) return 2
  if (/mydealz\./i.test(h)) return 3
  if (/sparwelt\./i.test(h)) return 4
  if (/amazon\.de/i.test(h)) return 5
  if (/mediamarkt\.|saturn\./i.test(h)) return 6
  if (/otto\.de/i.test(h)) return 7
  if (SHOP_HOST.test(h)) return 8
  return 9
}

export function compareShopSources(query: string): ResearchSource[] {
  const q = encodeURIComponent(query.slice(0, 80))
  const now = new Date().toISOString()
  return [
    {
      title: `Idealo — ${query}`,
      url: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=${q}`,
      snippet: 'Preisvergleich DE, günstigste Angebote zuerst.',
      provider: 'idealo',
      retrieved_at: now,
    },
    {
      title: `Geizhals — ${query}`,
      url: `https://geizhals.de/?fs=${q}`,
      snippet: 'Preisvergleich, Filter nach Shop und Versand.',
      provider: 'geizhals',
      retrieved_at: now,
    },
  ]
}

export function compareDiscountSources(query: string): ResearchSource[] {
  const q = encodeURIComponent(query.slice(0, 80))
  const now = new Date().toISOString()
  return [
    {
      title: `mydealz — ${query}`,
      url: `https://www.mydealz.de/search?q=${q}`,
      snippet: 'Deals und Gutscheine. Codes nur wenn sie auf der Seite stehen.',
      provider: 'mydealz',
      retrieved_at: now,
    },
    {
      title: `Sparwelt — ${query}`,
      url: `https://www.sparwelt.de/suche?search=${q}`,
      snippet: 'Gutscheine DE. Keine erfundenen Codes.',
      provider: 'sparwelt',
      retrieved_at: now,
    },
  ]
}

export function formatResearchReply(
  query: string,
  sources: ResearchSource[],
  product: boolean,
  discount = false,
): string {
  const live = sources.filter((s) => s.url)
  const priced = live
    .map((s) => {
      const euros = parseEuroPrices(`${s.title} ${s.snippet}`)
      return euros.length ? { s, euros } : null
    })
    .filter(Boolean) as Array<{ s: ResearchSource; euros: string[] }>
  if (product && priced.length) {
    const bits = priced
      .slice(0, 4)
      .map((p) => `${p.euros[0]} · ${p.s.title.replace(/\s+/g, ' ').slice(0, 42)}`)
    return `${query}: ${bits.join('; ')}. Vergleich unten (Idealo/Geizhals) — Ladenpreis kann abweichen, ich erfinde keine Beträge.${discountNote(discount)}`
  }
  if (product) {
    const shops = live
      .slice()
      .sort((a, b) => shopRank(a.url) - shopRank(b.url))
      .slice(0, 4)
      .map((s) => s.title.replace(/\s+/g, ' ').split(/[|–—-]/)[0].trim())
      .filter(Boolean)
    const names = shops.slice(0, 3).join(', ')
    return `${query}: konkrete Euro-Beträge stehen auf den Vergleichsseiten, ich setze keine Preise ins Blaue. Unten Idealo, Geizhals${names ? ` und ${names}` : ''}.${discountNote(discount)}`
  }
  const snip =
    live.find((s) => s.provider === 'duckduckgo_ia' && s.snippet)?.snippet ||
    live.find((s) => (s.snippet || '').trim().length > 40)?.snippet
  if (snip) {
    const body = snip.replace(/\s+/g, ' ').slice(0, 280)
    if (asksDailyFigure(query) && !hasDailyUnit(live.map((s) => `${s.title} ${s.snippet}`).join('\n'))) {
      return `${body} Eine Stückzahl am Tag steht in den Treffern nicht. Links unten.`
    }
    return `${body} Links unten.`
  }
  const titles = live
    .slice(0, 3)
    .map((s) => s.title.replace(/\s+/g, ' ').slice(0, 48))
    .join('; ')
  if (!titles) return 'Suche gelaufen, aber ohne brauchbare Links. Nochmal anders formulieren?'
  if (asksDailyFigure(query)) {
    return `${query}: in den Treffern keine belegte Tageszahl. ${titles}. Links unten prüfen, ich rechne nichts um.`
  }
  return `${query}: ${titles}. Links unten, tippen prüft.`
}

export function asksDailyFigure(text: string): boolean {
  return /\b(?:am|pro)\s+tag\b|\btäglich\b/i.test(text)
}

export function corpusSaysNowFree(text: string): boolean {
  return /aktuell(?:e[nrs]?)?\s+(?:kein|keine|ohne)|keine(?:n)?\s+eintritt|ohne\s+(?:gebühr|zahlung|anmeldung)|testphase.{0,40}(?:endet|beendet|vorbei)/i.test(
    text,
  )
}

export function isStaleFeeNow(sentence: string): boolean {
  if (/\b(?:früher|damals|2024|2025|geplant|diskussion|könnte|soll)\b/i.test(sentence)) return false
  return /(?:\b(?:fünf|5)\s*(?:€|euro)|(?:fünf|5)\s*€|\b30\s*[–-]\s*50\b)/i.test(sentence) &&
    /\b(?:eintritt|gebühr|tagesgast|altstadt)\b/i.test(sentence)
}

export function guardResearchReply(query: string, answer: string, sources: ResearchSource[]): string {
  const live = sources.filter((s) => s.url)
  const corpus = live.map((s) => `${s.title} ${s.snippet}`).join('\n')
  const corpusText = corpus.replace(/\s+/g, ' ').trim()
  const dailyAsked = asksDailyFigure(query)
  const dailyInCorpus = hasDailyUnit(corpus)
  const nowFree = corpusSaysNowFree(corpus)
  const raw = (answer || '').replace(/\s+/g, ' ').trim()
  if (!raw) return formatResearchReply(query, live, false)
  const kept: string[] = []
  for (const s of splitSentences(raw)) {
    if (isConversionSentence(s) && dailyAsked && !dailyInCorpus) continue
    if (corpusText.length >= 40 && hasUnsupportedFigure(s, corpus)) continue
    if (nowFree && isStaleFeeNow(s)) continue
    kept.push(s)
  }
  let out = kept.join(' ').trim()
  if (nowFree && !out) {
    out = 'Aktuell nicht. In den Treffern steht keine gültige Eintrittsgebühr.'
  }
  if (dailyAsked && !dailyInCorpus) {
    const note = 'Eine Stückzahl am Tag steht in den Treffern nicht.'
    if (!out) return formatResearchReply(query, live, false)
    if (!/tag(?:es)?zahl|steht in den treffern nicht|nicht ausgewiesen|rechne nichts um/i.test(out)) {
      out = `${out.replace(/[.!?]+$/, '')}. ${note}`
    }
  }
  if (!out) return formatResearchReply(query, live, false)
  return out
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function isConversionSentence(s: string): boolean {
  return /\bumgerechnet\b|\bentspricht das etwa\b|\bentspräche\b|\bgeteilt durch\b|\b365\b/i.test(s)
}

function hasDailyUnit(text: string): boolean {
  return /\b(?:am|pro)\s+tag\b|\btäglich\b|\bper\s+day\b|\beach\s+day\b|\bper\s+diem\b/i.test(text)
}

function hasUnsupportedFigure(sentence: string, corpus: string): boolean {
  const allowed = new Set(figureKeys(corpus))
  if (!allowed.size) return false
  for (const key of figureKeys(sentence)) {
    if (key < 10) continue
    if (!allowed.has(key) && !approxIn(key, allowed)) return true
  }
  return false
}

function approxIn(n: number, allowed: Set<number>): boolean {
  for (const a of allowed) {
    if (a > 0 && Math.abs(n - a) / a < 0.08) return true
  }
  return false
}

function figureKeys(text: string): number[] {
  const out: number[] = []
  const mil = /(\d{1,3}(?:[.,]\d+)?)\s*(?:million(?:en)?|mio\.?)/gi
  let m: RegExpExecArray | null
  while ((m = mil.exec(text))) {
    const n = Number(String(m[1]).replace(',', '.'))
    if (Number.isFinite(n) && n >= 1) out.push(Math.round(n * 1_000_000))
  }
  const mrd = /(\d{1,3}(?:[.,]\d+)?)\s*(?:milliarde(?:n)?|billion(?:en)?)/gi
  while ((m = mrd.exec(text))) {
    const n = Number(String(m[1]).replace(',', '.'))
    if (Number.isFinite(n) && n >= 1) out.push(Math.round(n * 1_000_000_000))
  }
  const grouped = /\b\d{1,3}(?:[.\s]\d{3})+\b/g
  while ((m = grouped.exec(text))) {
    const n = Number(m[0].replace(/[.\s]/g, ''))
    if (Number.isFinite(n)) out.push(n)
  }
  const plain = /\b(\d{3,7})\b/g
  while ((m = plain.exec(text))) {
    const n = Number(m[1])
    if (!Number.isFinite(n) || n < 100) continue
    if (n >= 1900 && n <= 2100) continue
    out.push(n)
  }
  return out
}

function discountNote(on: boolean): string {
  if (!on) return ''
  return ' Rabatt und Gutscheine nur aus den Treffern (mydealz/Sparwelt) — keine erfundenen Codes.'
}

function freshnessRank(s: ResearchSource): number {
  const t = `${s.title} ${s.snippet}`
  let n = 0
  if (corpusSaysNowFree(t)) n += 8
  if (/\b2026\b|\b2027\b|\baktuell\b/i.test(t)) n += 4
  if (/\b(?:adac|comune|official|amtlich)\b/i.test(t)) n += 2
  if (/(?:\b(?:fünf|5)\s*(?:€|euro)|(?:fünf|5)\s*€)/i.test(t) && !corpusSaysNowFree(t)) n -= 3
  return n
}

export function sourceDigest(sources: ResearchSource[], limit = 6): string {
  return sources
    .filter((s) => s.url)
    .slice()
    .sort((a, b) => freshnessRank(b) - freshnessRank(a))
    .slice(0, limit)
    .map((s, i) => {
      const price = parseEuroPrices(`${s.title} ${s.snippet}`)[0] || ''
      const snip = (s.snippet || '').replace(/\s+/g, ' ').slice(0, 180)
      return `${i + 1}. ${s.title} — ${s.url}${price ? ` (${price})` : ''}${snip ? `\n   ${snip}` : ''}`
    })
    .join('\n')
}
