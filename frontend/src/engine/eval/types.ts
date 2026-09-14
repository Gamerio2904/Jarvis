/**
 * Ein Fall des Bewertungs-Korpus.
 *
 * Der Korpus ist zugleich ein Datensatz aus Äußerung und erwarteter Absicht —
 * siehe `docs/69-modell-grundlagen.md` §1.6. Deshalb trägt jeder Fall seine
 * Herkunft, damit ein Fund zurückverfolgbar bleibt.
 */
export type EvalTag = 'gold' | 'lock' | 'stt' | 'regress'

export type EvalCase = {
  text: string
  /** Erwarteter Agent, oder null für „soll ans Modell fallen". */
  expect: string
  /** Für Kennzahlen je Gruppe. */
  tags: EvalTag[]
  /** Woher der Fall stammt. */
  source: string
}

/** Gruppen, die hart grün sein müssen. `stt` wird gemessen, nicht erzwungen. */
export const HARD_TAGS: EvalTag[] = ['gold', 'lock', 'regress']
