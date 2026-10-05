import { agentDispatch } from './bus.ts'
import type { RouteCtx } from '../route-types.ts'
import type { AgentResult } from './types.ts'

/** Thin wrapper: handleX → AgentResult (Sprint 228). */
export async function runAgent(id: string, ctx: RouteCtx): Promise<AgentResult> {
  return agentDispatch(id, ctx)
}
