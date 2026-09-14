/**
 * Sicherungsschalter je Agent.
 *
 * Ohne ihn wartet der Nutzer bei einem dauerhaft kaputten Dienst in **jedem**
 * Zug das volle Lese-Budget ab (25 s) plus einen Wiederholversuch. Das Budget
 * aus 16.1.0 hat das Hängen begrenzt, nicht das Wiederholen des Aussichtslosen.
 *
 * ```text
 * zu       →  3 Fehlschläge in Folge
 * offen    →  sofortige Absage, 60 s
 * halb     →  nach 60 s genau ein Versuch
 *             Erfolg → Zähler auf 0, zu
 *             Fehler → wieder 60 s offen
 * ```
 *
 * Ein Erfolg löscht die Geschichte vollständig — ein Dienst, der wieder läuft,
 * soll nicht nachtragend behandelt werden.
 */
export const BREAKER_FAILS = 3
export const BREAKER_OPEN_MS = 60_000

export type BreakerState = 'zu' | 'offen' | 'halb'

type Entry = { fails: number; openUntil: number }

const entries = new Map<string, Entry>()

function entry(id: string): Entry {
  let e = entries.get(id)
  if (!e) {
    e = { fails: 0, openUntil: 0 }
    entries.set(id, e)
  }
  return e
}

export function breakerState(id: string, now = Date.now()): BreakerState {
  const e = entries.get(id)
  if (!e || e.fails < BREAKER_FAILS) return 'zu'
  return now < e.openUntil ? 'offen' : 'halb'
}

/**
 * Darf der Agent laufen? Im Halbmond gibt das **einen** Versuch frei und
 * sperrt sofort wieder — sonst rennen zwei gleichzeitige Züge beide los.
 */
export function breakerAllows(id: string, now = Date.now()): boolean {
  const state = breakerState(id, now)
  if (state === 'zu') return true
  if (state === 'offen') return false
  entry(id).openUntil = now + BREAKER_OPEN_MS
  return true
}

export function breakerSuccess(id: string): void {
  entries.delete(id)
}

export function breakerFailure(id: string, now = Date.now()): void {
  const e = entry(id)
  e.fails += 1
  if (e.fails >= BREAKER_FAILS) e.openUntil = now + BREAKER_OPEN_MS
}

/** Nur für Tests und den Neustart eines Gesprächs. */
export function resetBreakers(): void {
  entries.clear()
}

/** Was der Debug-Bogen zeigt: nur die Agenten, die gerade auffällig sind. */
export function breakerSnapshot(now = Date.now()): Array<{ id: string; state: BreakerState; fails: number }> {
  const out: Array<{ id: string; state: BreakerState; fails: number }> = []
  for (const [id, e] of entries) {
    if (!e.fails) continue
    out.push({ id, state: breakerState(id, now), fails: e.fails })
  }
  return out.sort((a, b) => b.fails - a.fails)
}
