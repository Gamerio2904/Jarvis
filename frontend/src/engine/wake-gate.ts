/** Wake: Partial und Final dürfen VoiceMode nicht zweimal öffnen. */

export type WakeGate = { lastAt: number; open: boolean }

export const WAKE_DEBOUNCE_MS = 1400

export function acceptWake(gate: WakeGate, _utterance = '', now = Date.now()): WakeGate | null {
  if (gate.open) return null
  if (now - gate.lastAt < WAKE_DEBOUNCE_MS) return null
  return { lastAt: now, open: true }
}

export function closeWake(gate: WakeGate): WakeGate {
  return { lastAt: gate.lastAt, open: false }
}
