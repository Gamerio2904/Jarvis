import {
  dumpLikeValue,
  inferKind,
  inferTense,
  rowKind,
  type MemoryEdge,
  type MemoryGateAction,
  type MemoryKind,
  type MemoryOrigin,
  type MemoryTense,
} from './memory-layer.ts'
import { extractEntities } from './memory-alias.ts'
import {
  listMemory,
  pruneStaleAfterWrite,
  upsertMemory,
  type MemoryItem,
  type MemoryWriteOpts,
} from './store.ts'

export type GateCandidate = {
  key: string
  value: string
  category: string
  origin?: MemoryOrigin
  kind?: MemoryKind
  entities?: string[]
  tense?: MemoryTense
  parent_key?: string | null
  spoken?: string
}

export type GateDecision = {
  action: MemoryGateAction
  target?: MemoryItem
  reason: string
}

function normVal(s: string): string {
  return (s || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function mealYesterday(value: string, spoken = ''): boolean {
  const t = `${value} ${spoken}`.toLowerCase()
  return /\b(?:heute|gestern)\b/.test(t) && /\b(?:nudel|pizza|essen|gegessen)\b/.test(t) && !/\bmerk/.test(t)
}

export function decideGate(candidate: GateCandidate, existing: MemoryItem[]): GateDecision {
  const value = (candidate.value || '').trim()
  if (value.length < 2) return { action: 'IGNORE', reason: 'zu kurz' }
  if (dumpLikeValue(value)) return { action: 'IGNORE', reason: 'dump' }
  if (/^(hallo|ok|danke|witz)\b/i.test(value)) return { action: 'IGNORE', reason: 'smalltalk' }
  if (mealYesterday(value, candidate.spoken)) return { action: 'IGNORE', reason: 'alltag-mahlzeit' }

  const sameKey = existing.filter((m) => m.key === candidate.key && m.category === candidate.category)
  const ident = sameKey.find((m) => normVal(m.value) === normVal(value))
  if (ident) return { action: 'IGNORE', target: ident, reason: 'identisch' }
  if (sameKey.length) return { action: 'REVISE', target: sameKey[0], reason: 'gleicher-key' }

  const kind = candidate.kind || inferKind(candidate.key, value, candidate.category, candidate.spoken)
  const ents = (candidate.entities || extractEntities(candidate.key, value)).map((e) => e.toLowerCase())
  if (ents.length) {
    const merge = existing.find((m) => {
      if (rowKind(m) !== kind) return false
      const them = (m.entities || extractEntities(m.key, m.value)).map((e) => e.toLowerCase())
      if (!them.some((e) => ents.includes(e))) return false
      const a = normVal(m.value)
      const b = normVal(value)
      return a.includes(b.slice(0, 12)) || b.includes(a.slice(0, 12)) || a.split(' ').some((w) => w.length > 3 && b.includes(w))
    })
    if (merge) return { action: 'MERGE', target: merge, reason: 'entity-overlap' }
  }
  return { action: 'STORE', reason: 'neu' }
}

export function neighborLinks(row: MemoryItem, others: MemoryItem[]): Array<{ id: string; edge: MemoryEdge }> {
  const ents = new Set((row.entities || extractEntities(row.key, row.value)).map((e) => e.toLowerCase()))
  const out: Array<{ id: string; edge: MemoryEdge }> = []
  for (const o of others) {
    if (o.id === row.id) continue
    if (out.length >= 6) break
    let edge: MemoryEdge | null = null
    if (row.parent_key && (o.key === row.parent_key || o.parent_key === row.key || o.key === row.key)) {
      edge = 'parent'
    }
    const oEnts = (o.entities || extractEntities(o.key, o.value)).map((e) => e.toLowerCase())
    if (!edge && oEnts.some((e) => ents.has(e))) edge = 'same_entity'
    if (edge) out.push({ id: o.id, edge })
  }
  return out
}

export type WriteMemoryInput = GateCandidate & {
  conversationId?: string
  confidence?: number
  expires_at?: string | null
  event_time?: string | null
  importance?: number
}

export async function writeMemory(input: WriteMemoryInput): Promise<{
  action: MemoryGateAction
  item: MemoryItem | null
  stored: boolean
}> {
  const existing = await listMemory()
  const decision = decideGate(input, existing)
  if (decision.action === 'IGNORE' && !decision.target) {
    return { action: 'IGNORE', item: null, stored: false }
  }
  const kind = input.kind || inferKind(input.key, input.value, input.category, input.spoken)
  const entities = input.entities || extractEntities(input.key, input.value)
  const tense = input.tense || inferTense(`${input.key} ${input.value} ${input.spoken || ''}`)
  const parent_key = input.parent_key ?? (kind === 'goal' ? 'reise' : null)
  const opts: MemoryWriteOpts = {
    origin: input.origin || 'user',
    confidence: input.confidence,
    expires_at: input.expires_at,
    kind,
    entities,
    tense,
    parent_key,
    event_time: input.event_time,
    importance: input.importance,
  }
  if (decision.action === 'IGNORE' && decision.target) {
    const item = await upsertMemory(decision.target.key, decision.target.value, decision.target.category, input.conversationId, {
      ...opts,
      kind: decision.target.kind || kind,
      entities: decision.target.entities || entities,
    })
    return { action: 'IGNORE', item, stored: true }
  }
  if (decision.action === 'MERGE' && decision.target) {
    const value = input.value.length >= decision.target.value.length ? input.value : decision.target.value
    const mergedEnt = [...new Set([...(decision.target.entities || []), ...entities])]
    const item = await upsertMemory(decision.target.key, value, decision.target.category, input.conversationId, {
      ...opts,
      kind: decision.target.kind || kind,
      entities: mergedEnt,
      related_ids: decision.target.related_ids,
      related_edge: decision.target.related_edge,
    })
    await linkMemory(item)
    await pruneStaleAfterWrite()
    return { action: 'MERGE', item, stored: true }
  }
  if (decision.action === 'REVISE' && decision.target) {
    const item = await upsertMemory(input.key, input.value, input.category, input.conversationId, {
      ...opts,
      related_ids: decision.target.related_ids,
      related_edge: decision.target.related_edge,
    })
    await linkMemory(item)
    await pruneStaleAfterWrite()
    return { action: 'REVISE', item, stored: true }
  }
  const item = await upsertMemory(input.key, input.value, input.category, input.conversationId, opts)
  await linkMemory(item)
  await pruneStaleAfterWrite()
  return { action: 'STORE', item, stored: true }
}

async function linkMemory(item: MemoryItem): Promise<void> {
  const others = (await listMemory()).filter((m) => m.id !== item.id)
  const links = neighborLinks(item, others)
  if (!links.length) return
  await upsertMemory(item.key, item.value, item.category, item.source_conversation_id || undefined, {
    origin: item.origin,
    confidence: item.confidence,
    expires_at: item.expires_at,
    kind: item.kind,
    entities: item.entities,
    tense: item.tense,
    parent_key: item.parent_key,
    event_time: item.event_time,
    importance: item.importance,
    related_ids: links.map((l) => l.id),
    related_edge: links.map((l) => l.edge),
    not_useful: item.not_useful,
  })
  for (const link of links.slice(0, 6)) {
    const n = others.find((m) => m.id === link.id)
    if (!n) continue
    const ids = [...new Set([...(n.related_ids || []), item.id])].slice(0, 6)
    const edges = [...(n.related_edge || [])]
    if (!n.related_ids?.includes(item.id)) edges.push(link.edge)
    await upsertMemory(n.key, n.value, n.category, n.source_conversation_id || undefined, {
      origin: n.origin,
      confidence: n.confidence,
      expires_at: n.expires_at,
      kind: n.kind,
      entities: n.entities,
      tense: n.tense,
      parent_key: n.parent_key,
      event_time: n.event_time,
      importance: n.importance,
      related_ids: ids,
      related_edge: edges.slice(0, 6),
      not_useful: n.not_useful,
    })
  }
}
