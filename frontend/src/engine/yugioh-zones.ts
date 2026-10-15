import type { DuelCard, DuelSide, DuelState } from './yugioh-duel.ts'

export const MAIN_MONSTER_ZONE_COUNT = 5
export const SHARED_EXTRA_MONSTER_ZONE_COUNT = 2

/** Pfeilindex wie bei YGOPRODeck: oben im Uhrzeigersinn, aus Sicht des Besitzers. */
export const LINK_ARROW = {
  top: 0,
  topRight: 1,
  right: 2,
  bottomRight: 3,
  bottom: 4,
  bottomLeft: 5,
  left: 6,
  topLeft: 7,
} as const

const MARKER_TO_ARROW: Record<string, number> = {
  Top: LINK_ARROW.top,
  'Top-Right': LINK_ARROW.topRight,
  Right: LINK_ARROW.right,
  'Bottom-Right': LINK_ARROW.bottomRight,
  Bottom: LINK_ARROW.bottom,
  'Bottom-Left': LINK_ARROW.bottomLeft,
  Left: LINK_ARROW.left,
  'Top-Left': LINK_ARROW.topLeft,
}

export type ZoneSlot = { zoneKind: 'mmz' | 'emz'; zoneIndex: number }

/** Eine Link-Karte vergrößert die fünf Hauptzonen nicht. Extra-Deck-Monster nutzen die zwei EMZ. */
export function linkExtraZones(monsters: DuelCard[]): number {
  return Math.min(SHARED_EXTRA_MONSTER_ZONE_COUNT, monsters.filter((monster) => monster.zoneKind === 'emz').length)
}

export function monsterZoneCapacity(monsters: DuelCard[]): number {
  return MAIN_MONSTER_ZONE_COUNT + linkExtraZones(monsters)
}

export function arrowsFromMarkers(markers: readonly string[]): number[] {
  const arrows: number[] = []
  for (const marker of markers) {
    const arrow = MARKER_TO_ARROW[marker]
    if (arrow != null && !arrows.includes(arrow)) arrows.push(arrow)
  }
  return arrows
}

/** Fehlende Marker: die Pfeile zeigen nach unten bzw. zu den Nachbarn, nie in eine sechste Hauptzone. */
export function defaultLinkArrows(rating: number): number[] {
  const table: Record<number, number[]> = {
    1: [LINK_ARROW.bottom],
    2: [LINK_ARROW.bottomRight, LINK_ARROW.bottomLeft],
    3: [LINK_ARROW.bottomRight, LINK_ARROW.bottom, LINK_ARROW.bottomLeft],
    4: [LINK_ARROW.right, LINK_ARROW.bottomRight, LINK_ARROW.bottom, LINK_ARROW.bottomLeft],
    5: [LINK_ARROW.topRight, LINK_ARROW.right, LINK_ARROW.bottomRight, LINK_ARROW.bottom, LINK_ARROW.bottomLeft],
    6: [LINK_ARROW.topRight, LINK_ARROW.right, LINK_ARROW.bottomRight, LINK_ARROW.bottom, LINK_ARROW.bottomLeft, LINK_ARROW.left],
    7: [LINK_ARROW.top, LINK_ARROW.topRight, LINK_ARROW.right, LINK_ARROW.bottomRight, LINK_ARROW.bottom, LINK_ARROW.bottomLeft, LINK_ARROW.left],
    8: [0, 1, 2, 3, 4, 5, 6, 7],
  }
  const clamped = Math.max(1, Math.min(8, rating || 2))
  return [...table[clamped]]
}

export function registerLinkArrows(card: DuelCard): number[] {
  if (card.extraKind !== 'link') return []
  if (card.linkArrows?.length) return [...card.linkArrows]
  return defaultLinkArrows(card.linkRating || card.level || 2)
}

export function occupiedMainColumns(monsters: DuelCard[]): Set<number> {
  const used = new Set<number>()
  let fallback = 0
  for (const monster of monsters) {
    if (monster.zoneKind === 'emz') continue
    if (monster.zoneIndex != null && monster.zoneIndex >= 0 && monster.zoneIndex < MAIN_MONSTER_ZONE_COUNT) {
      used.add(monster.zoneIndex)
      continue
    }
    while (used.has(fallback) && fallback < MAIN_MONSTER_ZONE_COUNT) fallback += 1
    if (fallback < MAIN_MONSTER_ZONE_COUNT) used.add(fallback)
    fallback += 1
  }
  return used
}

export function freeMainColumn(monsters: DuelCard[]): number | null {
  const used = occupiedMainColumns(monsters)
  for (let column = 0; column < MAIN_MONSTER_ZONE_COUNT; column += 1) {
    if (!used.has(column)) return column
  }
  return null
}

function occupiedExtraIndexes(monsters: DuelCard[]): Set<number> {
  const used = new Set<number>()
  let fallback = 0
  for (const monster of monsters) {
    if (monster.zoneKind !== 'emz') continue
    const index = monster.zoneIndex != null && monster.zoneIndex >= 0 && monster.zoneIndex < SHARED_EXTRA_MONSTER_ZONE_COUNT
      ? monster.zoneIndex
      : fallback
    used.add(Math.min(SHARED_EXTRA_MONSTER_ZONE_COUNT - 1, index))
    fallback += 1
  }
  return used
}

function pushZone(zones: ZoneSlot[], zoneKind: 'mmz' | 'emz', zoneIndex: number): void {
  if (zoneKind === 'mmz' && zoneIndex >= 0 && zoneIndex < MAIN_MONSTER_ZONE_COUNT) zones.push({ zoneKind, zoneIndex })
  if (zoneKind === 'emz' && zoneIndex >= 0 && zoneIndex < SHARED_EXTRA_MONSTER_ZONE_COUNT) zones.push({ zoneKind, zoneIndex })
}

/**
 * Eigene Zonen, auf die die Pfeile zeigen.
 * Unten aus der linken EMZ (Mitte Spalte 1) trifft die Hauptspalten 0–2, aus der rechten EMZ (Mitte Spalte 3) die Spalten 2–4.
 * Links/rechts in der Hauptzone treffen den Nachbarn. Oben trifft die EMZ, unten aus der Hauptzone zeigt zum Spieler.
 */
export function linkedOwnZones(card: DuelCard): ZoneSlot[] {
  if (card.extraKind !== 'link' && !card.linkArrows?.length) return []
  const arrows = new Set(card.linkArrows?.length ? card.linkArrows : registerLinkArrows(card))
  const zones: ZoneSlot[] = []
  if (card.zoneKind === 'emz') {
    const center = (card.zoneIndex ?? 0) === 1 ? 3 : 1
    if (arrows.has(LINK_ARROW.bottomLeft)) pushZone(zones, 'mmz', center - 1)
    if (arrows.has(LINK_ARROW.bottom)) pushZone(zones, 'mmz', center)
    if (arrows.has(LINK_ARROW.bottomRight)) pushZone(zones, 'mmz', center + 1)
    return zones
  }
  const column = card.zoneIndex ?? 0
  if (arrows.has(LINK_ARROW.left)) pushZone(zones, 'mmz', column - 1)
  if (arrows.has(LINK_ARROW.right)) pushZone(zones, 'mmz', column + 1)
  if (arrows.has(LINK_ARROW.top)) {
    if (column === 1) pushZone(zones, 'emz', 0)
    else if (column === 3) pushZone(zones, 'emz', 1)
  }
  if (arrows.has(LINK_ARROW.topLeft)) {
    if (column === 2) pushZone(zones, 'emz', 0)
    else if (column === 4) pushZone(zones, 'emz', 1)
  }
  if (arrows.has(LINK_ARROW.topRight)) {
    if (column === 0) pushZone(zones, 'emz', 0)
    else if (column === 2) pushZone(zones, 'emz', 1)
  }
  return zones
}

/** Monster in einer Zone, auf die diese Karte zeigt, inklusive gegnerischer Monster am oberen Pfeil. */
export function pointedMonsters(card: DuelCard, own: DuelCard[], opponent: DuelCard[] = []): DuelCard[] {
  const targets = linkedOwnZones(card)
  const arrows = new Set(card.linkArrows?.length ? card.linkArrows : (card.extraKind === 'link' ? registerLinkArrows(card) : []))
  const hits: DuelCard[] = []
  for (const monster of own) {
    if (monster.id === card.id || monster.zoneIndex == null) continue
    const kind = monster.zoneKind === 'emz' ? 'emz' : 'mmz'
    if (targets.some((zone) => zone.zoneKind === kind && zone.zoneIndex === monster.zoneIndex)) hits.push(monster)
  }
  if (card.zoneKind === 'emz' && arrows.has(LINK_ARROW.top)) {
    const foe = opponent.find((monster) => monster.zoneKind === 'emz' && monster.zoneIndex === (card.zoneIndex ?? 0))
    if (foe) hits.push(foe)
  } else if (card.zoneKind !== 'emz' && card.zoneIndex != null && arrows.has(LINK_ARROW.top) && card.zoneIndex !== 1 && card.zoneIndex !== 3) {
    const foe = opponent.find((monster) => monster.zoneKind !== 'emz' && monster.zoneIndex === card.zoneIndex)
    if (foe) hits.push(foe)
  }
  return hits
}

/** Freie Extra-Monsterzone zuerst, sonst die niedrigste freie Hauptspalte, auf die ein verbleibender Link zeigt. */
export function extraSummonZone(monsters: DuelCard[], removeIds: readonly number[] = []): ZoneSlot | null {
  const remaining = removeIds.length ? monsters.filter((monster) => !removeIds.includes(monster.id)) : monsters
  const emz = occupiedExtraIndexes(remaining)
  if (emz.size < SHARED_EXTRA_MONSTER_ZONE_COUNT) {
    return { zoneKind: 'emz', zoneIndex: emz.has(0) ? 1 : 0 }
  }
  const used = occupiedMainColumns(remaining)
  const pointed = new Set<number>()
  for (const monster of remaining) {
    if (monster.extraKind !== 'link') continue
    for (const zone of linkedOwnZones(monster)) {
      if (zone.zoneKind === 'mmz') pointed.add(zone.zoneIndex)
    }
  }
  for (let column = 0; column < MAIN_MONSTER_ZONE_COUNT; column += 1) {
    if (!used.has(column) && pointed.has(column)) return { zoneKind: 'mmz', zoneIndex: column }
  }
  return null
}

export function hasFreeMonsterZone(monsters: DuelCard[], afterRemoving = 0): boolean {
  const main = monsters.filter((monster) => monster.zoneKind !== 'emz').length
  return main - afterRemoving < MAIN_MONSTER_ZONE_COUNT
}

export function hasFreeExtraZone(monsters: DuelCard[], afterRemoving = 0): boolean {
  if (afterRemoving <= 0) return extraSummonZone(monsters) != null
  const preferred = monsters.filter((monster) => monster.extraKind !== 'link').slice(0, afterRemoving)
  const drop = new Set(preferred.map((monster) => monster.id))
  for (const monster of monsters) {
    if (drop.size >= afterRemoving) break
    drop.add(monster.id)
  }
  return extraSummonZone(monsters, [...drop]) != null
}

/** TCG: the player who goes first cannot conduct battle on turn 1. */
export function isFirstTurnBattleBlocked(state: DuelState): boolean {
  // Jarvis' Sicht addiert 0,5 auf die Zugnummer, damit turnKey() gleich bleibt.
  if (Math.floor(state.turn) !== 1) return false
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
  if (card.kind === 'trap' && /counter/i.test(card.subtype || card.type || '')) return 3
  if (card.effect?.kind === 'negate' || card.effect?.kind === 'negateAttack') return 2
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
