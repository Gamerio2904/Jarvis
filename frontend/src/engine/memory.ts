import { listMemory, upsertMemory, clearMemory, deleteMemory, type MemoryItem } from './store'
import {
  RECALL_DRINK,
  RECALL_FOOD,
  RECALL_NAME,
  RECALL_VAGUE,
  VERGISS,
  VERGISS_ALL,
  isIdentityAsk,
  isMemoryRecall,
  isMemoryWrite,
  parseMemoryFacts,
} from './memory-parse'

export { isMemoryRecall, isMemoryWrite, parseMemoryFacts } from './memory-parse'
export type { MemoryFact } from './memory-parse'

export async function handleMemory(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; items?: MemoryItem[] }> {
  if (VERGISS_ALL.test(text)) {
    await clearMemory()
    return { handled: true, reply: 'Alles über Sie ist weg.' }
  }
  const forget = VERGISS.exec(text)
  if (forget) {
    const q = forget[1].trim().toLowerCase()
    const items = await listMemory()
    const hit = items.find(
      (m) => m.key.toLowerCase() === q || m.value.toLowerCase().includes(q),
    )
    if (hit) {
      await deleteMemory(hit.id)
      return { handled: true, reply: `Vergessen: ${hit.key}.` }
    }
    return { handled: true, reply: 'Dazu lag nichts.' }
  }
  if (isMemoryWrite(text)) {
    const facts = parseMemoryFacts(text)
    if (facts.length) {
      const saved = []
      for (const f of facts) {
        saved.push(await upsertMemory(f.key, f.value, f.category, conversationId))
      }
      const bits = saved.map((s) => s.value).join(', ')
      return { handled: true, reply: `${bits} — liegt.`, items: saved }
    }
  }
  if (isMemoryRecall(text)) {
    const items = await listMemory()
    if (RECALL_DRINK.test(text)) {
      const d = items.find((m) => m.key === 'getränk')
      return {
        handled: true,
        reply: d ? `Sie trinken ${d.value}.` : 'Kein Getränk gespeichert.',
      }
    }
    if (RECALL_FOOD.test(text)) {
      const d = items.find((m) => m.key === 'essen')
      return {
        handled: true,
        reply: d ? `Sie essen ${d.value}.` : 'Kein Essen gespeichert.',
      }
    }
    if (RECALL_NAME.test(text)) {
      const d = items.find((m) => m.key === 'name')
      return {
        handled: true,
        reply: d ? `Sie heißen ${d.value}.` : 'Kein Name gespeichert.',
      }
    }
    if (RECALL_VAGUE.test(text)) {
      const drink = items.find((m) => m.key === 'getränk')
      const food = items.find((m) => m.key === 'essen')
      if (!drink && !food) {
        return { handled: true, reply: 'Dazu liegt nichts — Getränk oder Essen?' }
      }
      const bits = [drink && `Getränk: ${drink.value}`, food && `Essen: ${food.value}`]
        .filter(Boolean)
        .join('; ')
      return { handled: true, reply: bits }
    }
    if (!items.length) return { handled: true, reply: 'Noch nichts gespeichert.' }
    return {
      handled: true,
      reply: items.map((m) => `${m.key}: ${m.value}`).join('\n'),
    }
  }
  if (isIdentityAsk(text)) {
    const items = await listMemory()
    const name = items.find((m) => m.key === 'name')
    if (name) {
      return { handled: true, reply: `Ich bin Jarvis. Sie heißen ${name.value}.` }
    }
    return {
      handled: true,
      reply: 'Ich bin Jarvis, privater Assistent. Einen Namen von Ihnen habe ich noch nicht.',
    }
  }
  return { handled: false }
}

export function memoryBlock(items: MemoryItem[]): string {
  if (!items.length) return ''
  return (
    'Langzeitgedächtnis:\n' +
    items.slice(0, 8).map((m) => `- ${m.key}: ${m.value}`).join('\n')
  )
}
