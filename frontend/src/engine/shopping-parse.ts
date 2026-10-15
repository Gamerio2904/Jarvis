export type ShopIntent =
  | { kind: 'create-list'; name?: string }
  | { kind: 'add'; item: string; items: string[]; listHint?: string }
  | { kind: 'list'; listHint?: string }
  | { kind: 'got'; item: string; items: string[] }
  | { kind: 'clear' }

const CREATE_LIST =
  /^\s*(?:(?:erstelle|erstell|mach(?:e)?)\s+(?:mir\s+)?(?:eine?\s+)?(?:neue?\s+)?(?:einkaufs)?liste(?:\s+(?:namens|für|fuer|mit\s+dem\s+namen)\s+(.+?))?|lege\s+(?:mir\s+)?(?:eine?\s+)?(?:neue?\s+)?(?:einkaufs)?liste(?:\s+(?:namens|für|fuer|mit\s+dem\s+namen)\s+(.+?))?\s+an)\s*[.!]?\s*$/i
const LIST =
  /^\s*(?:was\s+fehlt\??|einkaufsliste\??|zeig(?:e)?\s+(?:mir\s+)?(?:die\s+)?einkaufsliste|was\s+muss\s+ich\s+einkaufen)\s*$/i
const LIST_NAMED =
  /^\s*(?:zeig(?:e)?\s+(?:mir\s+)?(?:die\s+|meine\s+)?|was\s+(?:ist|steht)\s+auf\s+(?:der\s+|meiner\s+)?)(.+?)\s*\??\s*$/i
const MISSING = /^\s*(.{2,80}?)\s+fehlt\s*[.!]?\s*$/i
const GOT =
  /^\s*(.+?)\s+(?:hab(?:e)?\s+ich|habe\s+ich|ist\s+da|weg|gestrichen)\s*[.!]?\s*$/i
const CLEAR = /^\s*(?:einkauf(?:sliste)?\s+(?:leeren|löschen|loeschen)|liste\s+leer)\s*$/i
const ADD_ON_AMAZON = /^\s*(.+?)\s+(?:auf|zur)\s+amazon\s*$/i
const ADD_PREFIX =
  /^\s*(?:einkauf(?:sliste)?\s*[:-]\s*|auf\s+die\s+einkaufsliste\s*[:,]?\s*|auch\s+)(.+?)\s*$/i
const ADD_BUY = /^\s*(?:bitte\s+)?(.{2,80}?)\s+(kaufen|holen|besorgen)\s*[.!]?\s*$/i
const SHOP_LEAD =
  /^(?:bitte\s+)?(?:kannst\s+du(?:\s+bitte)?\s+)?(?:mal\s+)?(?:füge|fuege|füg(?:e)?|fueg(?:e)?|pack(?:e)?|hinzufüge(?:n)?|hinzufügen|hinzufuegen|ergänze|ergaenze)\s+(?:mir\s+)?(?:bitte\s+)?(?:noch\s+)?(?:mal\s+)?/i
const PLACE_LEAD =
  /^(?:bitte\s+)?(?:setz(?:e)?|schreib(?:e)?|nimm|trag(?:e)?)\s+(?:mir\s+)?(?:bitte\s+)?(?:noch\s+)?(?:mal\s+)?/i
const TAIL = /\s+(?:hinzufügen|hinzufuegen|hinzu|dazu)\s*[.!]?\s*$/i
const LIST_AFTER =
  /^(.*?)\s+(?:auf|in|zu[rm]?)\s+(?:die\s+|der\s+|das\s+|dem\s+|den\s+|meine[nrs]?\s+|unsere[nrs]?\s+)?liste\s+(.+?)\s*$/i
const LIST_TAIL =
  /^(.*?)\s+(?:auf|in|zu[rm]?)\s+(?:die\s+|der\s+|das\s+|dem\s+|den\s+|meine[nrs]?\s+|unsere[nrs]?\s+)?(.+?)(?:-|\s)?liste\s*$/i
const GENERIC_TAIL =
  /^(.*?)\s+(?:auf|in|zu[rm]?)\s+(?:die\s+|der\s+|das\s+|dem\s+|den\s+|meine[nrs]?\s+|unsere[nrs]?\s+)?liste\s*$/i
const TIMED =
  /\bin\s+(?:\d+\s+(?:minuten?|stunden?|tage(?:n)?|tag)|einer?\s+(?:minute|stunde|tag)|einer?\s+viertelstunde)\b/i
const GENERIC_LIST =
  /^(?:die|der|das|dem|den|meine[nrs]?|unsere[nrs]?|einkauf(?:s)?(?:liste)?|haupt(?:liste)?|liste)$/i

export function parseShopIntent(text: string): ShopIntent | null {
  const t = text.trim().replace(/[.!]+\s*$/g, '').trim()
  if (!t || t.length > 180) return null
  const create = CREATE_LIST.exec(t)
  if (create) {
    const name = clean(create[1] || create[2] || '')
    return { kind: 'create-list', ...(name ? { name } : {}) }
  }
  if (LIST.test(t)) return { kind: 'list' }
  const namedList = listIntent(t)
  if (namedList) return namedList
  if (CLEAR.test(t)) return { kind: 'clear' }
  const missing = MISSING.exec(t)
  if (missing && !/\b(was|nichts|wenig)\b/i.test(missing[1])) {
    const add = asAdd(missing[1])
    if (add) return add
  }
  const got = GOT.exec(t)
  if (got && !/\b(termin|wecker|timer|todo|erinner)\b/i.test(got[1]) && shopSubject(got[1])) {
    const items = splitShopItems(got[1])
    if (items.length) return { kind: 'got', item: items[0], items }
  }
  const onAmazon = ADD_ON_AMAZON.exec(t)
  if (onAmazon) {
    const add = asAdd(onAmazon[1], 'Amazon')
    if (add) return add
  }
  return parseAdd(t)
}

export function splitShopItems(raw: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(/\s*,\s*|\s+und\s+|\s+sowie\s+|\s+plus\s+/i)) {
    const title = tidyItem(part)
    if (!title) continue
    const key = title.toLocaleLowerCase('de-DE')
    if (seen.has(key)) continue
    seen.add(key)
    out.push(title)
    if (out.length >= 12) break
  }
  return out
}

function shopSubject(raw: string): boolean {
  const subject = raw.trim()
  if (!subject || subject.split(/\s+/).length > 4) return false
  if (/^(?:ich|wir|man|mein(?:e|em|en|er)?|unser(?:e|em|en|er)?|mama|papa|der|die|das|es)\b/i.test(subject)) return false
  return true
}

function parseAdd(text: string): ShopIntent | null {
  if (TIMED.test(text)) return null
  if (/\b(?:aufgaben|aufgabenliste|todos?)\b/i.test(text)) return null
  const bare = text.replace(TAIL, '').trim()
  const shop = bare.replace(SHOP_LEAD, '').trim()
  const forced = shop !== bare
  const fromList = addFromList(shop) || addFromList(bare.replace(PLACE_LEAD, '').trim())
  if (fromList) return fromList
  const prefixed = ADD_PREFIX.exec(shop) || ADD_PREFIX.exec(bare)
  if (prefixed) return asAdd(prefixed[1])
  if (forced && shopSubject(shop)) return asAdd(shop)
  const buy = ADD_BUY.exec(bare)
  if (buy && !/[?]/.test(bare) && shopSubject(buy[1])) return asAdd(buy[1])
  return null
}

function addFromList(source: string): ShopIntent | null {
  if (!source) return null
  const after = LIST_AFTER.exec(source)
  if (after?.[1]) return asAdd(after[1], after[2])
  const named = LIST_TAIL.exec(source)
  if (named?.[1]) return asAdd(named[1], named[2])
  const generic = GENERIC_TAIL.exec(source)
  if (generic?.[1]) return asAdd(generic[1])
  return null
}

function listIntent(text: string): ShopIntent | null {
  const named = LIST_NAMED.exec(text)
  if (!named || !/liste/i.test(named[1])) return null
  const hint = normalizeListHint(named[1])
  return hint ? { kind: 'list', listHint: hint } : { kind: 'list' }
}

function asAdd(itemRaw: string, listHint?: string): ShopIntent | null {
  const items = splitShopItems(itemRaw.replace(SHOP_LEAD, '').replace(PLACE_LEAD, ''))
  if (!items.length) return null
  const hint = normalizeListHint(listHint)
  return { kind: 'add', item: items[0], items, ...(hint ? { listHint: hint } : {}) }
}

function normalizeListHint(raw?: string): string | undefined {
  if (!raw) return undefined
  const hint = clean(raw)
    .replace(/^(?:die|der|das|dem|den|meine[nrs]?|unsere[nrs]?)\s+/i, '')
    .replace(/(?:-|\s)?liste$/i, '')
    .trim()
  if (!hint || GENERIC_LIST.test(hint) || GENERIC_LIST.test(clean(raw))) return undefined
  return hint.replace(/^\p{Ll}/u, (c) => c.toLocaleUpperCase('de-DE'))
}

function tidyItem(raw: string): string {
  let t = clean(raw)
    .replace(/^(?:und|sowie|plus|auch|noch|bitte|mal)\s+/i, '')
    .replace(/^(?:ein(?:e[mnrs]?)?|den|die|das|dem)\s+/i, '')
    .trim()
  t = t.replace(SHOP_LEAD, '').replace(PLACE_LEAD, '').trim()
  if (t.length < 2 || t.length > 64) return ''
  if (/^(?:und|sowie|bitte|noch|mal|auch|auf|zur|zum|liste|einkaufsliste)$/i.test(t)) return ''
  return t.replace(/^\p{Ll}/u, (c) => c.toLocaleUpperCase('de-DE'))
}

function clean(s: string): string {
  return s.replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ').trim()
}
