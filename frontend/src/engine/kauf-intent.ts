import { normalizeUtterance } from './utterance.ts'
import { isKaufSessionOpen } from './kauf-session.ts'

export type KaufFilter = 'all' | 'offers' | 'local' | 'prospects'

export type KaufIntent =
  | { kind: 'open' }
  | { kind: 'search'; q: string; offersOnly?: boolean; maxEuro?: number; local?: boolean }
  | { kind: 'filter'; filter: KaufFilter; maxEuro?: number }
  | { kind: 'sort'; by: 'price' | 'rating' }
  | { kind: 'compare'; a: number; b: number }
  | { kind: 'recommend' }
  | { kind: 'save'; index: number }
  | { kind: 'openDeal'; index?: number; best?: boolean }
  | { kind: 'toList'; index: number }
  | { kind: 'close' }

const LIST_LOCK =
  /\b(einkaufsliste|auf\s+die\s+liste|was\s+fehlt|hab(?:e)?\s+ich|pack(?:e)?\s+|auch\s+\w+)/i

export function parseKaufIntent(text: string, sessionOpen = isKaufSessionOpen()): KaufIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 220) return null
  if (LIST_LOCK.test(t) && !/\bpack(?:e)?\s+nummer\b/i.test(t)) return null
  if (/^\s*kaufmodus\s+(?:aus|zu|beenden|schließen)\s*[.!?]*$/i.test(t)) return { kind: 'close' }
  if (
    /^\s*(?:kaufmodus|shopping[\s-]?modus|ich\s+will\s+einkaufen|einkaufen|öffne\s+(?:den\s+)?kaufmodus)\s*[.!?]*$/i.test(
      t,
    )
  ) {
    return { kind: 'open' }
  }

  const packNum = /^\s*pack(?:e)?\s+nummer\s+(\d+)\s+auf\s+die\s+einkaufsliste\s*$/i.exec(t)
  if (packNum) return { kind: 'toList', index: Number(packNum[1]) - 1 }

  const max = maxEuro(t)
  const offersOnly = /\bnur\s+angebote\b|\bangebots?-?only\b|\bnur\s+reduziert/i.test(t)
  const local = /\bnur\s+lokal|\blokale\s+(?:geschäfte|angebote|händler)|in\s+der\s+nähe/i.test(t)
  const prospects = /\bprospekt|\bhandzettel|\bwerbung\s+von\s+(?:aldi|lidl|rewe)/i.test(t)

  if (sessionOpen) {
    if (/^\s*nur\s+angebote\s*[.!?]*$/i.test(t) || (offersOnly && t.length < 40 && !searchVerb(t))) {
      return { kind: 'filter', filter: 'offers', maxEuro: max }
    }
    if (/^\s*(?:alle|alle\s+angebote)\s*[.!?]*$/i.test(t)) return { kind: 'filter', filter: 'all', maxEuro: max }
    if (local && t.length < 48) return { kind: 'filter', filter: 'local', maxEuro: max }
    if (prospects && t.length < 64) return { kind: 'filter', filter: 'prospects', maxEuro: max }
    if (/sortier(?:e|en)?\s+nach\s+bewertung/i.test(t)) return { kind: 'sort', by: 'rating' }
    if (/sortier(?:e|en)?\s+nach\s+preis/i.test(t)) return { kind: 'sort', by: 'price' }
    if (/was\s+würdest\s+du\s+nehmen|beste(?:s)?\s+preis-?leistung|empfehlung/i.test(t)) return { kind: 'recommend' }
    const cmp = /vergleich(?:e|en)?\s+(?:nummer\s+)?(\d+)\s+und\s+(?:nummer\s+)?(\d+)/i.exec(t)
    if (cmp) return { kind: 'compare', a: Number(cmp[1]) - 1, b: Number(cmp[2]) - 1 }
    const merke = /merke?\s+(?:mir\s+)?nummer\s+(\d+)/i.exec(t)
    if (merke) return { kind: 'save', index: Number(merke[1]) - 1 }
    if (/öffne\s+das\s+beste\s+angebot|bestes\s+angebot\s+öffnen/i.test(t)) return { kind: 'openDeal', best: true }
    const openN = /öffne\s+nummer\s+(\d+)|kauf(?:e)?\s+(?:diese[sn]?|nummer\s+(\d+))/i.exec(t)
    if (openN) return { kind: 'openDeal', index: Number(openN[1] || openN[2]) - 1 }
    if (/günstigere\s+alternativen|such(?:e)?\s+günstiger/i.test(t)) {
      return { kind: 'search', q: t, offersOnly, maxEuro: max, local }
    }
    if (max != null && t.length < 36) return { kind: 'filter', filter: offersOnly ? 'offers' : 'all', maxEuro: max }
  }

  if (searchVerb(t) || productNeed(t) || compareAsk(t) || offerBrowse(t) || (offersOnly && productish(t))) {
    const q = stripLead(t)
    if (!q) return { kind: 'open' }
    return {
      kind: 'search',
      q,
      offersOnly,
      maxEuro: max,
      local: local || undefined,
    }
  }
  if (prospects) return { kind: 'search', q: stripLead(t) || t, offersOnly: true }
  if (sessionOpen && /kauf\s+diese/i.test(t)) return { kind: 'openDeal', index: 0 }
  return null
}

function searchVerb(t: string): boolean {
  return /\b(such(?:e)?\s+mir|such(?:e)?\s+(?:günstig(?:er|ere|e)?|angebote)|ich\s+brauche|wo\s+bekomme\s+ich)\b/i.test(
    t,
  )
}

function productNeed(t: string): boolean {
  return (
    /\bich\s+brauche\b/i.test(t) &&
    /\b(kopfhörer|fernseher|monitor|laptop|handy|smartphone|staubsauger|waschmaschine|kaffeemaschine|gaming)\b/i.test(t)
  )
}

function compareAsk(t: string): boolean {
  return /\bvergleich(?:e|en)?\s+(?:diese|die|mir|nummer)\b/i.test(t)
}

function offerBrowse(t: string): boolean {
  return /\b(?:alle\s+(?:aktuellen\s+)?angebote|angebote\s+für|aktuelle[n]?\s+angebote(?:\s+für)?)\b/i.test(t)
}

function productish(t: string): boolean {
  return /\b(kaffee|milch|waschmittel|fernseher|kopfhörer|monitor|laptop)\b/i.test(t)
}

function maxEuro(t: string): number | undefined {
  const m = /(?:unter|maximal|max\.?|bis)\s+(\d{1,5})\s*(?:€|euro)?/i.exec(t)
  return m ? Number(m[1]) : undefined
}

function stripLead(t: string): string {
  return t
    .replace(/^\s*(?:kaufmodus[,.]?\s*)/i, '')
    .replace(/^\s*(?:such(?:e)?\s+mir|ich\s+brauche|wo\s+bekomme\s+ich)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}
