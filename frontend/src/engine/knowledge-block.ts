import { KNOWLEDGE_BLOCK_CLAIMS } from './knowledge-types.ts'
import type { KnowledgePack } from './knowledge-types.ts'
import { retrievePacks } from './knowledge-retrieve.ts'

export function knowledgeBlock(packs: KnowledgePack[], ask: string): string {
  const hits = retrievePacks(ask, packs).filter((p) => p.user_ok)
  if (!hits.length) return ''
  const lines: string[] = []
  for (const p of hits.slice(0, 2)) {
    lines.push(`Fachwissen «${p.title}»`)
    // Pakete liegen versionsübergreifend in IndexedDB. Ein Datensatz aus einem
    // älteren Schema darf den Prompt-Bau nicht werfen — sonst stirbt der ganze
    // Zug an einem alten Eintrag.
    const claims = (Array.isArray(p.claims) ? p.claims : [])
      .filter((c) => c && c.user_ok && c.text)
      .slice(0, KNOWLEDGE_BLOCK_CLAIMS)
    for (const c of claims) {
      const url = Array.isArray(c.source_urls) ? c.source_urls[0] : ''
      lines.push(`- ${c.text}${url ? ` (${url})` : ''}`)
    }
  }
  if (lines.length < 2) return ''
  return `Gelehrtes Fachwissen (nur diese Liste, nichts erfinden):\n${lines.join('\n')}\nNur Claims aus dieser Liste. Ohne Treffer kein Vortrag.`
}
