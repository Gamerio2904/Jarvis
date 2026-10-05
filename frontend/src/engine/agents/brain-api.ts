import { listMemory } from '../store.ts'
import { retrieve } from '../retrieve.ts'
import { curatorReviewWrite } from './curator.ts'
import type { WriteMemoryInput } from '../memory-gate.ts'

export type BrainReadOpts = {
  agentId: string
  cap?: number
}

export async function brainRead(query: string, opts: BrainReadOpts): Promise<string> {
  const hits = await retrieve(query)
  if (!hits.length) return ''
  return hits
    .slice(0, opts.cap ?? 5)
    .map((h) => `${h.title}: ${h.body}`)
    .join('\n')
}

export async function brainProposeWrite(
  input: WriteMemoryInput,
  _opts: { agentId: string },
): Promise<Awaited<ReturnType<typeof curatorReviewWrite>>> {
  return curatorReviewWrite({ ...input, origin: input.origin || 'user' })
}

export async function brainWorking(note: string, _opts: { agentId: string }): Promise<void> {
  const { noteTurn } = await import('../working-memory.ts')
  noteTurn('assistant', note)
}

export async function brainMemoryCount(): Promise<number> {
  return (await listMemory()).length
}
