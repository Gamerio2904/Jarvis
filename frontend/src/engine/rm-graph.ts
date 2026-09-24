import snapJson from '../data/rm-snapshot.json' with { type: 'json' }
import { RM_CORE_IDS, RM_NAMED_EDGES, RM_SKILLS, RM_SOURCES } from './rm-dossier.ts'
import type {
  RmCharacter,
  RmDot,
  RmDossier,
  RmEdge,
  RmEpisode,
  RmEvidence,
  RmGraph,
  RmNeighbor,
  RmSnapshot,
  RmTrait,
} from './rm-types.ts'

const snap = snapJson as RmSnapshot

/** Familie innen, dann Regulars, Einmal-Auftritte ganz außen. */
export function appearanceBand(eps: number): number {
  if (eps >= 8) return 0
  if (eps >= 5) return 1
  if (eps >= 3) return 2
  if (eps === 2) return 3
  return 4
}

const STATUS_DE: Record<string, string> = {
  Alive: 'lebend',
  Dead: 'tot',
  unknown: 'unbekannt',
}

const GENDER_DE: Record<string, string> = {
  Male: 'männlich',
  Female: 'weiblich',
  Genderless: 'geschlechtslos',
  unknown: 'unbekannt',
}

export const RM_COAPPEAR_MIN = 3

export function loadRmSnapshot(): RmSnapshot {
  return snap
}

export function parseEpisodeCode(code: string): { season: number; episode: number } | null {
  const m = /^S(\d+)E(\d+)$/i.exec((code || '').trim())
  if (!m) return null
  return { season: Number(m[1]), episode: Number(m[2]) }
}

export function staffelFolge(code: string): string {
  const p = parseEpisodeCode(code)
  if (!p) return code
  return `Staffel ${p.season} Folge ${p.episode}`
}

export function episodeByCode(code: string): RmEpisode | undefined {
  const key = code.toUpperCase()
  return snap.episodes.find((e) => e.code.toUpperCase() === key)
}

export function episodeById(id: number): RmEpisode | undefined {
  return snap.episodes.find((e) => e.id === id)
}

export function characterById(id: number): RmCharacter | undefined {
  return snap.characters.find((c) => c.id === id)
}

export function rmAvatar(id: number): string {
  return `https://rickandmortyapi.com/api/character/avatar/${id}.jpeg`
}

export function evidence(code: string, note: string): RmEvidence | null {
  const ep = episodeByCode(code)
  const p = parseEpisodeCode(code)
  if (!ep || !p) return null
  return { season: p.season, episode: p.episode, code: ep.code, title: ep.name, note }
}

export function searchCharacters(query: string): RmCharacter[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return snap.characters
    .filter((c) => c.name.toLowerCase().includes(q) || String(c.id) === q)
    .sort((a, b) => b.eps.length - a.eps.length || a.id - b.id)
    .slice(0, 24)
}

export function searchHitLabel(c: RmCharacter, hits: RmCharacter[]): string {
  const clash = hits.some((o) => o.id !== c.id && o.name === c.name)
  if (!clash) return c.name
  const extra = c.origin && c.origin !== 'unknown' ? c.origin : c.type || `#${c.id}`
  return `${c.name} · ${extra}`
}

const FAMILY_R = 0.11
const RING_INNER = 0.205
const RING_OUTER = 0.96
const RING_CHUNK = 96

export function layoutRmDots(chars: RmCharacter[] = snap.characters): RmDot[] {
  const dots: RmDot[] = []
  const coreSet = new Set<number>(RM_CORE_IDS)
  const core = RM_CORE_IDS.filter((id) => chars.some((c) => c.id === id))
  core.forEach((id, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(1, core.length)
    dots.push({ id, x: Math.cos(ang) * FAMILY_R, y: Math.sin(ang) * FAMILY_R, r: 0.056 })
  })
  const rest = chars.filter((c) => !coreSet.has(c.id))
  const bands = new Map<number, RmCharacter[]>()
  for (const c of rest) {
    const band = appearanceBand(c.eps.length)
    const list = bands.get(band) || []
    list.push(c)
    bands.set(band, list)
  }
  const rings: RmCharacter[][] = []
  for (const band of [...bands.keys()].sort((a, b) => a - b)) {
    const list = (bands.get(band) || []).sort((a, b) => b.eps.length - a.eps.length || a.id - b.id)
    for (let i = 0; i < list.length; i += RING_CHUNK) rings.push(list.slice(i, i + RING_CHUNK))
  }
  const span = Math.max(1, rings.length - 1)
  rings.forEach((list, ring) => {
    const radius = rings.length === 1 ? RING_INNER : RING_INNER + ((RING_OUTER - RING_INNER) * ring) / span
    list.forEach((c, i) => {
      const wobble = ((c.id * 17) % 100) / 1800
      const ang = (i / Math.max(1, list.length)) * Math.PI * 2 + ring * 0.07
      const rr = radius + wobble
      dots.push({
        id: c.id,
        x: Math.cos(ang) * rr,
        y: Math.sin(ang) * rr,
        r: 0.018 + Math.min(0.028, Math.log2(1 + c.eps.length) * 0.006),
      })
    })
  })
  return dots
}

function pairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

export function curatedEdges(): RmEdge[] {
  const out: RmEdge[] = []
  const seen = new Set<string>()
  for (const e of RM_NAMED_EDGES) {
    if (!characterById(e.a) || !characterById(e.b) || e.a === e.b) continue
    const key = pairKey(e.a, e.b)
    if (seen.has(key)) continue
    seen.add(key)
    const evs = e.codes.map((code) => evidence(code, e.label)).filter((x): x is RmEvidence => Boolean(x))
    const shared = sharedCount(e.a, e.b)
    out.push({ from: e.a, to: e.b, kind: e.kind, label: e.label, shared, evidence: evs })
  }
  return out
}

export function sharedCount(a: number, b: number): number {
  const left = new Set(characterById(a)?.eps || [])
  let n = 0
  for (const id of characterById(b)?.eps || []) if (left.has(id)) n += 1
  return n
}

export function coappearEdges(minShared = RM_COAPPEAR_MIN): RmEdge[] {
  const byEp = new Map<number, number[]>()
  for (const c of snap.characters) {
    for (const ep of c.eps) {
      const list = byEp.get(ep) || []
      list.push(c.id)
      byEp.set(ep, list)
    }
  }
  const counts = new Map<string, { a: number; b: number; n: number }>()
  for (const ids of byEp.values()) {
    const uniq = [...new Set(ids)].sort((x, y) => x - y)
    for (let i = 0; i < uniq.length; i++) {
      for (let j = i + 1; j < uniq.length; j++) {
        const a = uniq[i]
        const b = uniq[j]
        const key = pairKey(a, b)
        const prev = counts.get(key)
        if (prev) prev.n += 1
        else counts.set(key, { a, b, n: 1 })
      }
    }
  }
  const named = new Set(curatedEdges().map((e) => pairKey(e.from, e.to)))
  const out: RmEdge[] = []
  for (const row of counts.values()) {
    if (row.n < minShared) continue
    if (named.has(pairKey(row.a, row.b))) continue
    out.push({
      from: row.a,
      to: row.b,
      kind: 'coappear',
      label: `${row.n} gemeinsame Folgen`,
      shared: row.n,
      evidence: [],
    })
  }
  return out
}

export function neighborsOf(id: number): RmNeighbor[] {
  const named = curatedEdges().filter((e) => e.from === id || e.to === id)
  const seen = new Set<number>()
  const out: RmNeighbor[] = []
  for (const e of named) {
    const other = e.from === id ? e.to : e.from
    if (seen.has(other)) continue
    seen.add(other)
    const who = characterById(other)
    if (!who) continue
    out.push({ id: other, name: who.name, kind: e.kind, label: e.label, shared: e.shared })
  }
  for (const c of snap.characters) {
    if (c.id === id || seen.has(c.id)) continue
    const n = sharedCount(id, c.id)
    if (n <= 0) continue
    seen.add(c.id)
    out.push({
      id: c.id,
      name: c.name,
      kind: 'coappear',
      label: n === 1 ? '1 gemeinsame Folge' : `${n} gemeinsame Folgen`,
      shared: n,
    })
  }
  return out.sort((a, b) => {
    const ak = a.kind === 'coappear' ? 1 : 0
    const bk = b.kind === 'coappear' ? 1 : 0
    if (ak !== bk) return ak - bk
    return b.shared - a.shared || a.id - b.id
  })
}

function traitsFor(c: RmCharacter): RmTrait[] {
  const rows: RmTrait[] = [
    { label: 'Rasse', value: c.species, source: 'api' },
    { label: 'Status', value: STATUS_DE[c.status] || c.status, source: 'api' },
    { label: 'Geschlecht', value: GENDER_DE[c.gender] || c.gender, source: 'api' },
    { label: 'Herkunft', value: c.origin || 'unbekannt', source: 'api' },
    { label: 'Zuletzt gesehen', value: c.location || 'unbekannt', source: 'api' },
  ]
  if (c.type) rows.splice(1, 0, { label: 'Typ', value: c.type, source: 'api' })
  return rows
}

export function dossierFor(id: number): RmDossier | null {
  const c = characterById(id)
  if (!c) return null
  const skills = (RM_SKILLS[id] || [])
    .map((s) => {
      const ev = evidence(s.code, s.note)
      return ev ? { name: s.name, evidence: ev } : null
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
  const appearances = c.eps
    .map((epId) => {
      const ep = episodeById(epId)
      if (!ep) return null
      const p = parseEpisodeCode(ep.code)
      if (!p) return null
      return { season: p.season, episode: p.episode, code: ep.code, title: ep.name, note: 'Auftritt laut API' }
    })
    .filter((x): x is RmEvidence => Boolean(x))
  return {
    id: c.id,
    name: c.name,
    image: rmAvatar(c.id),
    traits: traitsFor(c),
    skills,
    appearances,
    appearanceCount: appearances.length,
    neighbors: neighborsOf(c.id),
    sources: RM_SOURCES,
    coverage: snap.meta.coverage,
  }
}

export function buildRmGraph(): RmGraph {
  const characters = snap.characters
  return {
    characters,
    episodes: snap.episodes,
    dots: layoutRmDots(characters),
    curated: curatedEdges(),
    empty: characters.length === 0,
  }
}

export function rmCoverageLine(): string {
  const n = snap.characters.length
  const e = snap.episodes.length
  return `${n} Charaktere, ${e} Folgen ${snap.meta.coverage}. Quelle: Rick-and-Morty-API. Fähigkeiten nur mit Staffel/Folge. Staffel 6+ fehlt in der offenen API.`
}
