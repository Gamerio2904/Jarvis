/** Kanon-Graph Rick and Morty. Knoten = API-Charakter, keine erfundenen IDs. */

export type RmEpisode = {
  id: number
  code: string
  name: string
  air: string
}

export type RmCharacter = {
  id: number
  name: string
  status: string
  species: string
  type: string
  gender: string
  origin: string
  location: string
  eps: number[]
}

export type RmSnapshot = {
  meta: {
    source: string
    docs: string
    project: string
    license: string
    canon: string
    coverage: string
    fetched_at: string
  }
  episodes: RmEpisode[]
  characters: RmCharacter[]
}

export type RmEvidence = {
  season: number
  episode: number
  code: string
  title: string
  note: string
}

export type RmSkill = {
  name: string
  evidence: RmEvidence
}

export type RmTrait = {
  label: string
  value: string
  source: 'api' | 'curated'
}

export type RmEdgeKind = 'family' | 'ally' | 'enemy' | 'partner' | 'coappear'

export type RmEdge = {
  from: number
  to: number
  kind: RmEdgeKind
  label: string
  shared: number
  evidence: RmEvidence[]
}

export type RmDot = {
  id: number
  x: number
  y: number
  r: number
}

export type RmNeighbor = {
  id: number
  name: string
  kind: RmEdgeKind
  label: string
  shared: number
}

export type RmDossier = {
  id: number
  name: string
  image: string
  traits: RmTrait[]
  skills: RmSkill[]
  appearances: RmEvidence[]
  appearanceCount: number
  neighbors: RmNeighbor[]
  sources: string[]
  coverage: string
}

export type RmGraph = {
  characters: RmCharacter[]
  episodes: RmEpisode[]
  dots: RmDot[]
  curated: RmEdge[]
  empty: boolean
}
