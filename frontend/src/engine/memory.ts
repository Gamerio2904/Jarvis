import { listMemory, upsertMemory, clearMemory, deleteMemory, type MemoryItem } from './store'

const MERK = /^\s*(?:merk(?:e)?\s*dir|erinner(?:e)?\s*dich(?:\s*an)?)\s*(?:bitte\s*)?[:\-]?\s*(.+)$/is
const VERGISS_ALL =
  /^\s*(?:vergiss|lösch(?:e)?)\s+(?:bitte\s+)?(alles(?:\s+über\s+mich)?|meine\s+erinnerungen)\s*[.!]?\s*$/is
const VERGISS = /^\s*(?:vergiss|lösch(?:e)?\s*(?:die\s*)?erinnerung(?:\s*an)?)\s*[:\-]?\s*(.+)$/is
const RECALL =
  /^\s*(?:wie\s+heiß(?:e|t)\s+ich|wer\s+bin\s+ich|was\s+trinke\s+ich|was\s+esse\s+ich|was\s+weißt\s+du\s+über\s+mich)\s*[?]?\s*$/is

function factsFrom(text: string): Array<{ key: string; value: string; category: string }> {
  const out: Array<{ key: string; value: string; category: string }> = []
  const name = /\bich\s+heiß(?:e|t)\s+([A-ZÄÖÜ][\wÄÖÜäöüß\-]+)/i.exec(text)
  if (name) out.push({ key: 'name', value: name[1], category: 'fact' })
  const drink = /\b(?:trinke|trink)\s+(.+?)(?=\s+\bund\b|[,.!?]|$)/i.exec(text)
  if (drink) out.push({ key: 'getränk', value: drink[1].trim(), category: 'pref' })
  const food = /\b(?:esse|iss)\s+(.+?)(?=\s+\bund\b|[,.!?]|$)/i.exec(text)
  if (food) out.push({ key: 'essen', value: food[1].trim(), category: 'pref' })
  const rest = MERK.exec(text)
  if (rest && !out.length) {
    const value = rest[1].trim()
    if (value.length >= 2) out.push({ key: 'notiz', value, category: 'fact' })
  }
  return out
}

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
  if (MERK.test(text) || /\bich\s+heiß/i.test(text) && /\btrinke|\besse\b/i.test(text)) {
    const facts = factsFrom(text)
    if (facts.length) {
      const saved = []
      for (const f of facts) {
        saved.push(await upsertMemory(f.key, f.value, f.category, conversationId))
      }
      const bits = saved.map((s) => `${s.key}=${s.value}`).join(', ')
      return { handled: true, reply: `Notiert: ${bits}.`, items: saved }
    }
  }
  if (RECALL.test(text) || /\bwas\s+trinke\s+ich\b/i.test(text) || /\bwas\s+esse\s+ich\b/i.test(text)) {
    const items = await listMemory()
    if (/\btrinke\b/i.test(text)) {
      const d = items.find((m) => m.key === 'getränk')
      return {
        handled: true,
        reply: d ? `Sie trinken ${d.value}.` : 'Kein Getränk gespeichert.',
      }
    }
    if (/\besse\b/i.test(text)) {
      const d = items.find((m) => m.key === 'essen')
      return {
        handled: true,
        reply: d ? `Sie essen ${d.value}.` : 'Kein Essen gespeichert.',
      }
    }
    if (/\bheiß\b|\bwer\s+bin\b/i.test(text)) {
      const d = items.find((m) => m.key === 'name')
      return {
        handled: true,
        reply: d ? `Sie heißen ${d.value}.` : 'Kein Name gespeichert.',
      }
    }
    if (!items.length) return { handled: true, reply: 'Noch nichts gespeichert.' }
    return {
      handled: true,
      reply: items.map((m) => `${m.key}: ${m.value}`).join('\n'),
    }
  }
  return { handled: false }
}

export function memoryBlock(items: MemoryItem[]): string {
  if (!items.length) return ''
  return (
    'Langzeitgedächtnis:\n' +
    items.slice(0, 12).map((m) => `- ${m.key}: ${m.value}`).join('\n')
  )
}
