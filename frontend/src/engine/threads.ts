/** Same sampling as 0.13.1 — quality-neutral. Caps at 4 threads. */
export function inferThreadCount(cores = defaultCoreCount()): number {
  return Math.min(4, Math.max(2, cores - 1))
}

export function defaultCoreCount(): number {
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
    return navigator.hardwareConcurrency
  }
  return 2
}
