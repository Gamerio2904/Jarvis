import { gazetteerHit } from './globe-geo.ts'
import { normalizeUtterance } from './utterance.ts'

export type GroundIntent =
  | { kind: 'find'; query: string; click: boolean }
  | { kind: 'count'; query: string }
  | { kind: 'type_into'; field: string; text: string }
  | { kind: 'slip'; topic: 'receipt' | 'paper' | 'wash' | 'ean' | 'desk'; query?: string }
  | { kind: 'two_step'; a: string; b: string }

const SKIP =
  /\b(iss|internationale\s+raumstation|freundin|ich\s+bin|zuhause|wetter|tanke|apotheke|spotify|carplay|overlay|körper|koerper|lage|hirn|kalender|wetterstatistik|erde|kugel)\b/i

export function parseGroundIntent(text: string): GroundIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (SKIP.test(t) && !/\b(speichern|start|beleg|zettel|ean|wasch)\b/i.test(t)) return null

  const two = /^\s*(.+?),\s+dann\s+(.+?)\s*$/i.exec(t) || /^\s*(.+?)\s+dann\s+(.+?)\s*$/i.exec(t)
  if (two && /\b(einstellungen|settings|system)\b/i.test(two[1])) {
    return { kind: 'two_step', a: two[1].trim(), b: two[2].replace(/[.!?]+$/, '').trim() }
  }

  if (/\b(was\s+steht\s+auf\s+dem\s+beleg|beleg\s+lesen)\b/i.test(t)) {
    return { kind: 'slip', topic: 'receipt' }
  }
  if (/\b(termin\s+aus\s+dem\s+zettel|zettel\s+termin)\b/i.test(t)) {
    return { kind: 'slip', topic: 'paper' }
  }
  if (/\b(waschlabel|pflegezeichen\s+auf\s+dem\s+foto|waschsymbol\s+foto)\b/i.test(t)) {
    return { kind: 'slip', topic: 'wash' }
  }
  if (/\b(ean\s+auf\s+dem\s+foto|barcode\s+foto)\b/i.test(t)) {
    return { kind: 'slip', topic: 'ean' }
  }
  const desk = /^\s*wo\s+liegt\s+(.+?)\s*$/i.exec(t)
  if (desk) {
    const q = desk[1].replace(/[.!?]+$/, '').trim()
    if (gazetteerHit(q)) return null
    if (q.length >= 2 && !/\b(speichern|start|ok|button|feld|symbol|einstellungen)\b/i.test(q)) {
      return { kind: 'slip', topic: 'desk', query: q }
    }
  }

  if (/\bwie\s+viele\s+(fenster|icons?|schaltflächen)\b/i.test(t)) {
    return { kind: 'count', query: /fenster/i.test(t) ? 'Fenster' : 'Icons' }
  }

  const typeInto =
    /^\s*(?:tippe|schreib(?:e)?)\s+[„"](.+?)[”"]\s+(?:in(?:s)?|auf)\s+(?:das\s+|die\s+|den\s+)?feld\s+(.+?)\s*$/i.exec(
      t,
    )
  if (typeInto) {
    return { kind: 'type_into', text: typeInto[1], field: typeInto[2].replace(/[.!?]+$/, '').trim() }
  }
  const typeBare = /^\s*tippe\s+(.+?)\s+in(?:s)?\s+(?:das\s+|die\s+|den\s+)?(?:feld\s+)?(.+?)\s*$/i.exec(t)
  if (typeBare) {
    const textVal = typeBare[1].replace(/^[„"]|[”"]$/g, '').trim()
    const field = typeBare[2].replace(/[.!?]+$/, '').trim()
    if (textVal.length >= 1 && field.length >= 2 && !/\b(freundin|mama|papa|whatsapp|sms)\b/i.test(t)) {
      return { kind: 'type_into', text: textVal, field }
    }
  }

  const findClick = /^\s*klick(?:e)?\s+(?:auf\s+)?(.+?)\s*$/i.exec(t)
  if (findClick && !/\b(mitte|links|rechts|oben|unten|captcha)\b/i.test(findClick[1])) {
    const q = findClick[1].replace(/[.!?]+$/, '').trim()
    if (q.length >= 2) return { kind: 'find', query: q, click: true }
  }

  const findShow = /^\s*zeig(?:e)?\s+(?:der|die|das|den)?\s*(.+?)\s*$/i.exec(t)
  if (findShow && /\b(speichern|start|ok|button|feld|symbol)\b/i.test(findShow[1])) {
    return { kind: 'find', query: findShow[1].replace(/[.!?]+$/, '').trim(), click: false }
  }
  const find = /^\s*wo\s+ist\s+(?:der|die|das|den)?\s*(.+?)\s*$/i.exec(t)
  if (find) {
    const q = find[1].replace(/[.!?]+$/, '').trim()
    if (gazetteerHit(q)) return null
    if (q.length >= 2 && !/\b(ich|die\s+iss|freundin)\b/i.test(q)) {
      return { kind: 'find', query: q, click: false }
    }
  }
  return null
}

export function isPcGround(g: GroundIntent | null): g is Extract<GroundIntent, { kind: 'find' | 'count' | 'type_into' | 'two_step' }> {
  return Boolean(g && (g.kind === 'find' || g.kind === 'count' || g.kind === 'type_into' || g.kind === 'two_step'))
}

export function isEyeGround(g: GroundIntent | null): g is Extract<GroundIntent, { kind: 'slip' }> {
  return g?.kind === 'slip'
}
