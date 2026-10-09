import type { DuelCard, DuelSide, DuelState } from './yugioh-duel.ts'

export const MAIN_MONSTER_ZONE_COUNT = 5
export const SHARED_EXTRA_MONSTER_ZONE_COUNT = 2

/** Link monsters open extra Main Monster Zones (TCG subset, capped at 2 EMZ). */
export function linkExtraZones(monsters: DuelCard[]): number {
  let extra = 0
  for (const monster of monsters) {
    if (monster.extraKind === 'link') {
      extra += Math.max(0, (monster.linkRating || monster.level || 2) - 1)
    }
  }
  return Math.min(SHARED_EXTRA_MONSTER_ZONE_COUNT, extra)
}

export function monsterZoneCapacity(monsters: DuelCard[]): number {
  return MAIN_MONSTER_ZONE_COUNT + linkExtraZones(monsters)
}

export function hasFreeMonsterZone(monsters: DuelCard[], afterRemoving = 0): boolean {
  return monsters.length - afterRemoving < monsterZoneCapacity(monsters)
}

export function registerLinkArrows(card: DuelCard): number[] {
  if (card.extraKind !== 'link') return []
  const rating = card.linkRating || card.level || 2
  const arrows: number[] = []
  for (let i = 0; i < Math.min(8, rating + 1); i += 1) arrows.push(i)
  return arrows
}

/** TCG: the player who goes first cannot conduct battle on turn 1. */
export function isFirstTurnBattleBlocked(state: DuelState): boolean {
  if (state.turn !== 1) return false
  const owner = state.turnOwner ?? 'player'
  const first = state.firstPlayer ?? 'player'
  return owner === first
}

export function battleActionsAllowed(state: DuelState): boolean {
  if (state.winner) return false
  if (state.phase !== 'battle') return false
  return !isFirstTurnBattleBlocked(state)
}

export function spellSpeedForCard(card: DuelCard): 1 | 2 | 3 {
  if (card.effect?.kind === 'negate' || card.effect?.kind === 'negateAttack') return 2
  if (card.kind === 'trap' && /counter/i.test(card.subtype || card.type || '')) return 3
  if (card.kind === 'trap') return 2
  if (card.kind === 'spell' && /quick-play/i.test(card.subtype || card.type || '')) return 2
  return 1
}

export function canChainSpellSpeed(chainSpeed: 1 | 2 | 3, cardSpeed: 1 | 2 | 3): boolean {
  if (chainSpeed === 1) return cardSpeed >= 2
  return cardSpeed >= chainSpeed
}

export function topChainSpellSpeed(state: DuelState): 1 | 2 | 3 {
  const top = state.chain[state.chain.length - 1]
  return top ? spellSpeedForCard(top.card) : 1
}

export function sideMonsters(state: DuelState, side: DuelSide): DuelCard[] {
  return side === 'player' ? state.player.monsters : state.jarvis.monsters
}
