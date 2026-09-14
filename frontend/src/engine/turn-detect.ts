/**
 * Satzende aus dem Transkript, nicht aus der Stille-Dauer.
 *
 * Bis 16.6.0 galt Länge als Beleg für Vollständigkeit: `words.length >= 6`
 * oder `t.length >= 24`. Das drehte das Verhalten in **beide** Richtungen
 * falsch. „Licht an" (zwei Wörter) wartete 1100 ms — der häufigste Kurzbefehl
 * am längsten. „Erinnere mich morgen früh um acht" (sechs Wörter) galt als
 * fertiger Satz und ging nach 220 ms weg, also fiel „… an den Zahnarzt" weg.
 *
 * Länge sagt nichts über Vollständigkeit. Belege sind: ein Satzzeichen, ein
 * `isFinal` der Erkennung, oder eine Grammatik, die nicht weitergehen kann.
 */

const INCOMPLETE_TAIL =
  /\b(?:und|oder|aber|weil|dass|daß|also|dann|wenn|ob|mit|von|zu|für|nach|als|wie|der|die|das|ein|eine|einen|einem|ich|wir|man|noch|um|bis|seit|ohne|gegen|durch|vor|über|unter|neben|beim|zur|zum|vom|im|am|dem|des|einer|eines|mein|meine|meinen|meiner|sehr|ganz|mal|auch|nur|schon|damit|obwohl|während|bevor|nachdem|falls|sodass|weder|entweder)\s*$/i

const COMPLETE_END = /[.!?…]$/

/**
 * Grammatik, die zu Ende ist: Gerät plus Schaltwort, und das Schaltwort steht
 * am Satzende. Es kann nichts folgen, also wartet auch nichts.
 *
 * Bewusst eine kleine Liste und **nicht** der Router: „Erinnere mich morgen"
 * trifft einen Parser, ist aber offensichtlich nicht fertig. Ein Parser-Treffer
 * belegt eine erkannte Absicht, keine abgeschlossene Äußerung.
 */
const CLOSED_COMMAND = new RegExp(
  '^(?:(?:das|der|die|den|mein|meine)\\s+)?' +
    '(?:licht|lampe|lampen|fernseher|tv|ventilator|steckdose|steckdosen|taschenlampe|' +
    'kugel|weltkugel|körper|koerper|erde|lage|hirn|auge|musik|radio|spotify|netflix|carplay|fahrmodus|overlay)\\s+' +
    '(?:an|aus|ein|einschalten|ausschalten|anmachen|ausmachen|hoch|runter|lauter|leiser|stopp|stop)' +
    '[.!?]*$',
  'i',
)

/** Einzelne Steuerwörter, die für sich vollständig sind. */
const CLOSED_SINGLE = /^(?:stopp|stop|halt|weiter|pause|abbrechen|lauter|leiser|zurück|hilfe)[.!?]*$/i

const BACKCHANNEL =
  /^(?:m+h+m+|mhm+|aha+|ach\s*so|ok+|okay|genau|ja\s*ja|hm+|hmm+|äh+m*|ähm+|oh)\.?!?$/i

export const SILENCE_COMPLETE_MS = 220
/**
 * Die Mittelstufe. Vorher gab es nur die Wahl zwischen 220 und 1100 ms, und
 * jede Fehlentscheidung kostete deshalb das Maximum in die falsche Richtung.
 */
export const SILENCE_UNSURE_MS = 600
export const SILENCE_HOLD_MS = 800
export const SILENCE_HOLD_VOICE_MS = 1100
export const BARGE_ONSET_MS = 180
export const BARGE_IGNORE_TTS_MS = 400

export type TurnHints = {
  /** Die Erkennung hat den Satz selbst als abgeschlossen gemeldet. */
  isFinal?: boolean
}

export type Completeness = 'complete' | 'unsure' | 'incomplete'

export function turnCompleteness(text: string, hints: TurnHints = {}): Completeness {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  if (!t) return 'incomplete'
  /** Ein hängendes Satzende gewinnt auch gegen `isFinal` — dort irrt die Erkennung. */
  if (INCOMPLETE_TAIL.test(t)) return 'incomplete'
  if (COMPLETE_END.test(t) && t.length >= 4) return 'complete'
  if (CLOSED_SINGLE.test(t) || CLOSED_COMMAND.test(t)) return 'complete'
  if (hints.isFinal) return 'complete'
  return 'unsure'
}

export function turnLooksComplete(text: string, hints: TurnHints = {}): boolean {
  return turnCompleteness(text, hints) === 'complete'
}

export function silenceMsFor(text: string, voiceMode = false, hints: TurnHints = {}): number {
  const level = turnCompleteness(text, hints)
  if (level === 'complete') return SILENCE_COMPLETE_MS
  if (level === 'unsure') return SILENCE_UNSURE_MS
  return voiceMode ? SILENCE_HOLD_VOICE_MS : SILENCE_HOLD_MS
}

export function isBackchannel(text: string): boolean {
  const t = (text || '').replace(/\s+/g, ' ').trim().toLowerCase()
  if (!t) return false
  return BACKCHANNEL.test(t)
}

/** User speech over TTS: ignore backchannels, keep real barge-in. */
export function isBargeInText(text: string): boolean {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  if (!t || isBackchannel(t)) return false
  const words = t.split(/\s+/).filter(Boolean)
  return words.length >= 2 || t.length >= 8
}

export function truncateSpoken(full: string, spoken: string): string {
  const s = (spoken || '').replace(/\s+/g, ' ').trim()
  const f = (full || '').replace(/\s+/g, ' ').trim()
  if (!s) return ''
  if (!f) return s
  if (f.startsWith(s)) return s
  if (s.startsWith(f)) return f
  return s
}
