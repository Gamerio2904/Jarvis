import { normalizeUtterance } from './utterance.ts'

export type SkyIntent = { kind: 'iss' | 'moon' }

export function moonLine(now = new Date()): string {
  const known = Date.UTC(2000, 0, 6, 18, 14)
  const age = ((now.getTime() - known) / 86400000 / 29.530588) % 1
  const t = age < 0 ? age + 1 : age
  let phase = 'zunehmende Sichel'
  if (t < 0.03 || t > 0.97) phase = 'Neumond'
  else if (t < 0.22) phase = 'zunehmende Sichel'
  else if (t < 0.28) phase = 'zunehmender Halbmond'
  else if (t < 0.47) phase = 'zunehmender Mond'
  else if (t < 0.53) phase = 'Vollmond'
  else if (t < 0.72) phase = 'abnehmender Mond'
  else if (t < 0.78) phase = 'abnehmender Halbmond'
  else phase = 'abnehmende Sichel'
  return `Mondphase heute: ${phase}. Lokal gerechnet, keine Amtstabelle.`
}

export function parseSkyIntent(text: string): SkyIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 140) return null
  if (/\b(iss|raumstation|international\s+space\s+station)\b/i.test(t)) return { kind: 'iss' }
  if (/\b(mondphase|mond|vollmond|neumond|zunehmend|abnehmend)\b/i.test(t) && !/\b(wetter|unwetter)\b/i.test(t)) {
    return { kind: 'moon' }
  }
  return null
}
