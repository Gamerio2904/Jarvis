import type { DuelCard, DuelEffect, EffectTrigger } from './yugioh-duel.ts'
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
  if (!raw || /^a$|^one$/i.test(raw)) return fallback
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function nearOpponent(text: string, index: number): boolean {
  return /opponent/i.test(text.slice(Math.max(0, index - 40), index + 48))
}

function targetsOwnField(text: string): boolean {
  return /you control/i.test(text) && !/your opponent|opponent's|they control/i.test(text)
}

function targetIsSpellTrap(text: string): boolean {
  const target = text.match(/target[^.;:]{0,140}/i)?.[0] || ''
  const window = target || text
  const spell = /spell|trap|equip card/i.test(window)
  const monster = /\bmonster\b/i.test(window)
  if (target) return spell && !monster
  return /spell\s*\/\s*trap|spell or trap|equip card/i.test(text) && !monster
}

function targetInOwnGrave(text: string): boolean {
  return /target[^.;:]{0,160}(?:in|from) your (?:gy|graveyard)/i.test(text)
}

function targetInDeck(text: string): boolean {
  return /(?:in|from) your deck/i.test(text) && !/extra deck/i.test(text)
}

function matchClause(clause: string, context: string): { effect: DuelEffect; summary: string } | null {
  const halfLp = /pay half your lp/i.test(clause) || /pay half your lp/i.test(context)
  if (/negate the attack/i.test(clause)) return { effect: { kind: 'negateAttack' }, summary: 'Negiert den gegnerischen Angriff.' }
  if (/negate (?:that |its |the |their |an )?(?:activated )?(?:(?:target|monster|card)['’]s )?(?:summon|activation|effects?)/i.test(clause)) {
    return {
      effect: { kind: 'negate', ...(halfLp ? { cost: 'halfLp' as const } : {}) },
      summary: halfLp ? 'Negiert und zahlt die Hälfte der LP.' : 'Negiert das vorherige Kettenglied (vereinfachte Regel).',
    }
  }
  if (/destroy all (?:the )?attack position monsters/i.test(clause)) {
    return { effect: { kind: 'destroy', target: 'attackMonsters' }, summary: 'Zerstört alle Angriffs-Monster des Gegners.' }
  }
  if (/destroy all (?:other )?(?:face-up )?monsters\b/i.test(clause) && !/would be destroyed|cannot be destroyed/i.test(clause)) {
    return { effect: { kind: 'destroy', target: 'allMonsters' }, summary: 'Zerstört alle Monster des Gegners.' }
  }
  if (/destroy all (?:other )?cards on the field/i.test(clause)) {
    return { effect: { kind: 'destroy', target: 'allMonsters' }, summary: 'Zerstört alle Monster des Gegners.' }
  }
  if (/destroy all (?:face-up )?(?:other )?(?:spells? and traps?|spell and trap cards?|spell\/trap cards?)/i.test(clause)) {
    return { effect: { kind: 'destroy', target: 'allSpelltrap' }, summary: 'Zerstört alle Zauber und Fallen des Gegners.' }
  }
  if (/destroy (?:1|one|a) (?:face-up |set )?(?:spell\/trap|spell or trap|trap|spell)(?: card)?/i.test(clause)) {
    return { effect: { kind: 'destroy', target: 'spelltrap' }, summary: 'Zerstört eine Zauber-/Fallenkarte des Gegners.' }
  }
  if (/destroy (?:1|one|a) (?:face-up |set )?(?:monster|card)/i.test(clause) && !/would be destroyed|cannot be destroyed/i.test(clause)) {
    return { effect: { kind: 'destroy', target: 'monster' }, summary: 'Zerstört ein gegnerisches Monster.' }
  }
  if (/\bdestroy (?:that target|those targets|them|it|that (?:face-up )?(?:monster|spell\/trap|spell|trap|equip card|card)s?)\b/i.test(clause)
    && !/would be destroyed|cannot be destroyed|banish it when it leaves/i.test(clause)) {
    if (targetIsSpellTrap(context) || /spell|trap|equip card/i.test(clause)) {
      return { effect: { kind: 'destroy', target: 'spelltrap' }, summary: 'Zerstört eine Zauber-/Fallenkarte des Gegners.' }
    }
    return { effect: { kind: 'destroy', target: 'monster' }, summary: 'Zerstört ein gegnerisches Monster.' }
  }
  if (/banish (?:1|one|a|up to \d) (?:face-up )?(?:monster|card)[^.]{0,40}? from (?:your |the )?(?:gy|graveyard)/i.test(clause)) {
    return { effect: { kind: 'banish', target: 'gyMonster' }, summary: 'Verbannt ein Monster aus dem Friedhof.' }
  }
  if (/\bbanish (?:that target|those targets|them|it|that (?:monster|card))\b/i.test(clause) && !/when it leaves the field/i.test(clause)) {
    if (targetInOwnGrave(context) || /from (?:your |the )?(?:gy|graveyard)/i.test(clause)) {
      return { effect: { kind: 'banish', target: 'gyMonster' }, summary: 'Verbannt ein Monster aus dem Friedhof.' }
    }
    if (targetIsSpellTrap(context) || /spell|trap/i.test(clause)) {
      return { effect: { kind: 'banish', target: 'spelltrap' }, summary: 'Verbannt eine Zauber- oder Fallenkarte des Gegners.' }
    }
    return { effect: { kind: 'banish', target: 'monster' }, summary: 'Verbannt ein gegnerisches Monster.' }
  }
  if (/banish (?:1|one|a) (?:face-up )?(?:monster|card)/i.test(clause) && !/from (?:your |the )?(?:gy|graveyard)|when it leaves the field/i.test(clause)) {
    if (targetIsSpellTrap(clause) || /spell|trap/i.test(clause)) {
      return { effect: { kind: 'banish', target: 'spelltrap' }, summary: 'Verbannt eine Zauber- oder Fallenkarte des Gegners.' }
    }
    return { effect: { kind: 'banish', target: 'monster' }, summary: 'Verbannt ein gegnerisches Monster.' }
  }
  if (/return (?:it|that target|those targets|them|that (?:opponent's )?monster|(?:1|one|a) (?:face-up )?(?:opponent's )?monster)[^.]{0,50}to (?:the |its owner's |their )?hand/i.test(clause)
    && !targetsOwnField(context) && !targetsOwnField(clause)) {
    return { effect: { kind: 'bounce', target: 'monster' }, summary: 'Gibt ein gegnerisches Monster auf die Hand zurück.' }
  }
  const position = clause.match(/change (?:that target|it|that monster)[^.]{0,50}to (?:face-down )?defense position|change all [^.]{0,90}monsters[^.]{0,70}to (?:face-down )?defense position/i)
  if (position && !/this card/i.test(position[0])) {
    const all = /all /i.test(position[0])
    const faceDown = /face-down/i.test(position[0])
    const summary = all
      ? (faceDown ? 'Dreht alle gegnerischen Monster verdeckt in die Verteidigung.' : 'Setzt alle gegnerischen Monster in die Verteidigung.')
      : (faceDown ? 'Dreht ein gegnerisches Monster verdeckt in die Verteidigung.' : 'Setzt ein gegnerisches Monster in die Verteidigung.')
    return { effect: { kind: 'position', target: all ? 'allMonsters' : 'monster', faceDown }, summary }
  }
  const mill = clause.match(/send the top (\d+) cards? (?:of|from) (?!your opponent)(?:your |the )?deck to (?:the )?(?:gy|graveyard)/i)
    || clause.match(/send (\d+) (?:cards?|monsters?) from (?!your opponent)(?:the top of )?(?:your )?deck to (?:the )?(?:gy|graveyard)/i)
  if (mill && !nearOpponent(clause, mill.index || 0)) {
    const amount = Math.max(1, Math.min(10, Number(mill[1])))
    return { effect: { kind: 'mill', amount }, summary: `Legt ${amount} Karte(n) vom Deck auf den Friedhof.` }
  }
  const both = clause.match(/draw (?:up to )?(?:(\d+)|a|one) cards?[^.]{0,80}?discard (?:(\d+)|a|one) cards?/i)
    || clause.match(/discard (?:(\d+)|a|one) cards?[^.]{0,60}?draw (?:(\d+)|a|one) cards?/i)
  if (both && !nearOpponent(clause, both.index || 0)) {
    const firstIsDraw = /^draw/i.test(both[0])
    const draw = Math.max(1, Math.min(3, wordCount(firstIsDraw ? both[1] : both[2])))
    const discardCount = Math.max(1, Math.min(5, wordCount(firstIsDraw ? both[2] : both[1])))
    return { effect: { kind: 'drawDiscard', draw, discard: discardCount }, summary: `Zieht ${draw} und wirft ${discardCount} ab.` }
  }
  const discard = clause.match(/\bdiscard (?:(\d+)|a|one) cards?\b/i)
  if (discard && !nearOpponent(clause, discard.index || 0)) {
    const amount = Math.max(1, Math.min(5, wordCount(discard[1])))
    return { effect: { kind: 'discard', amount }, summary: `Wirft ${amount} Karte(n) ab.` }
  }
  const draw = clause.match(/\bdraw (?:up to )?(?:(\d+)|a|one) cards?\b/i)
  if (draw && !nearOpponent(clause, draw.index || 0)) {
    const amount = Math.max(1, Math.min(3, wordCount(draw[1])))
    return { effect: { kind: 'draw', amount }, summary: `Zieht ${amount} Karte(n).` }
  }
  const damage = clause.match(/(?:inflict|deal) (\d{2,4}) (?:points of )?damage to (?:your )?opponent|your opponent (?:takes|receives) (\d{2,4}) (?:points of )?damage/i)
  if (damage && !/piercing/i.test(clause)) {
    const amount = Math.max(0, Math.min(8000, Number(damage[1] || damage[2])))
    return { effect: { kind: 'damage', amount }, summary: `Fügt dem Gegner ${amount} Schaden zu.` }
  }
  const heal = clause.match(/gain (\d{2,4}) (?:lp|life points)/i)
  if (heal) {
    const amount = Math.max(0, Math.min(8000, Number(heal[1])))
    return { effect: { kind: 'heal', amount }, summary: `Stellt ${amount} LP wieder her.` }
  }
  const summons = /special summon (?:1|one|this card|that target|it|them)\b/i.test(clause) && !/cannot (?:be )?special summon/i.test(clause)
  const fromGrave = /from (?:your |the )?(?:gy|graveyard)/i.test(clause)
    || (/special summon (?:that target|it|them)\b/i.test(clause) && targetInOwnGrave(context))
  const fromElsewhere = /from (?:your |the )?(?:hand|deck|extra deck|banished)/i.test(clause)
  if (summons && fromGrave && !fromElsewhere) {
    return { effect: { kind: 'revive' }, summary: 'Belebt das stärkste Monster aus dem Friedhof wieder.' }
  }
  if (summons && !fromGrave && (/from (?:your )?(?:hand or )?deck/i.test(clause) || (/special summon (?:that target|it|them)\b/i.test(clause) && targetInDeck(context))) && !/extra deck/i.test(clause)) {
    return { effect: { kind: 'summonDeck' }, summary: 'Beschwört das stärkste Monster aus dem Deck.' }
  }
  if (/add (?:1|one|up to \d) [^.]{0,120}? from your deck to your hand/i.test(clause)
    || (/add (?:it|that target|those targets|them) to your hand/i.test(clause) && (targetInDeck(context) || /from your deck/i.test(clause)) && !targetInOwnGrave(context))) {
    return { effect: { kind: 'search', amount: 1 }, summary: 'Nimmt 1 Karte aus dem Deck auf die Hand.' }
  }
  if (/add (?:it|that target|those targets|them|(?:1|one) [^.]{0,80}) to your hand/i.test(clause)
    && (targetInOwnGrave(context) || /from your (?:gy|graveyard)/i.test(clause))
    && !targetInDeck(context)) {
    return { effect: { kind: 'recover' }, summary: 'Nimmt eine Karte aus dem Friedhof auf die Hand.' }
  }
  const setAtk = clause.match(
    /(?:this card(?:'s)? |its |the )?original atk becomes (\d{1,5})|(?:this card(?:'s)? |its )atk becomes (\d{1,5})|becomes atk (\d{1,5})|(?:ihre |seine |die )?atk (?:wird|werden) (?:auf )?(\d{1,5})/i,
  )
  const ownStat = /this card|its |ihre |seine |die atk|die def/i.test(clause) && !/that target|that monster|opponent/i.test(clause) && !/^target\b/i.test(context)
  if (setAtk && ownStat) {
    const value = Math.max(0, Math.min(10000, Number(setAtk[1] || setAtk[2] || setAtk[3] || setAtk[4])))
    return { effect: { kind: 'setStat', stat: 'atk', value }, summary: `Setzt die ATK auf ${value}.` }
  }
  const setDef = clause.match(
    /(?:this card(?:'s)? |its |the )?original def becomes (\d{1,5})|(?:this card(?:'s)? |its )def becomes (\d{1,5})|(?:ihre |seine |die )?def (?:wird|werden) (?:auf )?(\d{1,5})/i,
  )
  if (setDef && ownStat) {
    const value = Math.max(0, Math.min(10000, Number(setDef[1] || setDef[2] || setDef[3])))
    return { effect: { kind: 'setStat', stat: 'def', value }, summary: `Setzt die DEF auf ${value}.` }
  }
  if (/halve [^.]{0,40}atk/i.test(clause) && !/this card/i.test(clause)) {
    return { effect: { kind: 'weaken', amount: 0, half: true }, summary: 'Halbiert die ATK eines gegnerischen Monsters.' }
  }
  const lose = clause.match(/(?:it|that target|that monster|1 monster your opponent controls|your opponent(?:'s monster)?) loses (\d{3,4}) atk|(?:reduce|decrease) (?:that target's |its |that monster's )?atk by (\d{3,4})/i)
  if (lose && !/this card loses|monsters you control lose/i.test(clause)) {
    const amount = Math.max(100, Math.min(3000, Number(lose[1] || lose[2])))
    return { effect: { kind: 'weaken', amount, half: false }, summary: `Senkt die ATK eines gegnerischen Monsters um ${amount}.` }
  }
  const fieldAura = clause.match(/(?:all|each) (?:face-up )?(?:[a-z0-9"'/-]+ ){0,8}monsters? (?:you control |on (?:the )?field )?gains? (\d{3,4}) atk/i)
  if ((fieldAura && !/opponent/i.test(fieldAura[0])) || (/field spell/i.test(clause) && /gain (\d{3,4}) atk/i.test(clause) && !/opponent/i.test(clause))) {
    const amount = Math.max(100, Math.min(1000, Number(fieldAura?.[1] || clause.match(/gain (\d{3,4}) atk/i)?.[1] || 0)))
    if (amount) return { effect: { kind: 'fieldAura', stat: 'atk', amount }, summary: `Alle deine Monster erhalten +${amount} ATK (Spielfeld).` }
  }
  const boost = clause.match(/gains? (\d{3,4}) atk|(?:atk|attack) (?:is |are )?(?:increased|raised) by (\d{3,4})/i)
  if (boost && !/opponent/i.test(clause.slice(Math.max(0, (boost.index || 0) - 36), (boost.index || 0) + boost[0].length))) {
    const amount = Math.max(100, Math.min(3000, Number(boost[1] || boost[2])))
    return { effect: { kind: 'boost', amount }, summary: `Gibt deinem stärksten Monster bis zum Zugende +${amount} ATK.` }
  }
  return null
}

function sentencesOf(text: string): string[] {
  const sentences = text.split(/(?<=\.)\s+/).map((sentence) => sentence.trim()).filter(Boolean)
  return sentences.length ? sentences : [text]
}

function parseLegacyDescription(description: string): { effect: DuelEffect; summary: string } | null {
  const text = (description || '').replace(/\s+/g, ' ').trim()
  if (!text) return null
  if (/your opponent (?:selects|chooses) and executes/i.test(text)) return null
  const parts = text.split(';').map((part) => part.trim()).filter(Boolean)
  if (parts.length > 1) {
    for (let index = 1; index < parts.length; index += 1) {
      for (const sentence of sentencesOf(parts[index])) {
        const parsed = matchClause(sentence, parts[index - 1])
        if (parsed) return parsed
      }
    }
    return null
  }
  const sentences = sentencesOf(text)
  for (let index = 0; index < sentences.length; index += 1) {
    const parsed = matchClause(sentences[index], sentences[index - 1] || sentences[index])
    if (parsed) return parsed
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
    oncePerTurn: psct.oncePerTurn,
    hardOncePerTurn: psct.hardOncePerTurn,
  }
}

export function effectFromDescriptionV2(
  description: string,
  card: Pick<DuelCard, 'kind' | 'subtype' | 'type' | 'faceDown'> = { kind: 'spell', subtype: 'Normal', type: 'Spell Card' },
): { effect: DuelEffect; summary: string; trigger: EffectTrigger } | null {
  const schema = resolveEffectSchema(description, card)
  if (!schema || schema.failClosed) return null
  return { effect: schema.effect, summary: schema.summary, trigger: schema.trigger }
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
