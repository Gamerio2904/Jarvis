/**
 * I6/RAG für die Bibliothek — Abschnitte statt Ganztitel.
 *
 * Ein Brief ist tausende Zeichen; der Rückgriff (retrieve) zeigte bisher nur
 * die ersten 200. Hier wird der Text in Abschnitte geschnitten und der
 * Abschnitt mit der besten Wort-Übereinstimmung zur Frage geliefert — offline,
 * ohne Modell, nach demselben Treffer-Prinzip wie scoreEntry. „Was steht in
 * dem Brief vom Arzt?“ bekommt so die echte Passage ans Modell, nicht den
 * Anfang des Dokuments.
 */
import type { LibraryEntry } from './files.ts'
import { listLibrary } from './files.ts'

export type LibraryPassage = { entryId: string; name: string; score: number; text: string }

const CHUNK_SIZE = 600

/** Text in Abschnitte schneiden — an Satzgrenzen, ~600 Zeichen. */
export function chunkText(text: string, size = CHUNK_SIZE): string[] {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return []
  if (clean.length <= size) return [clean]
  const sentences = clean.split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if (current && current.length + sentence.length + 1 > size) {
      chunks.push(current)
      current = sentence
    } else {
      current = current ? `${current} ${sentence}` : sentence
    }
  }
  if (current) chunks.push(current)
  return chunks
}

function tokensOf(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-zäöüß0-9]+/i)
    .filter((word) => word.length > 2 && !STOP.has(word))
}

const STOP = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des', 'und', 'oder', 'aber', 'ist', 'sind', 'war', 'ein', 'eine', 'einen',
  'ich', 'mir', 'mich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'nicht', 'kein', 'keine', 'mit', 'von', 'vom',
  'zum', 'zur', 'für', 'auf', 'aus', 'bei', 'nach', 'vor', 'über', 'unter', 'was', 'wie', 'steht', 'steht',
])

/** Treffer-Score eines Abschnitts gegen die Frage (Wort-Übereinstimmung). */
export function passageScore(query: string, passage: string): number {
  const words = [...new Set(tokensOf(query))]
  if (!words.length) return 0
  const blob = passage.toLowerCase()
  const hits = words.filter((word) => blob.includes(word)).length
  return hits / words.length
}

/** Bester Abschnitt eines Eintrags für die Frage. */
export function bestPassage(query: string, entry: Pick<LibraryEntry, 'text' | 'summary' | 'name'>): { score: number; text: string } {
  const source = entry.text || entry.summary || ''
  const chunks = chunkText(source)
  if (!chunks.length) return { score: 0, text: (entry.summary || entry.name || '').slice(0, 200) }
  if (chunks.length === 1) return { score: passageScore(query, chunks[0]), text: chunks[0] }
  let best = chunks[0]
  let bestScore = -1
  for (const chunk of chunks) {
    const score = passageScore(query, chunk)
    if (score > bestScore) {
      bestScore = score
      best = chunk
    }
  }
  return { score: bestScore, text: best }
}

/** Die stärksten Abschnitte der ganzen Bibliothek für eine Frage. */
export async function retrieveLibraryPassages(query: string, limit = 4): Promise<LibraryPassage[]> {
  if (!query.trim()) return []
  const entries = await listLibrary()
  const rows: LibraryPassage[] = []
  for (const entry of entries) {
    if (!entry.text && !entry.summary) continue
    const best = bestPassage(query, entry)
    if (best.score <= 0) continue
    rows.push({ entryId: entry.id, name: entry.name, score: best.score, text: best.text })
  }
  return rows.sort((a, b) => b.score - a.score).slice(0, limit)
}
