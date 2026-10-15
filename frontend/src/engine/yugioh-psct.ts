import type { DuelCard, DuelEffect } from './yugioh-duel.ts'

export type PsctAtoms = {
  oncePerTurn: boolean
  hardOncePerTurn: boolean
  cannot: string[]
  trigger: string | null
  cost: string | null
  targetHint: string | null
}

const OPT = /once per turn/i
const HOPT = /you can only (?:use|activate) this effect of .+ once per turn/i

export function parsePsctAtoms(description: string): PsctAtoms {
  const text = (description || '').replace(/\s+/g, ' ').trim()
  const cannot = [...text.matchAll(/\bcannot\b[^.;]*/gi)].map((match) => match[0].trim())
  const trigger = text.match(/(?:when|if|during)[^.:]{0,120}/i)?.[0]?.trim() ?? null
  const cost = text.match(/(?:pay|discard|banish|tribute)[^.:]{0,80}/i)?.[0]?.trim() ?? null
  const targetHint = text.match(/target[^.;]{0,100}/i)?.[0]?.trim() ?? null
  return {
    oncePerTurn: OPT.test(text),
    hardOncePerTurn: HOPT.test(text),
    cannot,
    trigger,
    cost,
    targetHint,
  }
}

export type FidelityCase = {
  catalogId: number
  description: string
  expectedKind: DuelEffect['kind'] | null
}

const GOLD_FIDELITY: FidelityCase[] = [
  { catalogId: 1, description: 'Draw 2 cards.', expectedKind: 'draw' },
  { catalogId: 2, description: 'Inflict 500 damage to your opponent.', expectedKind: 'damage' },
  { catalogId: 3, description: 'Destroy 1 monster your opponent controls.', expectedKind: 'destroy' },
  { catalogId: 4, description: 'Negate the attack.', expectedKind: 'negateAttack' },
  { catalogId: 5, description: 'Add 1 monster from your Deck to your hand.', expectedKind: 'search' },
  { catalogId: 6, description: 'Target 1 monster your opponent controls; destroy that target.', expectedKind: 'destroy' },
  { catalogId: 7, description: 'Target 1 Spell/Trap on the field; destroy that target.', expectedKind: 'destroy' },
  { catalogId: 8, description: 'Destroy all Spells and Traps your opponent controls.', expectedKind: 'destroy' },
  { catalogId: 9, description: 'Target 1 monster in your GY; Special Summon it.', expectedKind: 'revive' },
  { catalogId: 10, description: 'Target 1 monster in your GY; add that target to your hand.', expectedKind: 'recover' },
  { catalogId: 11, description: 'Target 1 monster in your Deck; add it to your hand.', expectedKind: 'search' },
  { catalogId: 12, description: 'You can discard this card; negate that effect.', expectedKind: 'negate' },
  { catalogId: 13, description: 'Send the top 3 cards of your Deck to the GY.', expectedKind: 'mill' },
  { catalogId: 14, description: 'Target 1 card on the field; return it to the hand.', expectedKind: 'bounce' },
  { catalogId: 15, description: 'Target 1 face-up monster on the field; change that target to face-down Defense Position.', expectedKind: 'position' },
  { catalogId: 16, description: 'Special Summon 1 monster from your Deck.', expectedKind: 'summonDeck' },
  { catalogId: 17, description: 'All Dragon monsters you control gain 300 ATK.', expectedKind: 'fieldAura' },
  { catalogId: 18, description: 'Target 1 monster your opponent controls; it loses 500 ATK.', expectedKind: 'weaken' },
  { catalogId: 19, description: 'Once per turn, you can shuffle your hand.', expectedKind: null },
  { catalogId: 20, description: 'You can discard 1 card; look at your opponent\'s Extra Deck.', expectedKind: null },
]

export function goldFidelityCases(): readonly FidelityCase[] {
  return GOLD_FIDELITY
}

export function cardFidelityMatch(
  parsed: { effect: DuelEffect } | null,
  expectedKind: DuelEffect['kind'] | null,
): boolean {
  if (expectedKind === null) return parsed === null
  return parsed?.effect.kind === expectedKind
}

export function deckFidelityScore(
  deck: DuelCard[],
  resolver: (card: DuelCard) => { effect: DuelEffect } | null,
): number {
  const main = deck.filter((card) => !card.extraDeck)
  if (!main.length) return 1
  let hits = 0
  for (const card of main) {
    const parsed = resolver(card)
    if (!parsed) continue
    if (/normal monster/i.test(card.type)) continue
    hits += 1
  }
  const effectMonsters = main.filter((card) => !/normal monster/i.test(card.type)).length
  if (!effectMonsters) return 1
  return hits / effectMonsters
}
