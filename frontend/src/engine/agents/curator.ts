import { currentAgentTurn, pushAgentTrace } from './trace-store.ts'
import { withBudget } from './budget.ts'
import { writeMemory, type WriteMemoryInput } from '../memory-gate.ts'
import { pruneStaleMemory, tickSleepMemory } from '../sleep-memory.ts'

/** Aufräumen darf den Zug nicht aufhalten — es ist Pflege, keine Antwort. */
const PREFLIGHT_MS = 2_500

export async function curatorPreflight(_conversationId: string, text: string): Promise<{ ok: boolean; detail?: string }> {
  const t0 = performance.now()
  const myTurn = currentAgentTurn()
  try {
    await withBudget(
      (async () => {
        await tickSleepMemory()
        await pruneStaleMemory()
      })(),
      PREFLIGHT_MS,
    )
    pushAgentTrace({
      agentId: 'curator',
      phase: 'curator',
      ms: Math.round(performance.now() - t0),
      ok: true,
      detail: text.slice(0, 40) || 'preflight',
    }, myTurn)
    return { ok: true }
  } catch (err) {
    pushAgentTrace({
      agentId: 'curator',
      phase: 'curator',
      ms: Math.round(performance.now() - t0),
      ok: false,
      detail: err instanceof Error ? err.message : 'preflight fail',
    }, myTurn)
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
