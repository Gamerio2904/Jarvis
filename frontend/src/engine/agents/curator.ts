import { pushAgentTrace } from './trace-store.ts'
import { writeMemory, type WriteMemoryInput } from '../memory-gate.ts'
import { pruneStaleMemory, tickSleepMemory } from '../sleep-memory.ts'

export async function curatorPreflight(_conversationId: string, text: string): Promise<{ ok: boolean; detail?: string }> {
  const t0 = performance.now()
  try {
    await tickSleepMemory()
    await pruneStaleMemory()
    pushAgentTrace({
      agentId: 'curator',
      phase: 'curator',
      ms: Math.round(performance.now() - t0),
      ok: true,
      detail: text.slice(0, 40) || 'preflight',
    })
    return { ok: true }
  } catch (err) {
    pushAgentTrace({
      agentId: 'curator',
      phase: 'curator',
      ms: Math.round(performance.now() - t0),
      ok: false,
      detail: err instanceof Error ? err.message : 'preflight fail',
    })
    return { ok: false }
  }
}

/** Single write gate — wraps memory-gate (Sprint 230). */
export async function curatorReviewWrite(
  input: WriteMemoryInput,
): Promise<Awaited<ReturnType<typeof writeMemory>>> {
  const t0 = performance.now()
  const result = await writeMemory(input)
  pushAgentTrace({
    agentId: 'curator',
    phase: 'curator',
    ms: Math.round(performance.now() - t0),
    ok: result.stored,
    detail: result.action,
  })
  return result
}
