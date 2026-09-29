/** Alltag-Aliase für Retrieve 2. Enge Paare — kein passwort/essen/termin als Anker. */

export const FAMILY_ALIAS_GROUPS: string[][] = [
  ['mama', 'mutter', 'mother'],
  ['papa', 'vater', 'father'],
  ['oma', 'grossmutter', 'großmutter'],
  ['opa', 'grossvater', 'großvater'],
]

export const ALIAS_GROUPS: string[][] = [
  ['wlan', 'wifi', 'fritzbox', 'router'],
  ['japan', 'tokyo', 'kyoto', 'reise'],
  ['zahnarzt'],
  ['döner', 'doener'],
  ...FAMILY_ALIAS_GROUPS,
]

function isFamilyGroup(g: string[]): boolean {
  return FAMILY_ALIAS_GROUPS.some((f) => f[0] === g[0])
}

/** Wortgrenze: „Mutter“ trifft nicht „Großmutter“. */
export function memberInBlob(blob: string, member: string, word = false): boolean {
  const b = blob.toLowerCase()
  const m = member.toLowerCase()
  if (!m) return false
  if (!word) return b.includes(m)
  const escaped = m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|[^a-zäöüß])${escaped}(?:[^a-zäöüß]|$)`, 'i').test(blob)
}

export const TRAVEL_MARKERS = ['japan', 'tokyo', 'tokio', 'kyoto', 'reise', 'urlaub']

function norm(s: string): string {
  return s.toLowerCase().replace(/ö/g, 'oe').replace(/ä/g, 'ae').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
}

export function aliasMembers(token: string): string[] {
  const n = norm(token)
  for (const g of ALIAS_GROUPS) {
    if (g.some((x) => norm(x) === n)) return g
  }
  return [token.toLowerCase()]
}

function groupHitsBlob(blob: string, g: string[]): boolean {
  return g.some((x) => memberInBlob(blob, x, isFamilyGroup(g)))
}

/** parent_key=reise nur bei Reise-Goals, nicht bei jedem Goal. */
export function inferParentKey(
  kind: string | undefined,
  key: string,
  value: string,
  entities: string[] = [],
): string | null {
  if (kind !== 'goal') return null
  const blob = `${key} ${value} ${entities.join(' ')}`.toLowerCase()
  if (TRAVEL_MARKERS.some((m) => blob.includes(m))) return 'reise'
  return null
}

/** If blob contains any group member, append the whole group. */
export function expandBlob(blob: string): string {
  const extra: string[] = []
  for (const g of ALIAS_GROUPS) {
    if (groupHitsBlob(blob, g)) extra.push(...g)
  }
  return extra.length ? `${blob} ${extra.join(' ')}` : blob
}

export function aliasQueries(text: string): string[] {
  const t = text.toLowerCase()
  const out: string[] = []
  for (const g of ALIAS_GROUPS) {
    if (!groupHitsBlob(t, g)) continue
    for (const x of g) {
      if (!memberInBlob(t, x, isFamilyGroup(g))) out.push(x)
    }
  }
  return [...new Set(out)]
}

export type UtteranceHints = {
  kind?: 'pref' | 'fact' | 'goal' | 'event' | 'open_loop' | 'boundary'
  entities: string[]
  tense?: 'past' | 'present' | 'future' | 'unknown'
}

export function utteranceHints(text: string): UtteranceHints {
  const t = (text || '').toLowerCase()
  const entities: string[] = []
  for (const g of ALIAS_GROUPS) {
    if (groupHitsBlob(t, g)) {
      for (const x of g) entities.push(x)
    }
  }
  let kind: UtteranceHints['kind']
  let tense: UtteranceHints['tense']
  if (/\b(?:welche\s+reisen|reise(?:n)?\s+plane|wollte\s+ich\s+in|nach\s+japan|in\s+japan)\b/.test(t)) {
    kind = 'goal'
    tense = /\b(?:war|gewesen)\b/.test(t) ? 'past' : 'future'
  }
  if (/\b(?:wlan|wifi|fritzbox|router-?passwort)\b/.test(t)) {
    entities.push('fritzbox', 'wlan', 'router')
  }
  if (/\b(?:mag\s+ich|trinke?\s+ich|esse\s+ich)\b/.test(t)) kind = kind || 'pref'
  return { kind, entities: [...new Set(entities.map((e) => e.toLowerCase()))], tense }
}

export function extractEntities(key: string, value: string): string[] {
  const blob = `${key} ${value}`.toLowerCase()
  const out: string[] = []
  for (const g of ALIAS_GROUPS) {
    if (groupHitsBlob(blob, g)) out.push(...g)
  }
  if (/\bfritzbox\b/.test(blob) || key.toLowerCase() === 'fritzbox') out.push('fritzbox', 'wlan', 'wifi', 'router')
  if (/\b(?:tokyo|tokio|japan|kyoto)\b/.test(blob) || key.toLowerCase() === 'reise') {
    out.push('japan', 'tokyo', 'reise')
  }
  return [...new Set(out)]
}
