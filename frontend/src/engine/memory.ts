import { listMemory, upsertMemory, clearMemory, deleteMemory, type MemoryItem } from './store'
import { packVerified } from './action-fsm.ts'
import {
  confidenceFor,
  contradictionTargets,
  memoryForgetVerified,
  memoryWriteVerified,
} from './memory-layer.ts'
import {
  RECALL_DRINK,
  RECALL_FOOD,
  RECALL_NAME,
  RECALL_VAGUE,
  VERGISS,
  VERGISS_ALL,
  CONTRADICTION,
  isIdentityAsk,
  isMemoryRecall,
  isMemoryWrite,
  parseMemoryFacts,
  formatPinnedMemory,
} from './memory-parse'
import type { ToolMeta } from './tools.ts'

export { isMemoryRecall, isMemoryWrite, parseMemoryFacts, formatPinnedMemory } from './memory-parse'
export type { MemoryFact } from './memory-parse'
export { memoryBlock } from './memory-block'

type MemHit = { handled: boolean; reply?: string; items?: MemoryItem[]; tool?: ToolMeta; lastTool?: string }

function packed(
  opts: Parameters<typeof packVerified>[0],
  items?: MemoryItem[],
): MemHit {
  const p = packVerified(opts)
  return { handled: true, reply: p.reply, items, tool: p.tool, lastTool: 'memory' }
}

export async function handleMemory(conversationId: string, text: string): Promise<MemHit> {
  if (VERGISS_ALL.test(text)) {
    await clearMemory()
    const remaining = (await listMemory()).length
    return packed({
      domain: 'memory',
      intent: 'forget:all',
      plan: 'forget',
      label: 'Gedächtnis',
      observation: { stored: false, removed: remaining === 0, remaining, key: '*', value: 'all' },
      verify: (obs) => memoryForgetVerified(obs),
      successReply: 'Alles über Sie ist weg.',
      failReply: 'Konnte nicht alles löschen.',
    })
  }
  const forget = VERGISS.exec(text)
  if (forget) {
    const q = forget[1].trim().toLowerCase()
    const items = await listMemory()
    const hit = items.find((m) => m.key.toLowerCase() === q || m.value.toLowerCase().includes(q))
    if (hit) {
      await deleteMemory(hit.id)
      const gone = !(await listMemory()).some((m) => m.id === hit.id)
      return packed({
        domain: 'memory',
        intent: `forget:${hit.key}`,
        plan: 'forget',
        label: 'Gedächtnis',
        observation: { stored: false, removed: gone, key: hit.key, value: hit.value },
        verify: (obs) => memoryForgetVerified(obs),
        successReply: `Vergessen: ${hit.key}.`,
        failReply: 'Dazu lag nichts, das ich löschen konnte.',
      })
    }
    return packed({
      domain: 'memory',
      intent: `forget:${q}`,
      plan: 'forget',
      label: 'Gedächtnis',
      waiting: true,
      observation: { ask: true, key: q },
      successReply: 'Dazu lag nichts.',
      failReply: 'Dazu lag nichts.',
    })
  }
  const contra = CONTRADICTION.exec(text)
  if (contra) {
    const needle = contra[1].replace(/[.!?,;:]+$/g, '').trim()
    if (needle.length >= 3 && !/\b(termin|wecker|timer|todo|mehr)\b/i.test(needle)) {
      const items = await listMemory()
      const hits = contradictionTargets(items, needle)
      if (hits.length) {
        for (const hit of hits) await deleteMemory(hit.id)
        const left = (await listMemory()).filter((m) => hits.some((h) => h.id === m.id))
        const gone = left.length === 0
        const label = hits[0].value
        return packed({
          domain: 'memory',
          intent: `contradict:${needle}`,
          plan: 'contradict',
          label: 'Gedächtnis',
          observation: { stored: false, removed: gone, key: hits[0].key, value: label },
          verify: (obs) => memoryForgetVerified(obs),
          successReply: `${label} ist raus.`,
          failReply: `„${contra[1].trim()}“ lag nicht im Gedächtnis.`,
        })
      }
      return packed({
        domain: 'memory',
        intent: `contradict:${needle}`,
        plan: 'contradict',
        label: 'Gedächtnis',
        waiting: true,
        observation: { ask: true, key: needle },
        successReply: `„${contra[1].trim()}“ lag nicht im Gedächtnis.`,
        failReply: `„${contra[1].trim()}“ lag nicht im Gedächtnis.`,
      })
    }
  }
  if (isMemoryRecall(text)) {
    const items = await listMemory()
    if (RECALL_DRINK.test(text)) {
      const d = items.find((m) => m.key === 'getränk')
      return {
        handled: true,
        reply: d ? `Sie trinken ${d.value}.` : 'Kein Getränk gespeichert.',
        lastTool: 'memory',
      }
    }
    if (RECALL_FOOD.test(text)) {
      const d = items.find((m) => m.key === 'essen')
      return {
        handled: true,
        reply: d ? `Sie essen ${d.value}.` : 'Kein Essen gespeichert.',
        lastTool: 'memory',
      }
    }
    if (RECALL_NAME.test(text)) {
      const d = items.find((m) => m.key === 'name')
      return {
        handled: true,
        reply: d ? `Sie heißen ${d.value}.` : 'Kein Name gespeichert.',
        lastTool: 'memory',
      }
    }
    if (RECALL_VAGUE.test(text)) {
      const drink = items.find((m) => m.key === 'getränk')
      const food = items.find((m) => m.key === 'essen')
      if (!drink && !food) {
        return { handled: true, reply: 'Dazu liegt nichts — Getränk oder Essen?', lastTool: 'memory' }
      }
      const bits = [drink && `Getränk: ${drink.value}`, food && `Essen: ${food.value}`]
        .filter(Boolean)
        .join('; ')
      return { handled: true, reply: bits, lastTool: 'memory' }
    }
    if (!items.length) return { handled: true, reply: 'Noch nichts gespeichert über Sie.', lastTool: 'memory' }
    return { handled: true, reply: formatPinnedMemory(items), lastTool: 'memory' }
  }
  if (isMemoryWrite(text)) {
    const facts = parseMemoryFacts(text)
    if (facts.length) {
      const saved: MemoryItem[] = []
      for (const f of facts) {
        saved.push(
          await upsertMemory(f.key, f.value, f.category, conversationId, {
            origin: 'user',
            confidence: confidenceFor('user', f.category),
          }),
        )
      }
      const now = await listMemory()
      const ok = saved.every((s) => now.some((m) => m.id === s.id && m.value === s.value))
      const bits = saved.map((s) => s.value).join(', ')
      const success =
        saved.length === 1 && saved[0].key === 'name' ? `Name gemerkt: ${saved[0].value}.` : `Gemerkt: ${bits}.`
      return packed(
        {
          domain: 'memory',
          intent: `write:${saved.map((s) => s.key).join(',')}`,
          plan: 'write',
          label: 'Gedächtnis',
          observation: {
            stored: ok,
            key: saved.map((s) => s.key).join(','),
            value: bits,
            confidence: saved[0]?.confidence ?? 0,
            origin: 'user',
          },
          verify: (obs) => memoryWriteVerified(obs),
          successReply: success,
          failReply: 'Nicht gespeichert.',
        },
        saved,
      )
    }
  }
  if (isIdentityAsk(text)) {
    const items = await listMemory()
    const name = items.find((m) => m.key === 'name')
    if (name) {
      return { handled: true, reply: `Jarvis. Sie heißen ${name.value}. Für Sie, jederzeit.`, lastTool: 'memory' }
    }
    return {
      handled: true,
      reply: 'Jarvis. Immer da. Einen Namen von Ihnen habe ich noch nicht.',
      lastTool: 'memory',
    }
  }
  return { handled: false }
}
