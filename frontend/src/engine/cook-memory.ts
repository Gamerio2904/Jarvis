import { deleteMemory, listMemory, upsertMemory } from './store.ts'
import { splitSpiceNames } from './spice-alias.ts'

export const SPICE_KEY = 'gewuerze'

export function parseSpiceValue(raw: string): string[] {
  return splitSpiceNames(raw)
}

export async function readSpicePin(): Promise<string[]> {
  const items = await listMemory()
  const hit = items.find((m) => m.key === SPICE_KEY)
  return hit ? parseSpiceValue(hit.value) : []
}

export async function writeSpicePin(
  names: string[],
  opts: { merge?: boolean; conversationId?: string; origin?: 'user' | 'tool' },
): Promise<string[]> {
  const prev = opts.merge ? await readSpicePin() : []
  const next = splitSpiceNames([...prev, ...names].join(', '))
  if (!next.length) return prev
  await upsertMemory(SPICE_KEY, next.join(', '), 'fact', opts.conversationId, {
    origin: opts.origin || 'user',
    expires_at: null,
    kind: 'fact',
  })
  return next
}

export async function forgetSpicePin(): Promise<boolean> {
  const items = await listMemory()
  const hit = items.find((m) => m.key === SPICE_KEY)
  if (!hit) return false
  await deleteMemory(hit.id)
  return true
}
