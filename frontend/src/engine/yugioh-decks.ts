import type { DuelCard, DuelEffect, ExtraDeckKind } from './yugioh-duel.ts'

export type DeckArchetype = 'aggro' | 'control' | 'combo' | 'burn' | 'balanced'

// "burn" is never used for training; it only appears in evaluation as an unseen archetype.
export const TRAINING_ARCHETYPES: readonly DeckArchetype[] = ['aggro', 'control', 'combo', 'balanced']
export const EVALUATION_ARCHETYPES: readonly DeckArchetype[] = [...TRAINING_ARCHETYPES, 'burn']

export type GeneratedDeck = { main: DuelCard[]; extra: DuelCard[] }

type Profile = {
  monsters: number
  atkScale: number
  defScale: number
  effectMonsterRate: number
  tuners: number
  spells: Partial<Record<DuelEffect['kind'], number>>
  extra: ExtraDeckKind[]
}

const PROFILES: Record<Exclude<DeckArchetype, 'balanced'>, Profile> = {
  aggro: {
    monsters: 26, atkScale: 1.2, defScale: 0.8, effectMonsterRate: 0.15, tuners: 2,
    spells: { draw: 4, destroy: 5, damage: 3, heal: 2 }, extra: ['xyz', 'fusion', 'link'],
  },
  control: {
    monsters: 18, atkScale: 0.85, defScale: 1.3, effectMonsterRate: 0.3, tuners: 2,
    spells: { negate: 8, destroy: 5, heal: 4, draw: 5 }, extra: ['xyz', 'synchro', 'link'],
  },
  combo: {
    monsters: 22, atkScale: 1, defScale: 1, effectMonsterRate: 0.5, tuners: 6,
    spells: { draw: 7, destroy: 3, damage: 3, negate: 2, heal: 3 }, extra: ['synchro', 'synchro', 'xyz', 'fusion', 'link', 'link'],
  },
  burn: {
    monsters: 16, atkScale: 0.9, defScale: 1, effectMonsterRate: 0.35, tuners: 1,
    spells: { damage: 14, draw: 4, heal: 4, destroy: 2 }, extra: ['link', 'xyz'],
  },
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]
}

function range(random: () => number, min: number, max: number, step = 100): number {
  return min + Math.floor(random() * ((max - min) / step + 1)) * step
}

function monsterEffect(random: () => number): DuelEffect {
  const roll = random()
  if (roll < 0.3) return { kind: 'draw', amount: 1 }
  if (roll < 0.6) return { kind: 'damage', amount: range(random, 300, 800) }
  if (roll < 0.8) return { kind: 'heal', amount: range(random, 400, 1000) }
  return { kind: 'destroy', target: 'monster' }
}

function spellEffect(kind: DuelEffect['kind'], random: () => number): DuelEffect {
  if (kind === 'draw') return { kind, amount: random() < 0.7 ? 1 : 2 }
  if (kind === 'damage') return { kind, amount: range(random, 500, 1500) }
  if (kind === 'heal') return { kind, amount: range(random, 500, 1500) }
  if (kind === 'destroy') return { kind, target: 'monster' }
  return { kind: 'negate' }
}

function effectSummary(effect: DuelEffect): string {
  if (effect.kind === 'draw') return `Zieht ${effect.amount} Karte(n).`
  if (effect.kind === 'damage') return `Fügt dem Gegner ${effect.amount} Schaden zu.`
  if (effect.kind === 'heal') return `Stellt ${effect.amount} LP wieder her.`
  if (effect.kind === 'destroy') return 'Zerstört ein gegnerisches Monster.'
  return 'Negiert das vorherige Kettenglied (vereinfachte Regel).'
}

function extraCard(id: number, kind: ExtraDeckKind, random: () => number): DuelCard {
  const level = kind === 'xyz' ? 4 : kind === 'link' ? 2 : kind === 'synchro' ? range(random, 5, 7, 1) : range(random, 6, 8, 1)
  const atk = kind === 'link' ? range(random, 1800, 2400) : range(random, 2300, 3200)
  return {
    id,
    catalogId: id,
    name: `Extra ${kind} ${id}`,
    type: `${kind[0].toUpperCase()}${kind.slice(1)} Monster`,
    kind: 'monster',
    atk,
    def: kind === 'link' ? 0 : range(random, 1500, 2500),
    level,
    extraDeck: true,
    extraKind: kind,
    linkRating: kind === 'link' ? 2 : undefined,
  }
}

function buildProfile(archetype: DeckArchetype, random: () => number): Profile {
  if (archetype !== 'balanced') return PROFILES[archetype]
  const parts = (['aggro', 'control', 'combo', 'burn'] as const).map((name) => PROFILES[name])
  const monsters = range(random, 18, 26, 1)
  const spells: Profile['spells'] = {}
  for (const kind of ['draw', 'damage', 'heal', 'destroy', 'negate'] as const) {
    spells[kind] = Math.round(parts.reduce((sum, part) => sum + (part.spells[kind] || 0), 0) / parts.length)
  }
  return {
    monsters,
    atkScale: 1,
    defScale: 1,
    effectMonsterRate: 0.3,
    tuners: 3,
    spells,
    extra: [pick(random, ['xyz', 'synchro', 'fusion', 'link']), pick(random, ['xyz', 'synchro', 'fusion', 'link']), 'link'],
  }
}

export function generateDeck(archetype: DeckArchetype, random: () => number): GeneratedDeck {
  const profile = buildProfile(archetype, random)
  const main: DuelCard[] = []
  let id = 1
  for (let index = 0; index < profile.monsters; index += 1) {
    const tuner = index < profile.tuners
    const level = tuner ? range(random, 1, 3, 1) : pick(random, [3, 4, 4, 4, 4, 4, 5, 6, 7])
    const atk = Math.round(((900 + level * 330 + random() * 500) * profile.atkScale) / 100) * 100
    const def = Math.round(((900 + random() * 1400) * profile.defScale) / 100) * 100
    const effect = !tuner && random() < profile.effectMonsterRate ? monsterEffect(random) : undefined
    main.push({
      id,
      catalogId: id,
      name: `${archetype} Monster ${id}`,
      type: effect ? 'Effect Monster' : tuner ? 'Tuner Monster' : 'Normal Monster',
      kind: 'monster',
      atk,
      def,
      level,
      tuner: tuner || undefined,
      effect,
      effectSummary: effect ? effectSummary(effect) : undefined,
    })
    id += 1
  }
  for (const [kind, count] of Object.entries(profile.spells) as [DuelEffect['kind'], number][]) {
    for (let index = 0; index < count && main.length < 40; index += 1) {
      const effect = spellEffect(kind, random)
      main.push({
        id,
        catalogId: id,
        name: `${archetype} ${kind} spell ${id}`,
        type: 'Spell Card',
        kind: 'spell',
        effect,
        effectSummary: effectSummary(effect),
      })
      id += 1
    }
  }
  while (main.length < 40) {
    const level = pick(random, [3, 4, 4, 4])
    main.push({
      id, catalogId: id, name: `${archetype} Filler ${id}`, type: 'Normal Monster', kind: 'monster',
      atk: Math.round((1000 + level * 330 + random() * 400) / 100) * 100, def: 1500, level,
    })
    id += 1
  }
  const extra = profile.extra.map((kind, index) => extraCard(1001 + index, kind, random))
  return { main: main.slice(0, 60), extra }
}
