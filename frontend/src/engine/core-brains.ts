export const CORE_IDS = ['gemini', 'groq', 'local'] as const
export type CoreId = (typeof CORE_IDS)[number]

export type CoreSphere = {
  id: CoreId
  label: string
  line: string
}

export const CORE_SPHERES: readonly CoreSphere[] = [
  { id: 'gemini', label: 'Gemini', line: 'Google. Suche und Bild bleiben hier, wenn die Rolle an ist.' },
  { id: 'groq', label: 'Groq', line: 'Schnelle Cloud-Antwort.' },
  { id: 'local', label: 'Lokal', line: '0,5B auf dem Gerät, ohne Server.' },
]

export function isCoreId(value: string): value is CoreId {
  return (CORE_IDS as readonly string[]).includes(value)
}

/** Reihenfolge, in der geantwortet wird. Die erste bereite Kugel gewinnt. */
export function corePriorityOrder(primary: string): CoreId[] {
  if (primary === 'groq') return ['groq', 'gemini', 'local']
  if (primary === 'local') return ['local', 'gemini', 'groq']
  return ['gemini', 'groq', 'local']
}

export function frontIndex(yaw: number, count = CORE_SPHERES.length): number {
  const step = (Math.PI * 2) / count
  let best = 0
  let bestAbs = Infinity
  for (let i = 0; i < count; i += 1) {
    let delta = i * step + yaw
    delta = ((delta + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI
    const abs = Math.abs(delta)
    if (abs < bestAbs) {
      bestAbs = abs
      best = i
    }
  }
  return best
}

/** Yaw, der die Kugel `index` nach vorn dreht, nah an `from`. */
export function yawForIndex(index: number, count: number, from: number): number {
  const step = (Math.PI * 2) / count
  const target = -index * step
  let delta = target - from
  delta = ((delta + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI
  return from + delta
}
