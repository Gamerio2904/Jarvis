/**
 * Ein abgelehntes Versprechen ist nicht dasselbe wie eine Zeitüberschreitung.
 * Beides auf denselben Rückfallwert zu legen hat einen fehlenden Plugin-Aufruf
 * jahrelang als „Gerät antwortet nicht" getarnt — und die Nutzer auf die Suche
 * nach einem Netzproblem geschickt, das es nicht gab. Wer den Unterschied
 * braucht, gibt `onReject` mit.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
  onReject?: (err: unknown) => T,
): Promise<T> {
  return new Promise((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      resolve(fallback)
    }, ms)
    promise.then(
      (value) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(onReject ? onReject(err) : fallback)
      },
    )
  })
}
