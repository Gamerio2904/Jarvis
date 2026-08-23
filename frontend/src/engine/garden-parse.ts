import { normalizeUtterance } from './utterance.ts'

export type GardenIntent = { kind: 'id'; query?: string }

const PLANT = /\b(pflanze|gewächs|garten|unkraut|blume|baum|strauch|inaturalist)\b/i
const WHAT = /\bwas\s+ist\s+das\s+für\s+eine\s+pflanze\b/i

export function parseGardenIntent(text: string): GardenIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (/\b(produkt|vogel|tier|buch|essbar|giftig)\b/i.test(t) && !PLANT.test(t) && !WHAT.test(t)) return null
  if (!PLANT.test(t) && !WHAT.test(t)) return null
  const q = t
    .replace(WHAT, '')
    .replace(/\b(was\s+ist|pflanze|gewächs|garten|unkraut|blume|baum|strauch)\b/gi, '')
    .replace(/[?.!]+/g, '')
    .trim()
  return { kind: 'id', query: q || undefined }
}
