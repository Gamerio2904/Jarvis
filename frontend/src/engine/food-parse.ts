import { normalizeUtterance } from './utterance.ts'

export type FoodIntent = { kind: 'lookup'; query?: string; barcode?: string }

const PRODUCT = /\b(produkt|lebensmittel|nährwert|open\s+food|barcode|ean|strichcode)\b/i
const WHAT = /\bwas\s+ist\s+das\s+für\s+ein\s+produkt\b/i

export function parseFoodIntent(text: string): FoodIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (/\b(pflanze|vogel|tier|buch|blitzer)\b/i.test(t)) return null
  const ean = t.replace(/\s+/g, '').match(/\b(\d{8}|\d{13})\b/)
  if (ean && (PRODUCT.test(t) || WHAT.test(t) || /^\s*\d{8,13}\s*$/.test(t.replace(/\s/g, '')))) {
    return { kind: 'lookup', barcode: ean[1] }
  }
  if (!PRODUCT.test(t) && !WHAT.test(t)) return null
  const q = t
    .replace(WHAT, '')
    .replace(/\b(was\s+ist|produkt|lebensmittel|nährwert(?:e)?|open\s+food\s+facts|barcode|ean)\b/gi, '')
    .replace(/[?.!]+/g, '')
    .trim()
  return { kind: 'lookup', query: q || undefined }
}
