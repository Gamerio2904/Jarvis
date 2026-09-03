import { isGeminiConfigured, listMemory, deleteMemory } from './store.ts'
import { loadWorkingMemory } from './working-memory.ts'
import { confidenceFor, expiresFor, pruneMemoryItems } from './memory-layer.ts'
import { writeMemory } from './memory-gate.ts'

let lastSleep = 0
let lastPrune = 0

function safeFact(line: string): { key: string; value: string } | null {
  const t = line.replace(/\s+/g, ' ').trim()
  if (t.length < 8 || t.length > 80) return null
  if (/\b(hallo|witz|ok|danke|spotify|blitzer)\b/i.test(t)) return null
  const name = /(?:heiße|name ist)\s+([A-ZÄÖÜ][\wÄÖÜäöüß-]{1,20})/i.exec(t)
  if (name) return { key: 'name', value: name[1] }
  return null
}

export async function pruneStaleMemory(now = Date.now()): Promise<number> {
  const items = await listMemory()
  const { drop } = pruneMemoryItems(items, now)
  for (const row of drop) await deleteMemory(row.id)
  return drop.length
}

export async function tickSleepMemory(opts?: { drive?: boolean; voice?: boolean }): Promise<void> {
  if (opts?.drive || opts?.voice) return
  const now = Date.now()
  if (now - lastPrune > 2 * 60 * 1000) {
    lastPrune = now
    await pruneStaleMemory(now)
  }
  if (now - lastSleep < 12 * 60 * 1000) return
  lastSleep = now
  if (isGeminiConfigured()) return
  const mem = await listMemory()
  const keys = new Set(mem.map((m) => m.key))
  for (const row of loadWorkingMemory()) {
    const fact = safeFact(row.line)
    if (!fact || keys.has(fact.key)) continue
    await writeMemory({
      key: fact.key,
      value: fact.value,
      category: 'fact',
      origin: 'sleep',
      confidence: confidenceFor('sleep', 'fact'),
      expires_at: expiresFor('sleep', 'fact', now),
    })
    keys.add(fact.key)
  }
}
