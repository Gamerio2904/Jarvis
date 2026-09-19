import { slugTopic } from './teach-parse.ts'
import type { KnowledgePack } from './knowledge-types.ts'

const PACK_STOP = new Set([
  'ist', 'an', 'aus', 'die', 'der', 'das', 'den', 'dem', 'ein', 'eine',
  'wo', 'wie', 'was', 'und', 'lage', 'welt', 'mir', 'dir', 'ich',
])

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !PACK_STOP.has(w))
}

function packBlob(p: KnowledgePack): string {
  const claims = (p.claims || [])
    .filter((c) => c && c.user_ok && c.text)
    .map((c) => c.text)
  return [p.topic, p.title, ...p.aliases, ...claims].join(' ').toLowerCase()
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

export function retrievePacks(ask: string, packs: KnowledgePack[]): KnowledgePack[] {
  if (/^\s*(?:lage|tablet|hud)\s+(?:an|aus|ein|weg)\s*$/i.test(ask)) return []
  if (/^\s*(?:wo\s+(?:liegt|ist)|öffne\s+(?:die\s+)?(?:weltkugel|kugel|globus))/i.test(ask)) return []
  if (/\btimer\b/i.test(ask)) return []
  const pref = /(?:was\s+(?:trinke?|esse)\s+ich|welche\s+reisen|mag\s+ich)\b/i.test(ask)
  if (pref) return []
  const ok = packs.filter((p) => p.user_ok)
  const ranked = ok
    .map((p) => ({ p, s: packScore(ask, p) }))
    .filter((x) => x.s >= 0.5)
    .sort((a, b) => b.s - a.s)
  if (!ranked.length) return []
  const top = ranked[0]
  const second = ranked[1]
  const primary = second && second.s >= 2 && top.s >= 2 ? [top.p, second.p] : [top.p]
  const seen = new Set(primary.map((p) => p.topic || p.id))
  const hopCands: Array<{ p: KnowledgePack; s: number }> = []
  for (const p of primary) {
    for (const id of p.links || []) {
      const n = ok.find((x) => x.topic === id || x.id === id)
      if (!n || seen.has(n.topic || n.id)) continue
      hopCands.push({ p: n, s: packScore(ask, n) })
    }
  }
  hopCands.sort((a, b) => b.s - a.s)
  const hops: KnowledgePack[] = []
  for (const row of hopCands) {
    if (hops.length + primary.length >= 3) break
    const key = row.p.topic || row.p.id
    if (seen.has(key)) continue
    seen.add(key)
    hops.push(row.p)
  }
  return [...primary, ...hops].slice(0, 3)
}
