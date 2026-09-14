/**
 * Die Routing-Kette, wie sie `chat.ts` durchläuft — an einer Stelle, damit
 * Testskripte nicht je eine eigene Kopie pflegen (die dann abdriftet).
 *
 * Reihenfolge wie in `chat.ts`: Hilfe → Rabatt → Ordinal → Register-Score →
 * Live-Nachschlag → Modell.
 */
import { isHelpCommand } from '../guards.ts'
import { normalizeUtterance } from '../utterance.ts'
import { parseOrdinalFollowUp } from '../ordinal.ts'
import { isLiveLookup, parseShopDiscountIntent } from '../research-parse.ts'
import { decideRoute } from '../route-pick.ts'
import type { PolicyPick } from '../policy.ts'
import type { RouteCtx } from '../route-types.ts'
import type { WeatherLast } from '../weather-parse.ts'

export type EvalCtx = { weatherLast?: WeatherLast | null; lastTool?: string; inDrive?: boolean }

/** Agenten-Kennungen, die außerhalb des Registers entschieden werden. */
export const PRE_ROUTER = new Set(['help', 'discount', 'ordinal', 'llm', 'research'])

export function routeCtx(text: string, ctx: EvalCtx = {}): RouteCtx {
  return {
    conversationId: 'test',
    text: normalizeUtterance(text),
    lastTool: ctx.lastTool ?? '',
    lastMedium: '',
    inDrive: ctx.inDrive ?? false,
    weatherLast: ctx.weatherLast ?? null,
  }
}

/** Der Agent, der den Zug übernimmt. `todo` und `tools` sind derselbe Agent. */
export function routeForEval(text: string, ctx: EvalCtx = {}): string {
  const norm = normalizeUtterance(text)
  if (!norm.trim()) return 'llm'
  if (isHelpCommand(norm)) return 'help'
  if (parseShopDiscountIntent(norm)) return 'discount'
  if (parseOrdinalFollowUp(norm)) return 'ordinal'
  const pick = decideRoute(routeCtx(text, ctx))
  const id = pick.kind === 'run' ? pick.id : pick.kind === 'ask' ? pick.a : null
  if (id === 'todo') return 'tools'
  if (id) return id
  if (isLiveLookup(norm)) return 'research'
  return 'llm'
}

/** Die Entscheidung selbst — nur so wird eine Rückfrage sichtbar. */
export function decisionForEval(text: string, ctx: EvalCtx = {}): PolicyPick {
  return decideRoute(routeCtx(text, ctx))
}
