import { loadSettings, saveSettings, listMemory, upsertMemory } from './store.ts'
export { isUtilityCorrection } from './memory-parse.ts'

export function rememberRecallHits(hits: Array<{ id?: string; store: string }>): void {
  const ids = hits.filter((h) => h.store === 'memory' && h.id).map((h) => h.id as string)
  saveSettings({ last_recall_json: JSON.stringify({ ids, at: new Date().toISOString() }) })
}

export function lastRecallIds(): string[] {
  try {
    const raw = loadSettings().last_recall_json
    if (!raw) return []
    const o = JSON.parse(raw) as { ids?: unknown }
    return Array.isArray(o.ids) ? o.ids.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export async function markLastRecallNotUseful(): Promise<number> {
  const ids = lastRecallIds()
  if (!ids.length) return 0
  const rows = await listMemory()
  let n = 0
  for (const row of rows) {
    if (!ids.includes(row.id)) continue
    await upsertMemory(row.key, row.value, row.category, row.source_conversation_id || undefined, {
      origin: row.origin,
      confidence: row.confidence,
      expires_at: row.expires_at,
      kind: row.kind,
      entities: row.entities,
      tense: row.tense,
      parent_key: row.parent_key,
      event_time: row.event_time,
      importance: row.importance,
      related_ids: row.related_ids,
      related_edge: row.related_edge,
      not_useful: Number(row.not_useful || 0) + 1,
    })
    n += 1
  }
  return n
}
