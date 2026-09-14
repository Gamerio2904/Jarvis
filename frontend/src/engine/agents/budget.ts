export class AgentTimeout extends Error {
  constructor(ms: number) {
    super(`Zeit überschritten (${ms} ms)`)
    this.name = 'AgentTimeout'
  }
}

/**
 * Abgebrochen, nicht gescheitert. Der Unterschied zählt: ein abgebrochener
 * Zug darf weder wiederholt werden noch die Sicherung belasten — er war
 * nicht kaputt, er war nur nicht mehr gewollt.
 */
export class AgentAborted extends Error {
  constructor() {
    super('Zug abgebrochen')
    this.name = 'AgentAborted'
  }
}

/**
 * Ein Handler ohne eigenes Abbruchsignal läuft nach dem Budget weiter — wir
 * warten nur nicht mehr auf ihn. Der Timer wird aufgeräumt, damit ein schneller
 * Zug nicht bis zum Budget offen bleibt.
 */
export async function withBudget<T>(work: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  let onAbort: (() => void) | undefined
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new AgentTimeout(ms)), ms)
        if (!signal) return
        if (signal.aborted) {
          reject(new AgentAborted())
          return
        }
        onAbort = () => reject(new AgentAborted())
        signal.addEventListener('abort', onAbort, { once: true })
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
    if (onAbort && signal) signal.removeEventListener('abort', onAbort)
  }
}
