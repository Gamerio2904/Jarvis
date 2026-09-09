export class AgentTimeout extends Error {
  constructor(ms: number) {
    super(`Zeit überschritten (${ms} ms)`)
    this.name = 'AgentTimeout'
  }
}

/**
 * Ein Handler ohne eigenes Abbruchsignal läuft nach dem Budget weiter — wir
 * warten nur nicht mehr auf ihn. Der Timer wird aufgeräumt, damit ein schneller
 * Zug nicht bis zum Budget offen bleibt.
 */
export async function withBudget<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new AgentTimeout(ms)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
