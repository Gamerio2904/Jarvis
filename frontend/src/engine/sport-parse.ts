import { normalizeUtterance } from './utterance.ts'

export type SportIntent = { kind: 'score'; league: string; team?: string }

export const TEAMS: Array<{ key: string; name: string; re: RegExp }> = [
  { key: 'stuttgart', name: 'VfB Stuttgart', re: /\b(vfb|stuttgart)\b/i },
  { key: 'bayern', name: 'FC Bayern München', re: /\b(bayern|fcb|münchen|muenchen)\b/i },
  { key: 'dortmund', name: 'Borussia Dortmund', re: /\b(bvb|dortmund)\b/i },
  { key: 'leverkusen', name: 'Bayer 04 Leverkusen', re: /\b(leverkusen|werkself)\b/i },
  { key: 'leipzig', name: 'RB Leipzig', re: /\b(leipzig|rbl)\b/i },
  { key: 'frankfurt', name: 'Eintracht Frankfurt', re: /\b(frankfurt|sge|eintracht)\b/i },
  { key: 'gladbach', name: 'Borussia Mönchengladbach', re: /\b(gladbach|füchse|fuechse)\b/i },
  { key: 'union', name: '1. FC Union Berlin', re: /\b(union)\b/i },
  { key: 'wolfsburg', name: 'VfL Wolfsburg', re: /\b(wolfsburg)\b/i },
  { key: 'freiburg', name: 'SC Freiburg', re: /\b(freiburg)\b/i },
  { key: 'hoffenheim', name: 'TSG Hoffenheim', re: /\b(hoffenheim)\b/i },
  { key: 'mainz', name: '1. FSV Mainz 05', re: /\b(mainz)\b/i },
  { key: 'augsburg', name: 'FC Augsburg', re: /\b(augsburg)\b/i },
  { key: 'koeln', name: '1. FC Köln', re: /\b(köln|koeln)\b/i },
  { key: 'bremen', name: 'SV Werder Bremen', re: /\b(werder|bremen)\b/i },
  { key: 'heidenheim', name: '1. FC Heidenheim', re: /\b(heidenheim)\b/i },
  { key: 'pauli', name: 'FC St. Pauli', re: /\b(st\.?\s*pauli|pauli)\b/i },
]

const SCORE =
  /\b(gespielt|spielstand|ergebnis|tabellenplatz|wie\s+steht|bundesliga|zweitliga|2\.\s*liga|champions\s+league|dfb[-\s]?pokal|openliga)\b/i

export function parseSportIntent(text: string): SportIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  if (/\b(fifa|fc\s*26|mannschaft|kader)\b/i.test(t)) return null
  const team = TEAMS.find((x) => x.re.test(t))
  if (!SCORE.test(t) && !team) return null
  if (!SCORE.test(t) && team && !/\b(wie|hat|gespielt|ergebnis|stand)\b/i.test(t)) return null
  let league = 'bl1'
  if (/\b(2\.\s*liga|zweitliga|zweite\s+liga)\b/i.test(t)) league = 'bl2'
  else if (/\b(champions\s+league|\bcl\b)\b/i.test(t)) league = 'cl'
  else if (/\b(dfb|pokal)\b/i.test(t)) league = 'dfb'
  else if (/\b(3\.\s*liga|dritte\s+liga)\b/i.test(t)) league = 'bl3'
  return { kind: 'score', league, team: team?.name }
}
