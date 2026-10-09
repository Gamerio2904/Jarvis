import type { DuelCard, DuelEffect } from './yugioh-duel.ts'
import { parsePsctAtoms } from './yugioh-psct.ts'
import { spellSpeedForCard } from './yugioh-zones.ts'

export const EFFECT_SCHEMA_VERSION = 2 as const

export type EffectTiming = 'normal' | 'quick' | 'trigger' | 'flip' | 'continuous'

export type EffectSchemaV2 = {
  version: typeof EFFECT_SCHEMA_VERSION
  timing: EffectTiming
  spellSpeed: 1 | 2 | 3
  effect: DuelEffect
  summary: string
  oncePerTurn: boolean
  hardOncePerTurn: boolean
  failClosed?: boolean
}

function timingFromCard(card: Pick<DuelCard, 'kind' | 'subtype' | 'type' | 'faceDown'>): EffectTiming {
  if (card.faceDown) return 'flip'
  if (card.kind === 'trap') return /continuous/i.test(card.subtype || '') ? 'continuous' : 'trigger'
  if (card.kind === 'spell') {
    if (/field/i.test(card.subtype || '')) return 'continuous'
    if (/quick-play/i.test(card.subtype || '')) return 'quick'
    if (/continuous|equip/i.test(card.subtype || '')) return 'continuous'
    return 'normal'
  }
  if (/flip/i.test(card.type || '')) return 'flip'
  return 'trigger'
}

function parseLegacyDescription(description: string): { effect: DuelEffect; summary: string } | null {
  const text = (description || '').replace(/\s+/g, ' ').trim()
  if (!text) return null
  if (/negate the attack/i.test(text)) return { effect: { kind: 'negateAttack' }, summary: 'Negiert den gegnerischen Angriff.' }
  const negate = text.match(/negate (?:the )?(?:activation|effect)/i)
  if (negate) return { effect: { kind: 'negate' }, summary: 'Negiert das vorherige Kettenglied (vereinfachte Regel).' }
  if (/destroy all (?:the )?attack position monsters/i.test(text)) {
    return { effect: { kind: 'destroy', target: 'attackMonsters' }, summary: 'Zerstört alle Angriffs-Monster des Gegners.' }
  }
  if (/destroy all (?:face-up )?monsters (?:your opponent controls|on the field)/i.test(text)) {
    return { effect: { kind: 'destroy', target: 'allMonsters' }, summary: 'Zerstört alle Monster des Gegners.' }
  }
  if (/destroy (?:1|one) (?:face-up )?(?:spell\/trap|spell or trap|trap|spell)(?: card)?/i.test(text)) {
    return { effect: { kind: 'destroy', target: 'spelltrap' }, summary: 'Zerstört eine Zauber-/Fallenkarte des Gegners.' }
  }
  if (/destroy (?:1|one) (?:face-up )?(?:monster|card)/i.test(text)) {
    return { effect: { kind: 'destroy', target: 'monster' }, summary: 'Zerstört ein gegnerisches Monster.' }
  }
  if (/banish (?:1|one|up to \d) (?:face-up )?(?:monster|card)[^.]{0,40}? from (?:your )?(?:gy|graveyard)/i.test(text)) {
    return { effect: { kind: 'banish', target: 'gyMonster' }, summary: 'Verbannt ein Monster aus dem Friedhof.' }
  }
  if (/banish (?:1|one) (?:face-up )?(?:monster|card)/i.test(text)) {
    return { effect: { kind: 'banish', target: 'monster' }, summary: 'Verbannt ein gegnerisches Monster.' }
  }
  if (/return (?:1|one) (?:face-up )?monster (?:on the field )?to (?:the )?hand/i.test(text)) {
    return { effect: { kind: 'bounce', target: 'monster' }, summary: 'Gibt ein gegnerisches Monster auf die Hand zurück.' }
  }
  const mill = text.match(/send (?:the top )?(\d+) cards? from (?:your )?deck to (?:the )?(?:gy|graveyard)/i)
  if (mill) {
    const amount = Math.max(1, Math.min(10, Number(mill[1])))
    return { effect: { kind: 'mill', amount }, summary: `Legt ${amount} Karte(n) vom Deck auf den Friedhof.` }
  }
  const discard = text.match(/discard (\d+) cards?/i)
  if (discard) {
    const amount = Math.max(1, Math.min(5, Number(discard[1])))
    return { effect: { kind: 'discard', amount }, summary: `Wirft ${amount} Karte(n) ab.` }
  }
  const draw = text.match(/draw (?:up to )?(?:(\d+)|a|one) cards?/i)
  if (draw) {
    const amount = Math.max(1, Math.min(3, Number(draw[1] || 1)))
    return { effect: { kind: 'draw', amount }, summary: `Zieht ${amount} Karte(n).` }
  }
  const damage = text.match(/(?:inflict|take) (\d{1,4}) damage to (?:your )?opponent/i)
  if (damage) {
    const amount = Math.max(0, Math.min(8000, Number(damage[1])))
    return { effect: { kind: 'damage', amount }, summary: `Fügt dem Gegner ${amount} Schaden zu.` }
  }
  const heal = text.match(/gain (\d{1,4}) lp/i)
  if (heal) {
    const amount = Math.max(0, Math.min(8000, Number(heal[1])))
    return { effect: { kind: 'heal', amount }, summary: `Stellt ${amount} LP wieder her.` }
  }
  if (/special summon (?:1|one) [^.]{0,80}? from your (?:gy|graveyard)/i.test(text)) {
    return { effect: { kind: 'revive' }, summary: 'Belebt das stärkste Monster aus dem Friedhof wieder.' }
  }
  if (/add (?:1|one|up to \d) [^.]{0,100}? from your deck to your hand/i.test(text)) {
    return { effect: { kind: 'search', amount: 1 }, summary: 'Nimmt 1 Karte aus dem Deck auf die Hand.' }
  }
  const boost = text.match(/gains? (\d{3,4}) atk|(?:atk|attack) (?:is |are )?(?:increased|raised) by (\d{3,4})/i)
  if (boost) {
    const amount = Math.max(100, Math.min(3000, Number(boost[1] || boost[2])))
    return { effect: { kind: 'boost', amount }, summary: `Gibt deinem stärksten Monster bis zum Zugende +${amount} ATK.` }
  }
  const fieldAura = text.match(/all (?:face-up )?monsters you control gain (\d{3,4}) atk/i)
  if (fieldAura) {
    const amount = Math.max(100, Math.min(1000, Number(fieldAura[1])))
    return { effect: { kind: 'fieldAura', stat: 'atk', amount }, summary: `Alle deine Monster erhalten +${amount} ATK (Spielfeld).` }
  }
  return null
}

export function resolveEffectSchema(
  description: string,
  card: Pick<DuelCard, 'kind' | 'subtype' | 'type' | 'faceDown'>,
): EffectSchemaV2 | null {
  const psct = parsePsctAtoms(description)
  const parsed = parseLegacyDescription(description)
  if (!parsed) {
    if (psct.oncePerTurn && /shuffle your hand/i.test(description)) {
      return {
        version: EFFECT_SCHEMA_VERSION,
        timing: timingFromCard(card),
        spellSpeed: spellSpeedForCard(card as DuelCard),
        effect: { kind: 'discard', amount: 0 },
        summary: 'Nicht unterstützter OPT-Effekt (fail-closed).',
        oncePerTurn: true,
        hardOncePerTurn: psct.hardOncePerTurn,
        failClosed: true,
      }
    }
    return null
  }
  if (parsed.effect.kind === 'discard' && (parsed.effect as { amount: number }).amount === 0) return null
  return {
    version: EFFECT_SCHEMA_VERSION,
    timing: timingFromCard(card),
    spellSpeed: spellSpeedForCard(card as DuelCard),
    effect: parsed.effect,
    summary: parsed.summary,
    oncePerTurn: psct.oncePerTurn,
    hardOncePerTurn: psct.hardOncePerTurn,
  }
}

export function effectFromDescriptionV2(description: string): { effect: DuelEffect; summary: string } | null {
  const schema = resolveEffectSchema(description, { kind: 'spell', subtype: 'Normal', type: 'Spell Card' })
  if (!schema || schema.failClosed) return null
  return { effect: schema.effect, summary: schema.summary }
}

export type DeckCoverageReport = {
  schemaVersion: number
  total: number
  withEffect: number
  ratio: number
  failClosed: number
}

export function deckEffectCoverage(deck: DuelCard[]): DeckCoverageReport {
  const main = deck.filter((card) => !card.extraDeck)
  let withEffect = 0
  let failClosed = 0
  for (const card of main) {
    if (/normal monster/i.test(card.type)) continue
    const schema = resolveEffectSchema(card.effectSummary || '', card)
    if (card.effect) withEffect += 1
    else if (schema && !schema.failClosed) withEffect += 1
    else if (schema?.failClosed) failClosed += 1
  }
  const total = main.filter((card) => !/normal monster/i.test(card.type)).length
  return {
    schemaVersion: EFFECT_SCHEMA_VERSION,
    total,
    withEffect,
    ratio: total ? withEffect / total : 1,
    failClosed,
  }
}
