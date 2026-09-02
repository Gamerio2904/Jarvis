/** Smart-Turn loop without ONNX: completeness from the transcript, not silence length. */

const INCOMPLETE_TAIL =
  /\b(?:und|oder|aber|weil|dass|daß|also|dann|wenn|ob|mit|von|zu|für|nach|als|wie|der|die|das|ein|eine|einen|einem|ich|wir|man|noch)\s*$/i

const COMPLETE_END = /[.!?…]$/

const BACKCHANNEL =
  /^(?:m+h+m+|mhm+|aha+|ach\s*so|ok+|okay|genau|ja\s*ja|hm+|hmm+|äh+m*|ähm+|oh)\.?!?$/i

export const SILENCE_COMPLETE_MS = 220
export const SILENCE_HOLD_MS = 800
export const BARGE_ONSET_MS = 180
export const BARGE_IGNORE_TTS_MS = 400

export function turnLooksComplete(text: string): boolean {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  if (!t) return false
  if (INCOMPLETE_TAIL.test(t)) return false
  if (COMPLETE_END.test(t) && t.length >= 4) return true
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length < 2) return false
  if (words.length >= 6) return true
  return t.length >= 24
}

export function silenceMsFor(text: string): number {
  return turnLooksComplete(text) ? SILENCE_COMPLETE_MS : SILENCE_HOLD_MS
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
