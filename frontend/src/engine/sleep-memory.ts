import { isGeminiConfigured, listMemory, upsertMemory } from './store.ts'
import { loadWorkingMemory } from './working-memory.ts'

let lastSleep = 0

function safeFact(line: string): { key: string; value: string } | null {
  const t = line.replace(/\s+/g, ' ').trim()
  if (t.length < 8 || t.length > 80) return null
  if (/\b(hallo|witz|ok|danke|spotify|blitzer)\b/i.test(t)) return null
  const name = /(?:heiße|name ist)\s+([A-ZÄÖÜ][\wÄÖÜäöüß-]{1,20})/i.exec(t)
  if (name) return { key: 'name', value: name[1] }
  return null
}

export async function tickSleepMemory(opts?: { drive?: boolean; voice?: boolean }): Promise<void> {
  if (opts?.drive || opts?.voice) return
  if (Date.now() - lastSleep < 12 * 60 * 1000) return
  lastSleep = Date.now()
  if (isGeminiConfigured()) return
  const mem = await listMemory()
  const keys = new Set(mem.map((m) => m.key))
  for (const row of loadWorkingMemory()) {
    const fact = safeFact(row.line)
    if (!fact || keys.has(fact.key)) continue
    await upsertMemory(fact.key, fact.value, 'fact')
    keys.add(fact.key)
  }
}
