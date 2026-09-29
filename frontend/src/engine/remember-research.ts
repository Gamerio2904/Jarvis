import { dumpLikeValue } from './memory-layer.ts'
import { proposeMemory } from './memory-propose.ts'
import type { ResearchSource } from './research-parse.ts'

const RESEARCH_STOP = new Set(
  'der die das den dem des ein eine einer einem einen und oder aber mit von zu im in am auf aus für als wie was wer wo wann warum dass ist sind war hat habe ich wir sie du mir mich uns ihr eure mein meine dein keine kein noch nur auch schon mal bitte doch über uber weißt weiss stand hatte gerade ohne kennst kennt davon dazu darüber darueber sagst gesagt liegt geben welche wollte machen viele viel eine einem'.split(
    ' ',
  ),
)

function slug(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-zäöüß0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function researchKey(query: string, host: string): string {
  return `research:${slug(query)}:${slug(host)}`
}

/** Tokens aus Frage + Claim, damit Retrieve die Pin später wiederfindet. */
export function researchEntities(query: string, claim = ''): string[] {
  const blob = `${query} ${claim}`.toLowerCase()
  return [
    ...new Set(
      blob
        .split(/[^a-zäöüß0-9]+/i)
        .map((w) => w.trim())
        .filter((w) => w.length > 2 && !RESEARCH_STOP.has(w)),
    ),
  ].slice(0, 8)
}

/**
 * Nur zitierte Treffer. Vorschlagen, nicht speichern.
 * Cap-80 bleibt leer, bis der Nutzer Ja sagt.
 */
export async function rememberCitedResearch(
  query: string,
  sources: ResearchSource[],
  _conversationId?: string,
): Promise<number> {
  const q = query.replace(/\s+/g, ' ').trim()
  if (!q || q.length < 4) return 0
  const cited = sources.filter((s) => s.url && (s.snippet || s.title).trim())
  if (!cited.length) return 0
  let n = 0
  for (const s of cited.slice(0, 3)) {
    const host = hostOf(s.url)
    const claim = (s.snippet || s.title).replace(/\s+/g, ' ').trim().slice(0, 180)
    if (!claim || dumpLikeValue(claim) || !host) continue
    const row = await proposeMemory({
      key: researchKey(q, host),
      value: `${claim} (Quelle: ${host})`,
      category: 'research',
      url: s.url,
      origin: 'research',
    })
    if (row) n += 1
  }
  return n
}
