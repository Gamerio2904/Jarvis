export type BrainKind = 'gemini' | 'groq' | 'local' | 'none'

export function pickBrain(flags: { gemini: boolean; groq: boolean; local: boolean }): BrainKind {
  if (flags.gemini) return 'gemini'
  if (flags.groq) return 'groq'
  if (flags.local) return 'local'
  return 'none'
}
