/**
 * Ein Zug, ein Abbruchsignal.
 *
 * Bisher schnitt `withBudget` nur das **Warten** ab: der Handler lief weiter,
 * sein `fetch` lief weiter, und auf dem Weg konnte er noch Zustand schreiben,
 * den der neue Zug dann erbte. Hier hängt alles an einem Controller, den
 * `beginAgentTurn()` beim Start des nächsten Zuges auslöst.
 *
 * Bewusst als Umgebungszustand und nicht als Parameter durch 59 Executoren:
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
