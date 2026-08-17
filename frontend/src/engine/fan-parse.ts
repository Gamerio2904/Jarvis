export type FanAction = 'on' | 'off' | 'speed' | 'light_on' | 'light_off' | 'faster' | 'slower'

export type FanIntent = { action: FanAction; speed?: number }

export const FAN_FOLLOWUP_MS = 120_000
export const FAN_ANCHOR = /\b(ventilator|deckenventilator|l[uü]fter|fan)\b/i
export const FAN_FOLLOWUP_ONLY =
  /^\s*(an|aus|licht(?:\s+(?:an|aus))?|stufe\s*[1-6]|schneller|langsamer|lauter|leiser)\s*[.!?]*$/i

export function parseFanIntent(text: string, followUp = false): FanIntent | null {
  const t = text.trim()
  if (!t || t.length > 160) return null
  const has = FAN_ANCHOR.test(t)
  if (!has && !followUp) return null
  if (!has && followUp && !FAN_FOLLOWUP_ONLY.test(t)) return null

  const speed = /(?:stufe|level|speed)\s*([1-6])\b/i.exec(t) || /(?:^|\s)([1-6])\s*(?:stufe)?\s*[.!?]*$/i.exec(t)
  if (speed && (has || followUp || /stufe/i.test(t))) {
    return { action: 'speed', speed: Number(speed[1]) }
  }
  if (/\blicht\b/i.test(t)) {
    if (/\b(aus|ausmachen|aus(?:schalten)?)\b/i.test(t)) return { action: 'light_off' }
    return { action: 'light_on' }
  }
  if (/\b(schneller|höher|mehr\s+luft)\b/i.test(t)) return { action: 'faster' }
  if (/\b(langsamer|leiser|weniger\s+luft)\b/i.test(t) && !/\bfernseher\b/i.test(t)) {
    return { action: 'slower' }
  }
  if (/\b(aus(?:schalten)?|ausmachen|stopp)\b/i.test(t)) return { action: 'off' }
  if (/\b(an(?:schalten)?|anmachen|ein(?:schalten)?|start)\b/i.test(t)) return { action: 'on' }
  if (has && !followUp) return { action: 'on' }
  return null
}

export function isFanFollowUpPhrase(text: string): boolean {
  return FAN_FOLLOWUP_ONLY.test(text)
}
