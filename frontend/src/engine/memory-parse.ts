export type MemoryFact = { key: string; value: string; category: string }

export const MERK =
  /^\s*(?:merk(?:e)?\s*dir|denk(?:e)?\s+daran|notier(?:e)?\s+dir|speicher(?:e)?|erinner(?:e)?\s*dich(?:\s*an)?)\s*(?:bitte\s*)?[:-]?\s*(.+)$/is
export const VERGISS_ALL =
  /^\s*(?:vergiss|lösch(?:e)?)\s+(?:bitte\s+)?(alles(?:\s+über\s+mich)?|meine\s+erinnerungen)\s*[.!]?\s*$/is
export const VERGISS = /^\s*(?:vergiss|lösch(?:e)?\s*(?:die\s*)?erinnerung(?:\s*an)?)\s*[:-]?\s*(.+)$/is
export const RECALL_ALL =
  /^\s*(?:was\s+weißt\s+du\s+über\s+mich|was\s+hast\s+du\s+dir\s+gemerkt|erinnerst\s+du\s+dich(?:\s+an\s+mich)?|was\s+liegt\s+über\s+mich|basierend\s+auf\s+(?:dem\s+)?was\s+du\s+über\s+mich\s+weißt)\b/is
export const RECALL_NAME =
  /^\s*(?:wie\s+heiß(?:e|t)\s+ich|wie\s+ist\s+mein\s+name|wer\s+bin\s+ich|mein\s+name\??)\s*[?]?\s*$/is
export const RECALL_DRINK =
  /^\s*(?:was\s+trinke?\s+ich(?:\s+gerne)?|was\s+mag\s+ich\s+(?:zu\s+)?trinken|mein\s+getränk\??)\s*[?]?\s*$/is
export const RECALL_FOOD =
  /^\s*(?:was\s+esse\s+ich(?:\s+gerne)?|was\s+mag\s+ich\s+(?:zu\s+)?essen|mein\s+essen\??)\s*[?]?\s*$/is
export const RECALL_VAGUE = /^\s*(?:was\s+mag\s+ich)\s*[?]?\s*$/is
export const CONTRADICTION =
  /^\s*(?:ich\s+(?:trinke|esse)\s+)?kein(?:en?|e)?\s+(.+?)\s+mehr\s*[.!]?\s*$/is
export const UTILITY_NO =
  /^\s*(?:das\s+)?(?:stimmt\s+nicht|ist\s+falsch|falsch(?:\s+gemerkt)?)\s*[.!]?\s*$/is

export function isUtilityCorrection(text: string): boolean {
  return UTILITY_NO.test(text)
}

export function isIdentityAsk(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 120) return false
  return /wer\s+bist\s+du|was\s+bist\s+du|wer\s+sind\s+sie|wer\s+bin\s+ich/i.test(t)
}

export function parseMemoryFacts(text: string): MemoryFact[] {
  const out: MemoryFact[] = []
  const seen = new Set<string>()
  const push = (key: string, value: string, category: string) => {
    const v = value.replace(/[.!?,;:]+$/g, '').trim()
    if (v.length < 2 || seen.has(key)) return
    seen.add(key)
    out.push({ key, value: v, category })
  }

  const name = /(?:ich\s+heiß(?:e|t)|mein\s+name\s+ist|nenn(?:e)?\s+mich)\s+([A-ZÄÖÜ][\wÄÖÜäöüß-]+)/i.exec(
    text,
  )
  if (name) push('name', name[1], 'fact')

  const drinkAsk = /^\s*was\s+trinke\s+ich\b/i.test(text)
  const drink =
    !drinkAsk &&
    /(?:trinke?\s+(?:gerne\s+)?|lieblingsgetränk\s+ist\s+|getränk\s+ist\s+)(.+?)(?=\s+\bund\b|[,.!?]|$)/i.exec(
      text,
    )
  if (drink && isPrefValue(drink[1])) push('getränk', drink[1], 'pref')

  const food =
    /(?:esse\s+(?:gerne\s+)?|lieblingsessen\s+ist\s+|essen\s+ist\s+)(.+?)(?=\s+\bund\b|[,.!?]|$)/i.exec(
      text,
    )
  if (food && isPrefValue(food[1])) push('essen', food[1], 'pref')

  const rest = MERK.exec(text)
  if (rest && !out.length) {
    const value = rest[1].trim()
    if (value.length >= 2) push('notiz', value, 'fact')
  }
  return out
}

function isPrefValue(raw: string): boolean {
  const v = raw.replace(/[.!?,;:]+$/g, '').trim()
  if (v.length < 2) return false
  return !/^(ich|du|er|sie|es|wir|ihr|man|mich|mir|dir|uns)(?:\s+gerne)?$/i.test(v)
}

export function isMemoryWrite(text: string): boolean {
  if (isMemoryRecall(text)) return false
  if (/^\s*was\b/i.test(text) && /[?]/.test(text)) return false
  if (/\bbasierend\s+auf\s+(?:dem\s+)?was\s+du\b/i.test(text)) return false
  if (/\b(?:wo\s+wohne\s+ich|wo\s+arbeite\s+ich|was\s+trinke\s+ich|fass\s+das\s+in\s+einem\s+satz)\b/i.test(text)) {
    return false
  }
  if (CONTRADICTION.test(text) && !/\b(termin|wecker|timer|todo)\b/i.test(text)) return true
  if (isUtilityCorrection(text)) return true
  if (MERK.test(text)) {
    if (
      /\b(?:zahnarzt|arzttermin|termin)\b/i.test(text) &&
      /\b(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|morgen|heute)\b/i.test(text)
    ) {
      return false
    }
    return true
  }
  if (/(?:ich\s+heiß(?:e|t)|mein\s+name\s+ist|nenn(?:e)?\s+mich)\b/i.test(text)) return true
  if (/\b(?:trinke?\s+(?:gerne)?|lieblingsgetränk|esse\s+(?:gerne)?|lieblingsessen)\b/i.test(text)) {
    return parseMemoryFacts(text).length > 0
  }
  return false
}

export function formatPinnedMemory(items: Array<{ key: string; value: string }>): string {
  if (!items.length) return 'Noch nichts gespeichert über Sie.'
  const order = ['name', 'zuhause', 'getränk', 'essen']
  const say: Record<string, (v: string) => string> = {
    name: (v) => `Sie heißen ${v}.`,
    zuhause: (v) => `Zuhause ist ${v}.`,
    getränk: (v) => `Sie trinken ${v}.`,
    essen: (v) => `Sie essen ${v}.`,
  }
  const used = new Set<string>()
  const bits: string[] = []
  for (const k of order) {
    const m = items.find((i) => i.key === k)
    const v = m?.value.trim()
    if (!v) continue
    used.add(k)
    bits.push(say[k](v))
  }
  for (const m of items) {
    if (used.has(m.key)) continue
    const v = m.value.trim()
    if (!v) continue
    bits.push(`${m.value.replace(/[.!?]+$/g, '')}.`)
  }
  return bits.slice(0, 8).join(' ')
}

export function isMemoryRecall(text: string): boolean {
  return (
    RECALL_ALL.test(text) ||
    RECALL_NAME.test(text) ||
    RECALL_DRINK.test(text) ||
    RECALL_FOOD.test(text) ||
    RECALL_VAGUE.test(text)
  )
}
