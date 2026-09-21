import { PROBE_COPY_GROUPS, STORYLINE_GROUPS, TEST_COPY_GROUPS, type TestCopyGroup } from './test-copy.ts'

export const PROBE_LANE_IDS = ['heute', 'gespraech', 'alltag', 'geraet', 'lage', 'probe', 'story', 'lauf'] as const
export type ProbeLaneId = (typeof PROBE_LANE_IDS)[number]

export type ProbeLane = {
  id: ProbeLaneId
  label: string
  hint: string
}

/** Kurze Sprünge statt einer endlosen Liste. Reihenfolge = Alltag des Testers. */
export const PROBE_LANES: ProbeLane[] = [
  { id: 'heute', label: 'Heute', hint: '18.7 und die kurze Fläche' },
  { id: 'gespraech', label: 'Gespräch', hint: 'Smalltalk, Memory, Recall' },
  { id: 'alltag', label: 'Alltag', hint: 'Einkauf, Timer, Kalender, Fahrt' },
  { id: 'geraet', label: 'Gerät', hint: 'PC, TV, Haus, Foto' },
  { id: 'lage', label: 'Lage', hint: 'Kugel, Körper, Welt' },
  { id: 'probe', label: 'Probe', hint: 'Memory-10 bis V9' },
  { id: 'story', label: 'Story', hint: 'Gespräche der Reihe nach' },
  { id: 'lauf', label: 'Lauf', hint: 'Automatischer Debug-Lauf' },
]

const LANE_TITLES: Record<Exclude<ProbeLaneId, 'lauf' | 'story' | 'probe'>, string[]> = {
  heute: ['18.7 Fläche', 'Körper-13', 'Flächen-12'],
  gespraech: [
    'Smalltalk',
    'Gedächtnis',
    'Memory-10',
    'V5 Gedächtnis',
    'Recall 7.31',
    'Naive Fragen',
    'Gesicht & Hausstand',
  ],
  alltag: [
    'Einkauf',
    'Tag & Hilfe',
    'Timer Wecker Erinnerung',
    'Kalender & Losgehen',
    'Fahren & Spotify',
    'Leute Anruf SMS',
    'Tanke POI Bahn',
    'Alltagskette',
    'Alltag 8.34 Erstnutzer',
    'Alltag 8.34 geübt',
    'Alltag 8.34 kaputt',
    'Alltag 8.12 Fahrt',
    'Alltag 8.36 Settings',
    'Alltag 8.61 Rest',
    'Alltag Gold 8.90',
    'Randfälle (kommen so kaum vor)',
    'Kaputt 6.50',
  ],
  geraet: [
    'Uhr & Gerät',
    'V2 Voice & App',
    'V3 Verified Actions',
    'V4 Dokumente',
    'V6 TV Launch',
    'V7 PC',
    'V8 Live',
    'V9 Hardening',
    'Fernseher & Film',
    'Haus',
    'PC Foto Notiz',
    'Fachwissen-11',
  ],
  lage: [
    'Ort',
    'Wetter',
    'Weltlage',
    'Welt & Lage',
    'Globus-Briefing',
    'Bühne & Hirn',
    'Research Nachrichten Feiertag',
    'Stabilität Screenshots',
    'Screenshot-Bugs',
    '18.0.3 Screenshot + Audit',
  ],
}

function groupsNamed(titles: string[], pool: TestCopyGroup[]): TestCopyGroup[] {
  const out: TestCopyGroup[] = []
  for (const title of titles) {
    const hit = pool.find((g) => g.title === title)
    if (hit) out.push(hit)
  }
  return out
}

export function displayGroupTitle(title: string): string {
  return title.replace(/^[🟢🟡🔴🟣]\s+/u, '').replace(/\s+\(.*\)$/u, '')
}

export function groupsForLane(lane: ProbeLaneId): TestCopyGroup[] {
  if (lane === 'lauf') return []
  if (lane === 'story') return STORYLINE_GROUPS
  if (lane === 'probe') return PROBE_COPY_GROUPS
  return groupsNamed(LANE_TITLES[lane], TEST_COPY_GROUPS)
}

export function searchProbeGroups(query: string, lane: ProbeLaneId | 'all' = 'all'): TestCopyGroup[] {
  const q = query.trim().toLowerCase()
  const pool =
    lane === 'all'
      ? [...TEST_COPY_GROUPS, ...STORYLINE_GROUPS]
      : groupsForLane(lane)
  if (!q) return pool
  return pool
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.text.toLowerCase().includes(q) ||
          g.title.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.items.length > 0)
}

/** Jede Katalog-Gruppe muss in mindestens einer Spur stehen — sonst verschwindet sie. */
export function unassignedCopyTitles(): string[] {
  const assigned = new Set<string>()
  for (const id of PROBE_LANE_IDS) {
    if (id === 'lauf') continue
    for (const g of groupsForLane(id)) assigned.add(g.title)
  }
  return TEST_COPY_GROUPS.map((g) => g.title).filter((t) => !assigned.has(t))
}
