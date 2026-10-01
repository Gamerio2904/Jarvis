/** Sechs Bausteine, drei Muster. Fest im Code, kein Netz, kein Paket. */

export type Art = 'leiste' | 'liste' | 'karte' | 'knopf' | 'feld' | 'tab'
export type Motion = 'sofort' | 'gleiten' | 'aufklappen'

export type Block = {
  art: Art
  zeile: string
  muster?: 0 | 1 | 2
}

export type Variant = {
  name: string
  blocks: Block[]
  motion?: Motion
}

export type Draft = {
  id: string
  title: string
  variants: Variant[]
  pick: 0 | 1 | 2 | null
  motion: Motion
  status: 'offen' | 'gewählt' | 'zu'
  kind: 'app' | 'muster'
  created_at: string
}

export const ARTEN: Art[] = ['leiste', 'liste', 'karte', 'knopf', 'feld', 'tab']

export const ART_NAMEN = 'Leiste, Liste, Karte, Knopf, Feld, Tab'

const LABELS: Record<Art, string> = {
  leiste: 'Leiste',
  liste: 'Liste',
  karte: 'Karten',
  knopf: 'Knopf',
  feld: 'Feld',
  tab: 'Tab',
}

export function artLabel(art: Art): string {
  return LABELS[art]
}

export function unknownArtReply(): string {
  return `Den Baustein gibt es nicht. ${ART_NAMEN}.`
}

export function artFromName(raw: string): Art | null {
  const t = raw.trim().toLowerCase().replace(/[?.!]+$/g, '').replace(/\s+/g, ' ')
  if (/^kn(?:o|ö)pf(?:e|en)?$/.test(t)) return 'knopf'
  if (/^karten?$/.test(t)) return 'karte'
  if (/^listen?$/.test(t)) return 'liste'
  if (/^leisten?$/.test(t)) return 'leiste'
  if (/^felder?$/.test(t)) return 'feld'
  if (/^tabs?$/.test(t)) return 'tab'
  return null
}

export function artFromToken(raw: string): Art | null {
  const t = raw.trim().toLowerCase()
  return (ARTEN as string[]).includes(t) ? (t as Art) : null
}

export function parseMuster(raw: string): { art: Art; index: 0 | 1 | 2 } | null {
  const m = /^(leiste|liste|karte|knopf|feld|tab):([012])$/.exec((raw || '').trim())
  if (!m) return null
  return { art: m[1] as Art, index: Number(m[2]) as 0 | 1 | 2 }
}

export function applyRemembered(variants: Variant[], raw: string): Variant[] {
  const hit = parseMuster(raw)
  return variants.map((v) => ({
    ...v,
    blocks: v.blocks.map((b) => ({
      ...b,
      muster: hit && hit.art === b.art ? hit.index : (b.muster ?? 0),
    })),
  }))
}

function block(art: Art, zeile: string, muster: 0 | 1 | 2): Block {
  return { art, zeile, muster }
}

/** Drei feste Muster. Der Arbeitstext geht dabei nicht ans Modell. */
export function musterVariants(art: Art): Variant[] {
  if (art === 'knopf') {
    return [
      { name: 'sofort', motion: 'sofort', blocks: [block(art, 'Weiter', 0)] },
      { name: 'gleiten', motion: 'gleiten', blocks: [block(art, 'Weiter', 1)] },
      { name: 'aufklappen', motion: 'aufklappen', blocks: [block(art, 'Weiter', 2)] },
    ]
  }
  if (art === 'karte') {
    return [
      { name: 'Flach', motion: 'sofort', blocks: [block(art, 'Flach', 0)] },
      { name: 'Haarlinie', motion: 'sofort', blocks: [block(art, 'Haarlinie', 1)] },
      { name: 'Akzentlinie', motion: 'sofort', blocks: [block(art, 'Akzentlinie', 2)] },
    ]
  }
  if (art === 'liste') {
    return [
      { name: 'Drei', motion: 'sofort', blocks: [block(art, 'Zeile', 0)] },
      { name: 'Vier', motion: 'sofort', blocks: [block(art, 'Zeile', 1)] },
      { name: 'Fünf', motion: 'sofort', blocks: [block(art, 'Zeile', 2)] },
    ]
  }
  if (art === 'leiste') {
    return [
      { name: 'Links', motion: 'sofort', blocks: [block(art, 'Titel', 0)] },
      { name: 'Mitte', motion: 'sofort', blocks: [block(art, 'Titel', 1)] },
      { name: 'Nebenwort', motion: 'sofort', blocks: [block(art, 'Titel', 2)] },
    ]
  }
  if (art === 'feld') {
    return [
      { name: 'Suchen', motion: 'sofort', blocks: [block(art, 'Suchen', 0)] },
      { name: 'Name', motion: 'sofort', blocks: [block(art, 'Name', 1)] },
      { name: 'Notiz', motion: 'sofort', blocks: [block(art, 'Notiz', 2)] },
    ]
  }
  return [
    { name: 'Zwei', motion: 'sofort', blocks: [block(art, 'Heute Woche', 0)] },
    { name: 'Drei', motion: 'sofort', blocks: [block(art, 'Heute Woche Monat', 1)] },
    { name: 'Breit', motion: 'sofort', blocks: [block(art, 'Alle', 2)] },
  ]
}
