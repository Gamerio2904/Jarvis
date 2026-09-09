import { agentById } from './catalog.ts'
import { AgentTimeout, withBudget } from './budget.ts'
import { currentAgentTurn, pushAgentTrace } from './trace-store.ts'
import type { RouteCtx, SideEffect } from '../route-types.ts'
import type { AgentResult, AgentTrace, RouteHit } from './types.ts'

/**
 * Budget pro Agent. Lesen geht ins Netz und darf länger dauern, Schreiben läuft
 * lokal, Geräte warten auf eine Native-Brücke. Ohne Budget hängt ein Zug am
 * stillen Socket, und der Nutzer sieht nur den Spinner.
 */
const BUDGET_MS: Record<SideEffect, number> = {
  read: 25_000,
  write: 8_000,
  device: 15_000,
}

const RETRY_DELAY_MS = 400

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : 'Fehler'
}

/** Nur Lesen darf wiederholt werden — ein zweiter Schreib-Lauf legt Termine doppelt an. */
function mayRetry(sideEffect: SideEffect, err: unknown): boolean {
  if (sideEffect !== 'read') return false
  return err instanceof AgentTimeout || err instanceof Error
}

export async function agentDispatch(id: string, ctx: RouteCtx): Promise<AgentResult> {
  const t0 = performance.now()
  const myTurn = currentAgentTurn()
  const agent = agentById(id)
  const trace = (ok: boolean, detail: string, attempt = 1): AgentTrace => {
    const t: AgentTrace = {
      agentId: id,
      phase: 'execute',
      ms: Math.round(performance.now() - t0),
      ok,
      detail: attempt > 1 ? `${detail} (Versuch ${attempt})` : detail,
    }
    pushAgentTrace(t, myTurn)
    return t
  }

  if (!agent?.execute) {
    return { handled: false, internal: [trace(false, 'no execute')] }
  }

  const budget = BUDGET_MS[agent.sideEffect] ?? BUDGET_MS.read
  const attempts = agent.sideEffect === 'read' ? 2 : 1
  let lastTrace: AgentTrace | null = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const hit = await withBudget(Promise.resolve(agent.execute(ctx)), budget)
      const t = trace(Boolean(hit?.reply), hit?.lastTool || id, attempt)
      if (!hit?.reply && !hit?.retry) return { handled: false, internal: [t] }
      return {
        handled: true,
        reply: hit.reply,
        userFacts: hit.reply,
        tool: hit.tool ?? undefined,
        research: hit.research,
        lastTool: hit.lastTool || id,
        retry: hit.retry,
        internal: [t],
      }
    } catch (err) {
      lastTrace = trace(false, messageOf(err), attempt)
      if (attempt >= attempts || !mayRetry(agent.sideEffect, err)) break
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
    }
  }

  return { handled: false, internal: lastTrace ? [lastTrace] : [] }
}

export type { RouteHit }
