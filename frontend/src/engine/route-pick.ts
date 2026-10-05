import { routingAgents } from './agents/parse-catalog.ts'
import { applyConflicts } from './conflicts.ts'
import { isFollowish, pickPolicy, withCost, withPrior } from './policy.ts'
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

function pickOneFromCtx(ctx: RouteCtx): string | null {
  const pick = pickPolicy(propose(ctx))
  if (pick.kind === 'run') return pick.id
  if (pick.kind === 'ask') return pick.a
  return null
}

export function pickRouteFromCtx(ctx: RouteCtx): string | null {
  const whole = pickOneFromCtx(ctx)
  if (whole === 'wont') return 'wont'
  const parts = splitIntents(ctx.text)
  if (parts.length > 1) {
    let last: string | null = null
    for (const raw of parts) {
      const id = pickOneFromCtx({ ...ctx, text: promoteSplitPart(raw) })
      if (id) last = id
    }
    if (last) return last
  }
  return whole
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
