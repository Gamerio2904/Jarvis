import { agentById } from './catalog.ts'
import { pushAgentTrace } from './trace-store.ts'
import type { RouteCtx } from '../route-types.ts'
import type { AgentResult, AgentTrace } from './types.ts'

export async function agentDispatch(id: string, ctx: RouteCtx): Promise<AgentResult> {
  const t0 = performance.now()
  const agent = agentById(id)
  if (!agent?.execute) {
    const trace: AgentTrace = {
      agentId: id,
      phase: 'execute',
      ms: Math.round(performance.now() - t0),
      ok: false,
      detail: 'no execute',
    }
    pushAgentTrace(trace)
    return { handled: false, internal: [trace] }
  }
  try {
    const hit = await agent.execute(ctx)
    const ms = Math.round(performance.now() - t0)
    const trace: AgentTrace = {
      agentId: id,
      phase: 'execute',
      ms,
      ok: Boolean(hit?.reply),
      detail: hit?.lastTool || id,
    }
    pushAgentTrace(trace)
    if (!hit?.reply && !hit?.retry) return { handled: false, internal: [trace] }
    return {
      handled: true,
      reply: hit.reply,
      userFacts: hit.reply,
      tool: hit.tool ?? undefined,
      research: hit.research,
      lastTool: hit.lastTool || id,
      retry: hit.retry,
      internal: [trace],
    }
  } catch (err) {
    const trace: AgentTrace = {
      agentId: id,
      phase: 'execute',
      ms: Math.round(performance.now() - t0),
      ok: false,
      detail: err instanceof Error ? err.message : 'error',
    }
    pushAgentTrace(trace)
    return { handled: false, internal: [trace] }
  }
}
