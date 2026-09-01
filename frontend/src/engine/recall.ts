import { parseRecallIntent } from './recall-parse.ts'
import { formatRecallReply, retrieve } from './retrieve.ts'
import { packVerified } from './action-fsm.ts'
import { memoryRecallVerified } from './memory-layer.ts'
import type { ToolMeta } from './tools.ts'

export { parseRecallIntent }

export async function handleRecall(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const q = parseRecallIntent(text)
  if (!q) return { handled: false }
  const hits = await retrieve(q)
  const reply = formatRecallReply(q, hits)
  const cited = hits.length > 0 && !/^Nichts Belegtes/.test(reply)
  const packed = packVerified({
    domain: 'memory',
    intent: `recall:${q}`,
    plan: 'recall',
    label: 'Gedächtnis',
    observation: {
      hits: hits.length,
      cited,
      stores: [...new Set(hits.map((h) => h.store))],
      key: q,
    },
    verify: (obs) => memoryRecallVerified(obs),
    successReply: reply,
    failReply: `Nichts Belegtes zu „${q}“ in den lokalen Speichern.`,
  })
  return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'recall' }
}
