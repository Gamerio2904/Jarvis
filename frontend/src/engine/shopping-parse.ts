export type ShopIntent =
  | { kind: 'add'; item: string }
  | { kind: 'list' }
  | { kind: 'got'; item: string }
  | { kind: 'clear' }

const ADD =
  /^\s*(?:einkauf(?:sliste)?\s*[:-]\s*|auf\s+die\s+einkaufsliste\s+|pack(?:e)?\s+(?:auf\s+die\s+liste\s+)?|auch\s+)(.+?)\s*$/i
const ADD_TAIL = /^\s*(.+?)\s+auf\s+die\s+(?:einkaufs)?liste\s*$/i
const ADD_BUY =
  /^\s*(?:bitte\s+)?(.{2,40}?)\s+(kaufen|holen|besorgen)\s*[.!]?\s*$/i
const LIST =
  /^\s*(?:was\s+fehlt\??|einkaufsliste\??|zeig(?:e)?\s+(?:mir\s+)?(?:die\s+)?einkaufsliste|was\s+muss\s+ich\s+einkaufen)\s*$/i
const MISSING = /^\s*(.{2,40}?)\s+fehlt\s*[.!]?\s*$/i
const GOT =
  /^\s*(.+?)\s+(?:hab(?:e)?\s+ich|habe\s+ich|ist\s+da|weg|gestrichen)\s*[.!]?\s*$/i
const CLEAR = /^\s*(?:einkauf(?:sliste)?\s+(?:leeren|löschen)|liste\s+leer)\s*$/i

function clean(s: string): string {
  return s.replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ').trim()
}

function shopJunk(item: string): boolean {
  return (
    /\b(wo\s+kann|mit\s+rabatt|preisvergleich|idealo|geizhals|\?)\b/i.test(item) ||
    /^\s*(wo|wie|was|wann|welche|ne|nein)\b/i.test(item)
  )
}

export function parseShopIntent(text: string): ShopIntent | null {
  const t = text.trim()
  if (!t || t.length > 120) return null
  if (/^\s*(guten\s+morgen|guten\s+abend|hallo|hi|hey)[.!?]*\s*$/i.test(t)) return null
  if (LIST.test(t)) return { kind: 'list' }
  if (CLEAR.test(t)) return { kind: 'clear' }
  const missing = MISSING.exec(t)
  if (missing) {
    const item = clean(missing[1])
    if (item && !shopJunk(item) && !/\b(was|nichts|wenig)\b/i.test(item)) return { kind: 'add', item }
  }
  const add = ADD.exec(t)
  if (add) {
    const item = clean(add[1])
    if (!shopJunk(item)) return { kind: 'add', item }
  }
  const tail = ADD_TAIL.exec(t)
  if (tail) {
    const item = clean(tail[1])
    if (!shopJunk(item)) return { kind: 'add', item }
  }
  const buy = ADD_BUY.exec(t)
  if (
    buy &&
    !/[?]/.test(t) &&
    !/^\s*(wo|was|wann|wie|welche[rsn]?|ne|nein)\b/i.test(t) &&
    !/\b(wo\s+kann\s+ich|mit\s+rabatt|preisvergleich|idealo)\b/i.test(t) &&
    !/\bin\s+(?:\d+\s+(?:minuten?|stunden?|tage(?:n)?|tag)|einer?\s+(?:minute|stunde|tag))\b/i.test(t)
  ) {
    const item = clean(buy[1])
    if (item && !shopJunk(item)) return { kind: 'add', item }
  }
  const got = GOT.exec(t)
  if (got) {
    const item = clean(got[1])
    if (item && !/\b(termin|wecker|timer|todo|erinner)\b/i.test(item)) return { kind: 'got', item }
  }
  return null
}
