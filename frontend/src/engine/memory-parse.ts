export type MemoryFact = { key: string; value: string; category: string }

export const MERK =
  /^\s*(?:merk(?:e)?\s*dir|denk(?:e)?\s+daran|notier(?:e)?\s+dir|speicher(?:e)?|erinner(?:e)?\s*dich(?:\s*an)?)\s*(?:bitte\s*)?[:-]?\s*(.+)$/is
export const VERGISS_ALL =
  /^\s*(?:vergiss|lösch(?:e)?)\s+(?:bitte\s+)?(alles(?:\s+über\s+mich)?|meine\s+erinnerungen)\s*[.!]?\s*$/is
export const VERGISS = /^\s*(?:vergiss|lösch(?:e)?\s*(?:die\s*)?erinnerung(?:\s*an)?)\s*[:-]?\s*(.+)$/is
export const RECALL_ALL =
  /^\s*(?:was\s+weißt\s+du\s+über\s+mich|was\s+hast\s+du\s+dir\s+gemerkt|erinnerst\s+du\s+dich(?:\s+an\s+mich)?|was\s+liegt\s+über\s+mich)\s*[?]?\s*$/is
export const RECALL_NAME =
  /^\s*(?:wie\s+heiß(?:e|t)\s+ich|wie\s+ist\s+mein\s+name|wer\s+bin\s+ich|mein\s+name\??)\s*[?]?\s*$/is
export const RECALL_DRINK =
  /^\s*(?:was\s+trinke?\s+ich(?:\s+gerne)?|was\s+mag\s+ich\s+(?:zu\s+)?trinken|mein\s+getränk\??)\s*[?]?\s*$/is
export const RECALL_FOOD =
  /^\s*(?:was\s+esse\s+ich(?:\s+gerne)?|was\s+mag\s+ich\s+(?:zu\s+)?essen|mein\s+essen\??)\s*[?]?\s*$/is
export const RECALL_VAGUE = /^\s*(?:was\s+mag\s+ich)\s*[?]?\s*$/is

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

  const drink =
    /(?:trinke?\s+(?:gerne\s+)?|lieblingsgetränk\s+ist\s+|getränk\s+ist\s+)(.+?)(?=\s+\bund\b|[,.!?]|$)/i.exec(
      text,
    )
  if (drink) push('getränk', drink[1], 'pref')

  const food =
    /(?:esse\s+(?:gerne\s+)?|lieblingsessen\s+ist\s+|essen\s+ist\s+)(.+?)(?=\s+\bund\b|[,.!?]|$)/i.exec(
      text,
    )
  if (food) push('essen', food[1], 'pref')

  const rest = MERK.exec(text)
  if (rest && !out.length) {
    const value = rest[1].trim()
    if (value.length >= 2) push('notiz', value, 'fact')
  }
  return out
}

export function isMemoryWrite(text: string): boolean {
  if (MERK.test(text)) return true
  if (/(?:ich\s+heiß(?:e|t)|mein\s+name\s+ist|nenn(?:e)?\s+mich)\b/i.test(text)) return true
  if (/\b(?:trinke?\s+(?:gerne)?|lieblingsgetränk|esse\s+(?:gerne)?|lieblingsessen)\b/i.test(text)) {
    return parseMemoryFacts(text).length > 0
  }
  return false
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
