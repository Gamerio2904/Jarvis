import { listMemory, deleteMemory } from './store.ts'
import { loadWorkingMemory } from './working-memory.ts'
import { confidenceFor, expiresFor, pruneMemoryItems } from './memory-layer.ts'
import { writeMemory } from './memory-gate.ts'

let lastSleep = 0
let lastPrune = 0
let lastEpisode = 0

function safeFact(line: string): { key: string; value: string; category: string } | null {
  const t = line.replace(/\s+/g, ' ').trim()
  if (t.length < 8 || t.length > 80) return null
  if (/\b(hallo|witz|ok|danke|spotify|blitzer)\b/i.test(t)) return null
  if (/\b(?:heute|gestern)\b/.test(t) && /\b(?:nudel|pizza|essen|gegessen)\b/.test(t)) return null
  const name = /(?:heiße|name ist)\s+([A-ZÄÖÜ][\wÄÖÜäöüß-]{1,20})/i.exec(t)
  if (name) return { key: 'name', value: name[1], category: 'fact' }
  const drink = /(?:trinke?\s+(?:ich\s+)?gerne|mag\s+ich(?:\s+gerne)?)\s+([A-Za-zÄÖÜäöüß-]{2,24})/i.exec(t)
  if (drink && !/\b(?:essen|pizza|nudel)\b/i.test(drink[1])) {
    return { key: 'getränk', value: drink[1], category: 'pref' }
  }
  const place = /wohne\s+in\s+([A-ZÄÖÜ][\wÄÖÜäöüß\s-]{2,40})/i.exec(t)
  if (place) return { key: 'zuhause', value: place[1].trim(), category: 'place' }
  return null
}

export function resetSleepTick(): void {
  lastSleep = 0
  lastPrune = 0
  lastEpisode = 0
}

export async function pruneStaleMemory(now = Date.now()): Promise<number> {
  const items = await listMemory()
  const { drop } = pruneMemoryItems(items, now)
  for (const row of drop) await deleteMemory(row.id)
  return drop.length
}

export async function tickEpisodeMemory(): Promise<void> {
  const now = Date.now()
  if (now - lastEpisode < 12 * 60 * 60 * 1000) return
  const lines = loadWorkingMemory()
    .map((r) => r.line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length >= 8 && !/^\s*gefunden:/i.test(line) && (line.match(/:\s/g) || []).length < 4)
  if (!lines.length) return
  lastEpisode = now
  const value = lines.slice(0, 3).join('; ').slice(0, 120)
  await writeMemory({
    key: 'episode:heute',
    value,
    category: 'fact',
    kind: 'event',
    origin: 'sleep',
    spoken: value,
    confidence: confidenceFor('sleep', 'fact'),
    expires_at: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
  })
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
  const mem = await listMemory()
  const keys = new Set(mem.map((m) => m.key))
  for (const row of loadWorkingMemory()) {
    const fact = safeFact(row.line)
    if (!fact || keys.has(fact.key)) continue
    await writeMemory({
      key: fact.key,
      value: fact.value,
      category: fact.category,
      origin: 'sleep',
      confidence: confidenceFor('sleep', fact.category),
      expires_at: expiresFor('sleep', fact.category, now),
    })
    keys.add(fact.key)
  }
}
