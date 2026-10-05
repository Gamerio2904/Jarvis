import { isCommNo, isCommYes } from './places-parse.ts'
import { normalizeUtterance } from './utterance.ts'
import { looksLikeSpice, splitSpiceNames } from './spice-alias.ts'

export type CookIntent =
  | { kind: 'spice_store'; merge: boolean; names: string[] }
  | { kind: 'spice_recall' }
  | { kind: 'spice_forget' }
  | { kind: 'recipe' }
  | { kind: 'confirm_yes' }
  | { kind: 'confirm_no' }
  | { kind: 'confirm_drop'; name: string }
  | { kind: 'confirm_add'; name: string }

const WEB_SEARCH = /\b(?:suche\s+im\s+internet|recherchier|google\s+nach)\b/i
const WASH = /\b(?:wäsche|waschen|waschschüssel|pflegesymbol)\b/i

export function parseSpiceIntent(text: string): CookIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 220) return null
  if (WEB_SEARCH.test(t) || WASH.test(t)) return null
  if (/^\s*(?:welche|was\s+für)\s+gewürze\s+habe\s+ich\b/i.test(t)) return { kind: 'spice_recall' }
  if (/^\s*(?:vergiss|lösch(?:e)?)\s+(?:bitte\s+)?meine\s+gewürze/i.test(t)) return { kind: 'spice_forget' }
  const dazu = /(?:merk(?:e)?\s*dir\s+)?dazu\s+noch\s+(.+)$/i.exec(t)
  if (dazu) {
    const names = splitSpiceNames(dazu[1])
    if (names.length && (/\bgewürz/i.test(t) || names.every((n) => looksLikeSpice(n)))) {
      return { kind: 'spice_store', merge: true, names }
    }
  }
  const merke =
    /^\s*(?:merk(?:e)?\s*dir|speicher(?:e)?|notier(?:e)?\s+dir)\s+(?:dazu\s+noch\s+)?meine\s+gewürze(?:n)?\s*[:\s-]*(.*)$/is.exec(
      t,
    )
  if (merke) {
    const merge = /\bdazu\s+noch\b/i.test(t)
    return { kind: 'spice_store', merge, names: splitSpiceNames(merke[1] || '') }
  }
  return null
}

export function parseCookRecipeIntent(text: string): CookIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (WEB_SEARCH.test(t) || WASH.test(t)) return null
  if (/\b(?:zutaten\s+von|barcode|ean|open\s+food\s+facts|nährwert)\b/i.test(t)) return null
  if (
    /^\s*(?:was\s+kann\s+ich\s+(?:damit\s+|daraus\s+|hieraus\s+|aus\s+dem\s+(?:bild|foto)\s+)?kochen|rezept(?:\s+aus\s+dem\s+(?:bild|foto))?|koch(?:e)?\s+(?:etwas|was|damit)|speisekammer)\b/i.test(
      t,
    )
  ) {
    return { kind: 'recipe' }
  }
  return null
}

export function parseCookConfirm(text: string): CookIntent | null {
  const raw = text.trim()
  if (isCommYes(raw)) return { kind: 'confirm_yes' }
  if (isCommNo(raw)) return { kind: 'confirm_no' }
  const t = normalizeUtterance(raw)
  const drop = /^\s*(?:ohne|nicht)\s+(.+?)\s*[.!?]*$/i.exec(t)
  if (drop) {
    const name = drop[1].replace(/^(?:die|den|das|eine?)\s+/i, '').trim()
    if (name.length >= 2 && name.length <= 40) return { kind: 'confirm_drop', name }
  }
  const add = /^\s*(?:dazu(?:\s+noch)?|und)\s+(.+?)\s*[.!?]*$/i.exec(t)
  if (add && !/\bgewürz/i.test(t)) {
    const name = add[1].replace(/^(?:die|den|das|eine?)\s+/i, '').trim()
    if (name.length >= 2 && name.length <= 40) return { kind: 'confirm_add', name }
  }
  return null
}

export function parseCookIntent(text: string): CookIntent | null {
  return parseSpiceIntent(text) || parseCookRecipeIntent(text)
}

export function parseCookAny(text: string): CookIntent | null {
  return parseCookIntent(text) || parseCookConfirm(text)
}
