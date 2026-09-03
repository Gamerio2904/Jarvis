import { slugTopic } from './teach-parse.ts'
import type { KnowledgePack } from './knowledge-types.ts'

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2)
}

function packBlob(p: KnowledgePack): string {
  return [p.topic, p.title, ...p.aliases].join(' ').toLowerCase()
}

export function packScore(ask: string, pack: KnowledgePack): number {
  if (!pack.user_ok) return 0
  const q = ask.toLowerCase()
  const slug = slugTopic(ask)
  if (pack.topic === slug) return 4
  if (pack.aliases.some((a) => a === q || slugTopic(a) === slug)) return 3.5
  if (q.includes(pack.topic) || pack.topic.length > 3 && q.includes(pack.topic.replace(/-/g, ' '))) return 3
  const qt = tokens(ask)
  const blob = packBlob(pack)
  const hit = qt.filter((w) => blob.includes(w)).length
  if (!hit) return 0
  return hit / Math.max(qt.length, 1)
}

/** Linear, Top 1 — selten 2 wenn beide matchen. */
export function retrievePacks(ask: string, packs: KnowledgePack[]): KnowledgePack[] {
  const pref = /(?:was\s+(?:trinke?|esse)\s+ich|welche\s+reisen|mag\s+ich)\b/i.test(ask)
  if (pref) return []
  const ranked = packs
    .map((p) => ({ p, s: packScore(ask, p) }))
    .filter((x) => x.s >= 0.5)
    .sort((a, b) => b.s - a.s)
  if (!ranked.length) return []
  const top = ranked[0]
  const second = ranked[1]
  if (second && second.s >= 2 && top.s >= 2) return [top.p, second.p]
  return [top.p]
}
