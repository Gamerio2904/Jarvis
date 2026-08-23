import { normalizeUtterance } from './utterance.ts'

export type HouseIntent =
  | { kind: 'wash'; token?: string }
  | { kind: 'stain'; stain: string }

const WASH = /\b(waschschüssel|wäschezeichen|pflegezeichen|waschsymbol|waschtrommel|nicht\s+bleichen|bügeln|trockner)\b/i
const STAIN = /\b(fleck|weinfleck|fettfleck|grasfleck|blutfleck|kaffeefleck)\b/i

export function parseHouseIntent(text: string): HouseIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  if (STAIN.test(t)) {
    const stain = /\bwein/i.test(t)
      ? 'wein'
      : /\bfett|öl/i.test(t)
        ? 'fett'
        : /\bgras/i.test(t)
          ? 'gras'
          : /\bblut/i.test(t)
            ? 'blut'
            : /\bkaffee/i.test(t)
              ? 'kaffee'
              : 'fleck'
    return { kind: 'stain', stain }
  }
  if (!WASH.test(t) && !/\bwas\s+bedeutet\s+die\s+wasch/i.test(t)) return null
  const token = /\b(\d{2})\s*(?:°|grad)?/i.exec(t)?.[1]
  return { kind: 'wash', token }
}
