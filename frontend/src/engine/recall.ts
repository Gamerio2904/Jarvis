import { parseRecallIntent } from './recall-parse.ts'
import { formatRecallReply, pickRecallHits, retrieve } from './retrieve.ts'
import { packVerified } from './action-fsm.ts'
import { memoryRecallVerified } from './memory-layer.ts'
import { backfillBirthdayEntities, isPersonClusterAsk, loadClusterStores, personClusterReply } from './person-cluster.ts'
import type { ToolMeta } from './tools.ts'

export { parseRecallIntent }

export async function handleRecall(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const q = parseRecallIntent(text)
  if (!q) return { handled: false }
  const hits = await retrieve(q)
  const { memory, reminders } = await loadClusterStores()
  await backfillBirthdayEntities(memory)
  const cluster = isPersonClusterAsk(text) ? personClusterReply(text, hits, memory, reminders) : null
  const reply = cluster || formatRecallReply(q, hits)
  const used = pickRecallHits(q, hits)
  const empty = /^Nichts Belegtes/.test(reply)
  const cited = !empty
  const packed = packVerified({
    domain: 'memory',
    intent: `recall:${q}`,
    plan: 'recall',
    label: 'Gedächtnis',
    observation: {
      hits: cluster && cited ? Math.max(used.length, 1) : used.length,
      cited,
      stores: [...new Set(used.map((h) => h.store))],
      key: q,
    },
    verify: (obs) => memoryRecallVerified(obs),
    successReply: reply,
    failReply: `Nichts Belegtes zu „${q}“ in den lokalen Speichern.`,
  })
  return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'recall' }
}
