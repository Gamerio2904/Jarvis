import { del, getAll, newId, put } from './store.ts'
import type { ResearchSource } from './research-parse.ts'
import { slugTopic, titleFromTopic } from './teach-parse.ts'
import {
  CLAIM_CAP,
  CLAIM_MAX,
  PACK_CAP,
  PACK_SUMMARY_MAX,
  type KnowledgeClaim,
  type KnowledgePack,
} from './knowledge-types.ts'

export type { KnowledgeClaim, KnowledgeOrigin, KnowledgePack } from './knowledge-types.ts'
export { CLAIM_CAP, CLAIM_MAX, PACK_CAP, PACK_SUMMARY_MAX } from './knowledge-types.ts'

const mem = new Map<string, KnowledgePack>()

function hasIdb(): boolean {
  return typeof indexedDB !== 'undefined'
}

function nowIso(): string {
  return new Date().toISOString()
}

export function clipClaim(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, CLAIM_MAX)
}

export function clipSummary(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, PACK_SUMMARY_MAX)
}

export function claimsFromText(text: string, urls: string[] = []): KnowledgeClaim[] {
  const parts = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => clipClaim(s.replace(/^[-*•]\s*/, '')))
    .filter((s) => s.length >= 8)
  const seen = new Set<string>()
  const out: KnowledgeClaim[] = []
  for (const text of parts) {
    const k = text.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push({ id: newIdSafe(), text, source_urls: urls.slice(0, 4), user_ok: true })
    if (out.length >= CLAIM_CAP) break
  }
  return out
}

function newIdSafe(): string {
  try {
    return newId()
  } catch {
    return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  }
}

export function normalizePack(partial: Partial<KnowledgePack> & { topic: string; title?: string }): KnowledgePack {
  const topic = slugTopic(partial.topic) || 'fach'
  const title = (partial.title || titleFromTopic(topic)).trim() || titleFromTopic(topic)
  const aliases = [...new Set([topic, title.toLowerCase(), ...(partial.aliases || []).map((a) => a.toLowerCase())])]
  const claims = (partial.claims || []).map((c) => ({
    ...c,
    id: c.id || newIdSafe(),
    text: clipClaim(c.text),
    source_urls: (c.source_urls || []).slice(0, 6),
    user_ok: c.user_ok !== false,
  })).filter((c) => c.text.length >= 2).slice(0, CLAIM_CAP)
  const now = nowIso()
  return {
    id: partial.id || topic,
    topic,
    title,
    aliases,
    summary: clipSummary(partial.summary || claims.slice(0, 3).map((c) => c.text).join(' ')),
    claims,
    sources: (partial.sources || []) as ResearchSource[],
    origin: partial.origin || 'user',
    taught_at: partial.taught_at || now,
    updated_at: now,
    user_ok: partial.user_ok !== false,
    source_agent: partial.source_agent,
    links: [...new Set(partial.links || [])].slice(0, 8),
  }
}

export function prunePackList(rows: KnowledgePack[]): KnowledgePack[] {
  if (rows.length <= PACK_CAP) return rows
  const rank = (p: KnowledgePack) => (p.user_ok ? 1 : 0)
  const sorted = [...rows].sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(a) - rank(b)
    return a.updated_at < b.updated_at ? -1 : 1
  })
  const drop = new Set(sorted.slice(0, rows.length - PACK_CAP).map((p) => p.id))
  return rows.filter((p) => !drop.has(p.id))
}

export function claimsConflict(a: string, b: string): boolean {
  const na = a.toLowerCase()
  const nb = b.toLowerCase()
  const neg = (s: string) => /\b(?:nicht|kein|keine|keinen|keine)\b/.test(s)
  if (neg(na) === neg(nb)) return false
  const tokens = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-zäöüß0-9]+/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !/^(nicht|kein|keine|keinen)$/.test(w))
  const ta = new Set(tokens(a))
  const tb = tokens(b)
  const overlap = tb.filter((w) => ta.has(w)).length
  return overlap >= 2
}

export function mergeClaims(
  existing: KnowledgeClaim[],
  incoming: KnowledgeClaim[],
): { claims: KnowledgeClaim[]; ignored: number; revised: number } {
  let ignored = 0
  let revised = 0
  const out = [...existing]
  for (const add of incoming) {
    const same = out.find(
      (c) =>
        c.text.toLowerCase() === add.text.toLowerCase() &&
        (c.source_urls[0] || '') === (add.source_urls[0] || ''),
    )
    if (same) {
      ignored += 1
      continue
    }
    const hit = out.findIndex((c) => claimsConflict(c.text, add.text))
    if (hit >= 0) {
      out[hit] = { ...add, id: out[hit].id }
      revised += 1
      continue
    }
    out.push(add)
  }
  const pruned = pruneClaims(out)
  return { claims: pruned, ignored, revised }
}

export function pruneClaims(claims: KnowledgeClaim[]): KnowledgeClaim[] {
  if (claims.length <= CLAIM_CAP) return claims
  const rank = (c: KnowledgeClaim) => (c.user_ok ? 1 : 0)
  const sorted = [...claims].sort((a, b) => rank(a) - rank(b))
  const drop = new Set(sorted.slice(0, claims.length - CLAIM_CAP).map((c) => c.id))
  return claims.filter((c) => !drop.has(c.id))
}

async function readAll(): Promise<KnowledgePack[]> {
  if (!hasIdb()) return [...mem.values()]
  try {
    return await getAll<KnowledgePack>('knowledge_packs')
  } catch {
    return [...mem.values()]
  }
}

async function writeAll(rows: KnowledgePack[]): Promise<void> {
  const kept = prunePackList(rows)
  mem.clear()
  for (const r of kept) mem.set(r.id, r)
  if (!hasIdb()) return
  let existing: KnowledgePack[] = []
  try {
    existing = await getAll<KnowledgePack>('knowledge_packs')
  } catch {
    existing = []
  }
  const keepIds = new Set(kept.map((p) => p.id))
  for (const g of existing) {
    if (keepIds.has(g.id)) continue
    try {
      await del('knowledge_packs', g.id)
    } catch {
      /* */
    }
  }
  for (const r of kept) {
    try {
      await put('knowledge_packs', r)
    } catch {
      /* Node / fehlendes Store */
    }
  }
}

export async function listKnowledgePacks(): Promise<KnowledgePack[]> {
  const rows = await readAll()
  return rows.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
}

export async function getKnowledgePack(id: string): Promise<KnowledgePack | undefined> {
  const rows = await readAll()
  return rows.find((p) => p.id === id || p.topic === id)
}

export async function getByTopic(topic: string): Promise<KnowledgePack | undefined> {
  const slug = slugTopic(topic)
  const q = topic.toLowerCase()
  const rows = await readAll()
  return rows.find(
    (p) =>
      p.topic === slug ||
      p.aliases.some((a) => a === q || slugTopic(a) === slug) ||
      p.title.toLowerCase() === q,
  )
}

function packTokens(p: KnowledgePack): Set<string> {
  const blob = [p.topic, p.title, ...(p.aliases || []), ...(p.claims || []).map((c) => c.text)].join(' ')
  return new Set(
    blob
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2),
  )
}

function overlapCount(a: Set<string>, b: Set<string>): number {
  let n = 0
  for (const w of a) if (b.has(w)) n += 1
  return n
}

function withLinks(rows: KnowledgePack[], fresh: KnowledgePack): KnowledgePack[] {
  const tokens = packTokens(fresh)
  const mine = new Set<string>()
  const out = rows.map((p) => {
    if (p.id === fresh.id) return p
    const n = overlapCount(tokens, packTokens(p))
    if (n < 2) return p
    mine.add(p.topic)
    const links = [...new Set([...(p.links || []), fresh.topic])].slice(0, 8)
    return { ...p, links }
  })
  const linked = { ...fresh, links: [...new Set([...(fresh.links || []), ...mine])].slice(0, 8) }
  return out.map((p) => (p.id === fresh.id ? linked : p))
}

export async function putKnowledgePack(pack: KnowledgePack): Promise<KnowledgePack> {
  const row = normalizePack(pack)
  mem.set(row.id, row)
  const all = await readAll()
  const merged = all.some((p) => p.id === row.id) ? all.map((p) => (p.id === row.id ? row : p)) : [...all, row]
  const linked = withLinks(merged, row)
  const next = prunePackList(linked)
  const saved = next.find((p) => p.id === row.id) || row
  mem.set(saved.id, saved)
  await writeAll(next)
  return saved
}

export async function deleteKnowledgePack(id: string): Promise<void> {
  mem.delete(id)
  const rows = await readAll()
  const hit = rows.find((p) => p.id === id || p.topic === id)
  if (hit) mem.delete(hit.id)
  if (hasIdb() && hit) {
    try {
      await del('knowledge_packs', hit.id)
    } catch {
      /* */
    }
  }
}

export async function clearKnowledgePacks(): Promise<void> {
  const rows = await readAll()
  mem.clear()
  if (!hasIdb()) return
  for (const r of rows) {
    try {
      await del('knowledge_packs', r.id)
    } catch {
      /* */
    }
  }
}

export function resetKnowledgeMem(): void {
  mem.clear()
}
