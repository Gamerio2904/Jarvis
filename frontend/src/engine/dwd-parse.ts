import { normalizeUtterance } from './utterance.ts'

export type DwdIntent = { kind: 'warn' }

const WARN =
  /\b(unwetter|dwd|wetterwarnung|unwetterwarnung|amtliche\s+warnung|warnlage|gewitterwarnung|sturmwarnung)\b/i
const ASK = /\b(gibt.?s|gibt\s+es|herrscht|liegt|kommt|warnung|warnungen)\b/i

export function parseDwdIntent(text: string): DwdIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  if (/\b(blitzer|baustelle|radar)\b/i.test(t)) return null
  if (!WARN.test(t)) return null
  if (ASK.test(t) || /^\s*(dwd|unwetter|wetterwarnung)/i.test(t)) return { kind: 'warn' }
  return { kind: 'warn' }
}
