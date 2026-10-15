import type { CardRule, DuelCard, DuelEffect, EffectTrigger } from './yugioh-duel.ts'
import { parsePsctAtoms } from './yugioh-psct.ts'
import { spellSpeedForCard } from './yugioh-zones.ts'

export const EFFECT_SCHEMA_VERSION = 2 as const

export type EffectTiming = 'normal' | 'quick' | 'trigger' | 'flip' | 'continuous'

export type EffectSchemaV2 = {
  version: typeof EFFECT_SCHEMA_VERSION
  timing: EffectTiming
  trigger: EffectTrigger
  spellSpeed: 1 | 2 | 3
  effect: DuelEffect
  summary: string
  rules?: CardRule[]
  oncePerTurn: boolean
  hardOncePerTurn: boolean
  failClosed?: boolean
}

function triggerFrom(text: string, card: Pick<DuelCard, 'kind' | 'subtype' | 'type'>): EffectTrigger {
  if (/flipped face-up|\bflip:/i.test(text) || /aufgedeckt wird|flip[\s-]*effekt/i.test(text)) return 'flip'
  if (
    /when this card is (?:normal |flip |special |tribute )?summoned|if this card is (?:normal |special )?summoned/i.test(text) ||
    /(?:normal|als)\s+beschw[oö]r|beschworen wird/i.test(text) ||
    (/summon/i.test(text) && /(?:atk|def) becomes|(?:atk|def) (?:wird|werden)/i.test(text))
  ) return 'summon'
  if (/\bflip\b/i.test(card.type || '')) return 'flip'
  if (card.kind === 'trap' || /quick-play/i.test(card.subtype || '')) return 'quick'
  if (/continuous|equip|field/i.test(card.subtype || '')) return 'continuous'
  return 'ignition'
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

function wordCount(raw: string | undefined, fallback = 1): number {
  if (!raw) return fallback
  const named: Record<string, number> = { a: 1, one: 1, two: 2, three: 3 }
  const namedCount = named[raw.toLowerCase()]
  if (namedCount) return namedCount
  const amount = Number(raw)
  return Number.isFinite(amount) ? Math.max(1, Math.min(5, amount)) : fallback
}

function collectRules(text: string): CardRule[] {
  const rules: CardRule[] = []
  const add = (rule: CardRule) => {
    if (!rules.includes(rule)) rules.push(rule)
  }
  if (/cannot be normal summoned/i.test(text)) add('cannotNormal')
  if (/piercing battle damage/i.test(text)) add('piercing')
  if (/can attack (?:your opponent |the opponent )?directly|(?:^|[.;] )attack directly/i.test(text)) add('direct')
  if (/\bcannot attack\b/i.test(text) && !/cannot attack directly/i.test(text)) add('cannotAttack')
  if (/cannot be destroyed by battle/i.test(text)) add('battleProof')
  if (/cannot be destroyed by (?:card )?effects/i.test(text)) add('effectProof')
  if (/cannot be targeted by/i.test(text)) add('untargetable')
  if (/unaffected by (?:other |your opponent's )?card effects/i.test(text)) add('unaffected')
  if (/each time a spell card is activated, place/i.test(text)) add('spellCounter')
  return rules
}

function ruleSummary(rule: CardRule): string {
  switch (rule) {
    case 'cannotNormal': return 'Kann nicht normalbeschworen oder gesetzt werden.'
    case 'piercing': return 'Durchschlagender Kampfschaden.'
    case 'direct': return 'Kann direkt angreifen.'
    case 'cannotAttack': return 'Kann nicht angreifen.'
    case 'battleProof': return 'Wird im Kampf nicht zerstört.'
    case 'effectProof': return 'Wird von Karteneffekten nicht zerstört.'
    case 'untargetable': return 'Kann nicht als Ziel gewählt werden.'
    case 'unaffected': return 'Ist von Karteneffekten unberührt.'
    case 'spellCounter': return 'Erhält eine Spielmarke, wenn ein Zauber aktiviert wird.'
  }
}

function parsePrimaryEffect(text: string): { effect: DuelEffect; summary: string } | null {
  const summon = /special summon this card \(from your hand\)/i.test(text)
  if (summon) {
    const discard = text.match(/discard(?:ing)? (\d+|a|one|two|three) cards?/i)
    const tribute = text.match(/tribut(?:e|ing) (\d+|a|one|two|three) monsters?/i)
    const discardCount = discard ? wordCount(discard[1]) : 0
    const tributeCount = tribute ? wordCount(tribute[1]) : 0
    const cost = [
      tributeCount ? `${tributeCount} Tribut` : '',
      discardCount ? `${discardCount} abwerfen` : '',
    ].filter(Boolean).join(', ')
    return {
      effect: { kind: 'summonHand', tributes: tributeCount, discard: discardCount },
      summary: cost ? `Spezialbeschwörung aus der Hand (${cost}).` : 'Spezialbeschwörung aus der Hand.',
    }
  }
  const token = text.match(/special summon (\d+|a|one|two|three) [^.]{0,80}?tokens?/i)
  if (token) {
    const amount = wordCount(token[1])
    const atk = Number(text.match(/atk\s*\/?\s*(\d+)/i)?.[1] ?? 0)
    const def = Number(text.match(/def\s*\/?\s*(\d+)/i)?.[1] ?? 0)
    const name = text.match(/"([^"]*token[^"]*)"/i)?.[1]
    return {
      effect: { kind: 'token', amount, atk, def, ...(name ? { name } : {}) },
      summary: `Beschwört ${amount} Token (${atk}/${def}).`,
    }
  }
  const removeCounter = text.match(/remove (\d+|a|one|two|three) spell counters?/i)
  const drawsAfter = /draw (?:up to )?(?:(\d+)|a|one) cards?/i.test(text)
  if (removeCounter && drawsAfter && !/destroy|banish|negate the/i.test(text)) {
    const amount = wordCount(removeCounter[1])
    return {
      effect: { kind: 'counter', amount, mode: 'remove', then: 'draw' },
      summary: `Entfernt ${amount} Spielmarke(n) und zieht 1 Karte.`,
    }
  }
  const placeCounter = text.match(/place (\d+|a|one|two|three) spell counters?/i)
  if (placeCounter && !removeCounter && !/each time a spell card is activated/i.test(text)) {
    const amount = wordCount(placeCounter[1])
    return {
      effect: { kind: 'counter', amount, mode: 'place' },
      summary: `Legt ${amount} Spielmarke(n) auf diese Karte.`,
    }
  }
  const pointed = text.match(/gains? (\d{2,4}) atk for each (?:monster|card) (?:this card |it )?points to/i)
  if (pointed) {
    const amount = Math.max(100, Math.min(1000, Number(pointed[1])))
    return {
      effect: { kind: 'pointBoost', amount },
      summary: `Erhält +${amount} ATK für jedes Monster, auf das sie zeigt.`,
    }
  }
  if (/negate the attack/i.test(text)) return { effect: { kind: 'negateAttack' }, summary: 'Negiert den gegnerischen Angriff.' }
  const both = text.match(/draw (?:up to )?(?:(\d+)|a|one) cards?[^.]{0,80}?discard (?:(\d+)|a|one) cards?/i)
  if (both) {
    const draw = Math.max(1, Math.min(3, Number(both[1] || 1)))
    const discard = Math.max(1, Math.min(5, Number(both[2] || 1)))
    return { effect: { kind: 'drawDiscard', draw, discard }, summary: `Zieht ${draw} und wirft ${discard} ab.` }
  }
  const negate = text.match(/negate (?:the )?(?:summon|activation|effect)/i)
  if (negate) {
    const half = /pay half your lp/i.test(text)
    return {
      effect: { kind: 'negate', ...(half ? { cost: 'halfLp' as const } : {}) },
      summary: half ? 'Negiert und zahlt die Hälfte der LP.' : 'Negiert das vorherige Kettenglied (vereinfachte Regel).',
    }
  }
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
  const setAtk = text.match(
    /(?:this card(?:'s)? |its |the )?original atk becomes (\d{1,5})|(?:this card(?:'s)? |its )atk becomes (\d{1,5})|becomes atk (\d{1,5})|(?:ihre |seine |die )?atk (?:wird|werden) (?:auf )?(\d{1,5})/i,
  )
  if (setAtk) {
    const value = Math.max(0, Math.min(10000, Number(setAtk[1] || setAtk[2] || setAtk[3] || setAtk[4])))
    return { effect: { kind: 'setStat', stat: 'atk', value }, summary: `Setzt die ATK auf ${value}.` }
  }
  const setDef = text.match(
    /(?:this card(?:'s)? |its |the )?original def becomes (\d{1,5})|(?:this card(?:'s)? |its )def becomes (\d{1,5})|(?:ihre |seine |die )?def (?:wird|werden) (?:auf )?(\d{1,5})/i,
  )
  if (setDef) {
    const value = Math.max(0, Math.min(10000, Number(setDef[1] || setDef[2] || setDef[3])))
    return { effect: { kind: 'setStat', stat: 'def', value }, summary: `Setzt die DEF auf ${value}.` }
  }
  const fieldAura = text.match(/all (?:face-up )?(?:your )?monsters (?:you control )?gain (\d{3,4}) atk|each (?:face-up )?monster you control gains? (\d{3,4}) atk/i)
  if (fieldAura || (/field spell/i.test(text) && /gain (\d{3,4}) atk/i.test(text))) {
    const amount = Math.max(100, Math.min(1000, Number(fieldAura?.[1] || fieldAura?.[2] || text.match(/gain (\d{3,4}) atk/i)?.[1] || 0)))
    if (amount) return { effect: { kind: 'fieldAura', stat: 'atk', amount }, summary: `Alle deine Monster erhalten +${amount} ATK (Spielfeld).` }
  }
  const boost = text.match(/gains? (\d{3,4}) atk|(?:atk|attack) (?:is |are )?(?:increased|raised) by (\d{3,4})/i)
  if (boost) {
    const amount = Math.max(100, Math.min(3000, Number(boost[1] || boost[2])))
    return { effect: { kind: 'boost', amount }, summary: `Gibt deinem stärksten Monster bis zum Zugende +${amount} ATK.` }
  }
  return null
}

function parseLegacyDescription(description: string): { effect: DuelEffect; summary: string; rules?: CardRule[] } | null {
  const text = (description || '').replace(/\s+/g, ' ').trim()
  if (!text) return null
  const rules = collectRules(text)
  const parsed = parsePrimaryEffect(text)
  if (!parsed) {
    if (!rules.length) return null
    return { effect: { kind: 'rule', rule: rules[0] }, summary: rules.map(ruleSummary).join(' '), rules }
  }
  return rules.length ? { ...parsed, rules } : parsed
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
        trigger: triggerFrom(description, card),
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
    trigger: triggerFrom(description, card),
    spellSpeed: spellSpeedForCard(card as DuelCard),
    effect: parsed.effect,
    summary: parsed.summary,
    ...(parsed.rules?.length ? { rules: parsed.rules } : {}),
    oncePerTurn: psct.oncePerTurn,
    hardOncePerTurn: psct.hardOncePerTurn,
  }
}

export function effectFromDescriptionV2(
  description: string,
  card: Pick<DuelCard, 'kind' | 'subtype' | 'type' | 'faceDown'> = { kind: 'spell', subtype: 'Normal', type: 'Spell Card' },
): { effect: DuelEffect; summary: string; trigger: EffectTrigger; rules?: CardRule[] } | null {
  const schema = resolveEffectSchema(description, card)
  if (!schema || schema.failClosed) return null
  return {
    effect: schema.effect,
    summary: schema.summary,
    trigger: schema.trigger,
    ...(schema.rules?.length ? { rules: schema.rules } : {}),
  }
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
