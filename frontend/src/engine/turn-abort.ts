/**
 * Ein Zug, ein Abbruchsignal.
 *
 * Bisher schnitt `withBudget` nur das **Warten** ab: der Handler lief weiter,
 * sein `fetch` lief weiter, und auf dem Weg konnte er noch Zustand schreiben,
 * den der neue Zug dann erbte. Hier hängt alles an einem Controller, den
 * `beginAgentTurn()` beim Start des nächsten Zuges auslöst.
 *
 * Bewusst als Umgebungszustand und nicht als Parameter durch 63 Executoren:
 * Die Kette reißt sonst an der ersten Stelle, die das Durchreichen vergisst,
 * und das merkt niemand. Ein Modul, das `postJson` benutzt, ist so
 * automatisch abbrechbar.
 */
let controller: AbortController | null = null

/** Bricht den vorigen Zug ab und öffnet einen neuen. */
export function beginTurnAbort(): AbortSignal {
  controller?.abort(new DOMException('Neuer Zug', 'AbortError'))
  controller = new AbortController()
  return controller.signal
}

/** Barge-in: reden bricht nicht nur die Stimme ab, sondern auch die Arbeit. */
export function abortCurrentTurn(reason = 'Abgebrochen'): void {
  controller?.abort(new DOMException(reason, 'AbortError'))
}

export function currentTurnSignal(): AbortSignal | undefined {
  return controller?.signal
}

export function isTurnAborted(): boolean {
  return Boolean(controller?.signal.aborted)
}

export function abortError(): DOMException {
  return new DOMException('Neuer Zug', 'AbortError')
}

/** Abbruch, nicht Netzfehler — sonst landet Barge-in als „Chat fehlgeschlagen“. */
export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const name = (err as { name?: string }).name
  return name === 'AbortError' || name === 'AgentAborted'
}

/** Wartet, bricht aber ab wenn der Zug stirbt — 429-Backoff darf nicht überleben. */
export function waitTurn(ms: number): Promise<void> {
  const signal = currentTurnSignal()
  if (signal?.aborted) return Promise.reject(abortError())
  if (!signal) {
    return new Promise((resolve) => {
      globalThis.setTimeout(resolve, ms)
    })
  }
  return new Promise((resolve, reject) => {
    const t = globalThis.setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      globalThis.clearTimeout(t)
      reject(abortError())
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Native CapacitorHttp kennt kein AbortSignal. Wir hören trotzdem auf und
 * verwerfen das Ergebnis, sobald der Zug tot ist.
 */
export async function raceTurn<T>(work: Promise<T>): Promise<T> {
  const signal = currentTurnSignal()
  if (signal?.aborted) throw abortError()
  if (!signal) return work
  let onAbort: (() => void) | undefined
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        onAbort = () => reject(abortError())
        signal.addEventListener('abort', onAbort, { once: true })
      }),
    ])
  } finally {
    if (onAbort) signal.removeEventListener('abort', onAbort)
  }
}

/**
 * Kombiniert das Zug-Signal mit einem lokalen. `AbortSignal.any` gibt es in
 * Node 20+ und in allen WebViews, die die App unterstützt.
 */
export function withTurnSignal(local?: AbortSignal): AbortSignal | undefined {
  const turn = currentTurnSignal()
  if (!turn) return local
  if (!local) return turn
  return AbortSignal.any([turn, local])
}

/** Nur für Tests. */
export function resetTurnAbort(): void {
  controller = null
}
