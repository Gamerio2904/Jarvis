/** Schreibtisch-Blick. Nicht Wetter-Ort, nicht Hotel. */

export type DeskIntent = { on: boolean }

const ON =
  /^\s*(?:schau(?:e)?\s+auf\s+den\s+tisch|tisch(?:blick)?\s+an|schreibtisch\s+an|desk\s+(?:view\s+)?an|schau\s+auf\s+den\s+schreibtisch)\s*[.!]?\s*$/i

const OFF =
  /^\s*(?:tisch(?:blick)?\s+aus|schreibtisch\s+aus|desk\s+(?:view\s+)?aus|hör\s+auf\s+zu\s+schauen)\s*[.!]?\s*$/i

export function parseDeskIntent(text: string): DeskIntent | null {
  const t = text.trim()
  if (!t || t.length > 120) return null
  if (/\b(?:wetter|hotel|zimmertemperatur|ort)\b/i.test(t)) return null
  if (ON.test(t)) return { on: true }
  if (OFF.test(t)) return { on: false }
  return null
}
