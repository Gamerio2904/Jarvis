/**
 * Perzentil über eine Messreihe.
 *
 * Stand vorher nur in `latency.ts` fest auf p95 verdrahtet. Die Eval braucht
 * dieselbe Rechnung für p50 und p95 — dieselbe Rechnung, nicht eine zweite.
 */
export function percentile(values: number[], p: number): number | null {
  const vals = values.filter((n) => Number.isFinite(n))
  if (!vals.length) return null
  const s = [...vals].sort((a, b) => a - b)
  const i = Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))
  return s[i]
}
