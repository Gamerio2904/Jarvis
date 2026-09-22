import { dumpLikeValue, expiresFor } from './memory-layer.ts'
import type { ResearchSource } from './research-parse.ts'
import { upsertMemory } from './store.ts'
import { upsertWorking } from './working-memory.ts'

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

/** Nur zitierte Treffer. Kein Satz ohne URL. e5 bleibt aus dem Router. */
export async function rememberCitedResearch(
  query: string,
  sources: ResearchSource[],
  conversationId?: string,
): Promise<number> {
  const q = query.replace(/\s+/g, ' ').trim()
  if (!q || q.length < 4) return 0
  const cited = sources.filter((s) => s.url && (s.snippet || s.title).trim())
  if (!cited.length) return 0
  let n = 0
  for (const s of cited.slice(0, 2)) {
    const host = hostOf(s.url)
    const claim = (s.snippet || s.title).replace(/\s+/g, ' ').trim().slice(0, 180)
    if (!claim || dumpLikeValue(claim) || !host) continue
    const key = `research:${slug(q)}`
    await upsertMemory(key, `${claim} (Quelle: ${host})`, 'research', conversationId, {
      origin: 'tool',
      confidence: 0.8,
      kind: 'fact',
      expires_at: expiresFor('tool', 'research'),
    })
    n += 1
  }
  if (n) upsertWorking('research', `${q.slice(0, 48)} — ${hostOf(cited[0].url)}`)
  return n
}
