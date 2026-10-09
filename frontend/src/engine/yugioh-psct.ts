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
