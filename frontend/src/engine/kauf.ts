import { fillResearchLinks } from './web-search'
import { parseEuroPrices, researchHasSources } from './research-parse'
import { addShopping } from './store'
import { parseKaufIntent } from './kauf-intent'
import {
  bestQuote,
  bestTotal,
  closeKauf,
  getKaufState,
  isKaufSessionOpen,
  openKauf,
  persistSaved,
  setKaufState,
  visibleProducts,
  type KaufProduct,
  type KaufQuote,
} from './kauf-session'
import type { ToolMeta } from './tools'

export { parseKaufIntent } from './kauf-intent'
export { closeKauf, getKaufState, isKaufSessionOpen, subscribeKauf, visibleProducts, bestQuote, bestTotal } from './kauf-session'

type Hit = { handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }

export async function handleKauf(conversationId: string, text: string): Promise<Hit> {
  const intent = parseKaufIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'close') {
    closeKauf()
    return pack('Kaufmodus zu. Die Einkaufsliste bleibt unberührt.')
  }
  if (intent.kind === 'open') {
    openKauf('Wonach soll ich suchen? Overlay ist da, ohne erfundene Preise.')
    return pack('Kaufmodus. Overlay offen. Sagen Sie zum Beispiel Such mir einen Fernseher. Die Einkaufsliste bleibt leer, bis Sie etwas ausdrücklich draufpacken.')
  }
  if (intent.kind === 'filter') {
    if (!isKaufSessionOpen()) return pack('Erst suchen, dann filtern. Kaufmodus ist noch zu.')
    const honest =
      intent.filter === 'prospects'
        ? 'Prospekte ohne Lizenz (kein kaufDA). Nur Research-Snippets, keine erfundenen Handzettel.'
        : getKaufState().honest
    setKaufState({
      filter: intent.filter,
      maxEuro: intent.maxEuro ?? getKaufState().maxEuro,
      honest,
    })
    return pack(intent.filter === 'prospects' ? honest : summarize())
  }
  if (intent.kind === 'sort') {
    setKaufState({ sort: intent.by })
    return pack(intent.by === 'price' ? 'Sortiert nach Gesamtpreis, soweit die Quelle eine Zahl hat.' : 'Sortiert nach Bewertung, soweit eine da ist.')
  }
  if (intent.kind === 'compare') {
    const list = visibleProducts()
    const a = list[intent.a]
    const b = list[intent.b]
    if (!a || !b) return pack('Diese Nummern kenne ich in der Trefferliste nicht.')
    setKaufState({ compare: [intent.a, intent.b] })
    return pack(compareLine(a, b, intent.a, intent.b))
  }
  if (intent.kind === 'recommend') {
    const list = visibleProducts()
    if (!list.length) return pack('Keine Treffer für eine Empfehlung.')
    return pack(recommendLine(list))
  }
  if (intent.kind === 'save') {
    const list = visibleProducts()
    const p = list[intent.index]
    if (!p) return pack('Diese Nummer gibt es nicht.')
    const url = bestQuote(p)?.url || ''
    const saved = [...getKaufState().saved, { title: p.title, url }]
    persistSaved(saved)
    setKaufState({ saved })
    return pack(`Gemerkt: ${p.title}. Nicht auf der Einkaufsliste.`)
  }
  if (intent.kind === 'toList') {
    const list = visibleProducts()
    const p = list[intent.index]
    if (!p) return pack('Nummer unbekannt. Die Einkaufsliste bleibt unverändert.')
    await addShopping(p.title, conversationId)
    return pack(`${p.title} liegt auf der Einkaufsliste — nur weil Sie das ausdrücklich gesagt haben.`)
  }
  if (intent.kind === 'openDeal') {
    const list = visibleProducts()
    const p = intent.best
      ? [...list].sort((x, y) => (bestTotal(x) ?? 9e9) - (bestTotal(y) ?? 9e9))[0]
      : list[intent.index ?? 0]
    const q = p ? bestQuote(p) : null
    if (!q?.url) return pack('Kein Händler-Link in den Treffern. Ich bestelle nichts.')
    try {
      window.open(q.url, '_blank', 'noopener')
    } catch {
      /* overlay button still has the URL */
    }
    return pack(`Zum Händler: ${q.merchant}. Bestellt ist nichts.`)
  }

  const found = await searchProducts(intent.q, Boolean(intent.offersOnly), intent.maxEuro, Boolean(intent.local))
  setKaufState({
    query: intent.q,
    filter: intent.offersOnly ? 'offers' : intent.local ? 'local' : 'all',
    maxEuro: intent.maxEuro ?? null,
    products: found.products,
    selected: 0,
    compare: [],
    honest: found.honest,
  })
  return pack(found.reply)
}

function pack(reply: string): Hit {
  return {
    handled: true,
    reply,
    tool: { tool_status: 'executed', tool: 'kauf', action: 'overlay', label: 'Kaufmodus' },
    lastTool: 'kauf',
  }
}

async function searchProducts(
  q: string,
  offersOnly: boolean,
  maxEuro?: number,
  local?: boolean,
): Promise<{ products: KaufProduct[]; reply: string; honest: string }> {
  const query = local
    ? `${q} kaufen vor Ort Deutschland`
    : offersOnly
      ? `${q} Angebot Preis Vergleich`
      : `${q} Preis Vergleich`
  const research = await fillResearchLinks(query, '', { query, used: false, status: 'empty', sources: [] })
  const now = new Date().toISOString()
  const products: KaufProduct[] = []
  for (const src of research.sources || []) {
    if (!src.url) continue
    const prices = parseEuroPrices(`${src.title || ''} ${src.snippet || ''}`)
    const price = parseNum(prices[0])
    const quote: KaufQuote = {
      merchant: hostName(src.url),
      price,
      shipping: undefined,
      total: price,
      url: src.url,
      source: src.provider || hostName(src.url),
      fetchedAt: src.retrieved_at || now,
      rating: undefined,
      eta: undefined,
      available: undefined,
    }
    const title = (src.title || q).slice(0, 90)
    const offer = /angebot|sale|rabatt|%\s*günstig/i.test(`${src.title} ${src.snippet}`)
    const isLocal = /lidl|aldi|rewe|edeka|penny|netto|kaufland|dm\.|mediamarkt|saturn/i.test(src.url)
    products.push({
      title,
      quotes: [quote],
      offer,
      local: isLocal,
      specs: {},
    })
  }
  let list = products
  if (offersOnly) list = list.filter((p) => p.offer)
  if (local) list = list.filter((p) => p.local)
  if (maxEuro != null) list = list.filter((p) => (bestTotal(p) ?? 9e9) <= maxEuro)
  if (!researchHasSources(research) || !list.length) {
    const honest =
      'Keine belegten Preise in den Treffern. Overlay ist offen, ohne erfundene 89,99 €. Versand unbekannt, wenn er nicht in der Quelle steht.'
    return {
      products: [],
      honest,
      reply: honest,
    }
  }
  const cheapest = [...list].sort((a, b) => (bestTotal(a) ?? 9e9) - (bestTotal(b) ?? 9e9))[0]
  const t = bestTotal(cheapest)
  const priceBit = t != null ? `Günstigster genannter Preis ${fmt(t)} bei ${bestQuote(cheapest)?.merchant}, ohne geratenen Versand.` : 'Kein Gesamtpreis, Versand unbekannt.'
  const reply = `${list.length} Treffer zu ${q}. ${priceBit} Zahlen nur aus Snippets, Stand der Suche.`
  return { products: list.slice(0, 8), reply, honest: reply }
}

function summarize(): string {
  const list = visibleProducts()
  const s = getKaufState()
  if (!list.length) return 'Filter greift, aber ohne belegte Treffer. Nichts erfunden.'
  return `${list.length} Treffer, Filter ${s.filter}${s.maxEuro != null ? `, unter ${s.maxEuro} €` : ''}.`
}

function compareLine(a: KaufProduct, b: KaufProduct, ia: number, ib: number): string {
  const pa = bestTotal(a)
  const pb = bestTotal(b)
  const ga = pa != null ? fmt(pa) : 'ohne Preis'
  const gb = pb != null ? fmt(pb) : 'ohne Preis'
  let tip = 'Ohne Specs aus der Quelle keine Display-Märchen.'
  if (pa != null && pb != null && pa !== pb) {
    const cheap = pa < pb ? ia + 1 : ib + 1
    const diff = Math.abs(pa - pb)
    tip = `Fürs Budget eher Nummer ${cheap}, ${fmt(diff)} Abstand in den genannten Preisen.`
  }
  return `Nummer ${ia + 1}: ${a.title}, ${ga}. Nummer ${ib + 1}: ${b.title}, ${gb}. ${tip}`
}

function recommendLine(list: KaufProduct[]): string {
  const priced = [...list].filter((p) => bestTotal(p) != null).sort((a, b) => (bestTotal(a) ?? 0) - (bestTotal(b) ?? 0))
  const pick = priced[0] || list[0]
  const t = bestTotal(pick)
  return t != null
    ? `Ich würde ${pick.title} nehmen, ${fmt(t)} als genannter Preis, Händler ${bestQuote(pick)?.merchant}. Nur was in den Treffern steht.`
    : `${pick.title} — ohne belegten Preis keine Kaufempfehlung mit Zahl.`
}

function parseNum(label?: string): number | undefined {
  if (!label) return undefined
  const m = /(\d{1,5})(?:[.,](\d{1,2}))?/.exec(label)
  if (!m) return undefined
  return Number(`${m[1]}.${m[2] || '0'}`)
}

function fmt(n: number): string {
  return `${n.toFixed(2).replace('.', ',')} €`
}

function hostName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Händler'
  }
}
