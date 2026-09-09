import { routingAgents } from './agents/parse-catalog.ts'
import { applyConflicts } from './conflicts.ts'
import { isFollowish, pickPolicy, withCost, withPrior, type PolicyPick } from './policy.ts'
import type { Candidate, RouteCtx } from './route-types.ts'
import { promoteSplitPart, splitIntents } from './split-intents.ts'

export function propose(ctx: RouteCtx): Candidate[] {
  const raw: Candidate[] = []
  for (const agent of routingAgents()) {
    try {
      const n = agent.parse!(ctx)
      if (n != null) raw.push({ id: agent.id, score: n, sideEffect: agent.sideEffect })
    } catch {
      /* ein Parser darf Routing nicht kippen */
    }
  }
  return withCost(withPrior(applyConflicts(raw, ctx.text, ctx), ctx.lastTool, isFollowish(ctx.text)))
}

export type RouteDecision = { pick: PolicyPick; candidates: Candidate[] }

/** Die eine Routing-Entscheidung. Director und Tests lesen dieselbe Quelle. */
export function decideRouteFromCtx(ctx: RouteCtx): RouteDecision {
  const candidates = propose(ctx)
  return { pick: pickPolicy(candidates), candidates }
}

/** Führender Agent einer Entscheidung — eine Rückfrage nennt ihre erste Seite. */
function leadOf(pick: PolicyPick): string | null {
  if (pick.kind === 'run') return pick.id
  if (pick.kind === 'ask') return pick.a
  return null
}

/**
 * Entscheidung für den ganzen Satz, sonst für den letzten Teilsatz.
 * `wont` bricht sofort ab — eine Absage gilt für die ganze Äußerung.
 */
export function decideRoute(ctx: RouteCtx): PolicyPick {
  const whole = decideRouteFromCtx(ctx).pick
  if (leadOf(whole) === 'wont') return whole
  const parts = splitIntents(ctx.text)
  if (parts.length > 1) {
    let last: PolicyPick | null = null
    for (const raw of parts) {
      const { pick } = decideRouteFromCtx({ ...ctx, text: promoteSplitPart(raw) })
      if (leadOf(pick)) last = pick
    }
    if (last) return last
  }
  return whole
}

export function pickRouteFromCtx(ctx: RouteCtx): string | null {
  return leadOf(decideRoute(ctx))
}

export function pickRoute(text: string): string | null {
  return pickRouteFromCtx({
    conversationId: 'test',
    text,
    lastTool: '',
    lastMedium: '',
    inDrive: false,
  })
}
