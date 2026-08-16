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
const GOT =
  /^\s*(.+?)\s+(?:hab(?:e)?\s+ich|habe\s+ich|ist\s+da|weg|gestrichen)\s*[.!]?\s*$/i
const CLEAR = /^\s*(?:einkauf(?:sliste)?\s+(?:leeren|löschen)|liste\s+leer)\s*$/i

export function parseShopIntent(text: string): ShopIntent | null {
  const t = text.trim()
  if (!t || t.length > 120) return null
  if (LIST.test(t)) return { kind: 'list' }
  if (CLEAR.test(t)) return { kind: 'clear' }
  const add = ADD.exec(t)
  if (add) return { kind: 'add', item: clean(add[1]) }
  const tail = ADD_TAIL.exec(t)
  if (tail) return { kind: 'add', item: clean(tail[1]) }
  const buy = ADD_BUY.exec(t)
  if (buy && !/[?]/.test(t)) return { kind: 'add', item: clean(buy[1]) }
  const got = GOT.exec(t)
  if (got) {
    const item = clean(got[1])
    if (item && !/\b(termin|wecker|timer|todo|erinner)\b/i.test(item)) return { kind: 'got', item }
  }
  return null
}

function clean(s: string): string {
  return s.replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ').trim()
}
