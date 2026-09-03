/** Pack fragen / vergessen / korrigieren. Nicht Mate, nicht Reisen. */

export type PackAsk = { topic: string | null }
export type PackForget = { topic: string }

const PREF_ASK = /^\s*(?:was\s+(?:trinke?|esse)\s+ich|welche\s+reisen|mag\s+ich)\b/i

export function parsePackAsk(text: string): PackAsk | null {
  const t = text.trim()
  if (!t || t.length > 240) return null
  if (PREF_ASK.test(t)) return null
  if (/^\s*vergiss\s+fachwissen\b/i.test(t)) return null

  const beiUns = /^\s*was\s+steht\s+bei\s+uns\s+(?:zu[rm]?|über|zur)\s+(.+?)\s*[?]?\s*$/i.exec(t)
  if (beiUns) return { topic: cleanTopic(beiUns[1]) }

  const fach = /^\s*(?:was\s+(?:weißt|steht)\s+(?:du\s+)?(?:zum?\s+|über\s+)?)?fachwissen\s+(.+?)\s*[?]?\s*$/i.exec(t)
  if (fach) return { topic: cleanTopic(fach[1]) }

  const wie = /^\s*wie\s+funktioniert\s+(?:das|es)\s+bei\s+uns\s*[?]?\s*$/i.test(t)
  if (wie) return { topic: null }

  return null
}

export function parsePackForget(text: string): PackForget | null {
  const m = /^\s*vergiss\s+fachwissen\s+(.+?)\s*[.!]?\s*$/i.exec(text.trim())
  if (!m) return null
  const topic = cleanTopic(m[1])
  if (!topic) return null
  return { topic }
}

export function parsePackRevise(text: string, lastTool = ''): boolean {
  if (lastTool !== 'pack' && lastTool !== 'knowledge') return false
  return /^\s*(?:das\s+)?(?:stimmt\s+nicht|gilt\s+nicht\s+mehr|ist\s+falsch(?:\s+gemerkt)?)\s*[.!]?\s*$/i.test(
    text.trim(),
  )
}

function cleanTopic(raw: string): string | null {
  const t = raw.replace(/[.!?]+$/g, '').trim()
  return t.length >= 2 ? t : null
}
