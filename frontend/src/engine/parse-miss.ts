/**
 * Parser-Misses bleiben Tests, keine Gewichte.
 * Nur lokal, kein Cloud-Upload. Gold-Import ist Handarbeit in corpus.ts.
 */

const KEY = 'jarvis_parse_miss_v1'
const CAP = 40

export type ParseMiss = {
  at: string
  utterance: string
  expected?: string
}

let lastNone = ''
let lastUser = ''

export function noteLastUtterance(text: string): void {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  if (!t || t.length < 3) return
  if (expectedAgentFromCorrection(t)) return
  lastUser = t.slice(0, 160)
}

export function peekLastReplay(): string {
  return lastNone || lastUser
}

export function clearLastNone(): void {
  lastNone = ''
}

function loadRows(): ParseMiss[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? (parsed as ParseMiss[]) : []
  } catch {
    return []
  }
}

function saveRows(rows: ParseMiss[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows.slice(-CAP)))
  } catch {
    /* Quota / privater Modus */
  }
}

export function noteParseMiss(utterance: string, expected?: string): ParseMiss | null {
  const text = (utterance || '').replace(/\s+/g, ' ').trim()
  if (!text || text.length < 3 || text.length > 160) return null
  lastNone = text
  const row: ParseMiss = {
    at: new Date().toISOString(),
    utterance: text,
    ...(expected ? { expected } : {}),
  }
  const rows = loadRows()
  const prev = rows[rows.length - 1]
  if (prev && prev.utterance === text && prev.expected === expected) return prev
  rows.push(row)
  saveRows(rows)
  return row
}

const AGENT_WORD: Record<string, string> = {
  timer: 'timer',
  wecker: 'alarm',
  alarm: 'alarm',
  erinnerung: 'reminder',
  kalender: 'calendar',
  termin: 'calendar',
  fernseher: 'tv',
  tv: 'tv',
  nachrichten: 'news',
  wetter: 'weather',
}

export function expectedAgentFromCorrection(text: string): string | null {
  const t = (text || '').trim()
  const m =
    /^\s*(?:nein|nee+),?\s+das\s+war\s+(?:der|die|das|ein|eine)\s+([a-zäöüß]+)\s*[.!]?\s*$/i.exec(t)
  if (!m) return null
  return AGENT_WORD[m[1].toLowerCase()] || null
}

/** Nutzer widerspricht nach einem Miss: nächster Gold-Kandidat, kein Fine-Tune. */
export function noteParseCorrection(utterance: string, agentId?: string): ParseMiss | null {
  const expected = agentId || expectedAgentFromCorrection(utterance)
  if (!expected) return null
  const fromCorrection = expectedAgentFromCorrection(utterance)
  if (!fromCorrection && !lastNone) return null
  const target = fromCorrection ? lastNone || utterance : utterance
  return noteParseMiss(target, expected)
}

export function listParseMisses(): ParseMiss[] {
  return loadRows()
}

export function resetParseMisses(): void {
  lastNone = ''
  lastUser = ''
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* */
  }
}
