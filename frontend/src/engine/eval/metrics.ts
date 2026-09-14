/**
 * Kennzahlen eines Eval-Laufs.
 *
 * Wichtig für die Abgrenzung: `latency.ts` misst den **echten Zug** auf dem
 * Gerät, das hier misst die **Routing-Entscheidung** offline. Beide Zahlen
 * heißen „p95" und bedeuten Verschiedenes — im Bericht stehen sie deshalb
 * getrennt benannt.
 */
import { percentile } from '../percentile.ts'
import { decisionForEval, routeForEval } from './route-eval.ts'
import type { EvalCase, EvalTag } from './types.ts'

export type Confusion = { want: string; got: string; n: number }

export type RouteMetrics = {
  total: number
  hits: number
  /** Erwarteter Agent gewählt. Darf nicht sinken. */
  hitRate: number
  /** `pick.kind === 'ask'` — Jarvis fragt zurück, statt zu handeln. */
  askRate: number
  /** Kein Kandidat über der Schwelle. */
  noneRate: number
  /** Entscheidungszeit je Fall in Millisekunden. */
  p50: number
  p95: number
  confusions: Confusion[]
}

export function measure(cases: EvalCase[]): RouteMetrics {
  const times: number[] = []
  const confusion = new Map<string, Confusion>()
  let hits = 0
  let asks = 0
  let nones = 0

  for (const c of cases) {
    const t0 = performance.now()
    const got = routeForEval(c.text)
    times.push(performance.now() - t0)

    if (got === c.expect) hits += 1
    else {
      const key = `${c.expect}→${got}`
      const seen = confusion.get(key)
      if (seen) seen.n += 1
      else confusion.set(key, { want: c.expect, got, n: 1 })
    }

    const pick = decisionForEval(c.text)
    if (pick.kind === 'ask') asks += 1
    if (pick.kind === 'none') nones += 1
  }

  const n = cases.length || 1
  return {
    total: cases.length,
    hits,
    hitRate: hits / n,
    askRate: asks / n,
    noneRate: nones / n,
    p50: percentile(times, 0.5) ?? 0,
    p95: percentile(times, 0.95) ?? 0,
    confusions: [...confusion.values()].sort((a, b) => b.n - a.n),
  }
}

export function measureByTag(cases: EvalCase[], tags: EvalTag[]): Record<string, RouteMetrics> {
  const out: Record<string, RouteMetrics> = {}
  for (const tag of tags) {
    const group = cases.filter((c) => c.tags.includes(tag))
    if (group.length) out[tag] = measure(group)
  }
  return out
}
