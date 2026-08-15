export type TvAction = 'on' | 'off' | 'volume_up' | 'volume_down' | 'mute' | 'hdmi1' | 'hdmi2' | 'hdmi3' | 'hdmi4'

export type TvIntent = { action: TvAction }

export const TV_ANCHOR = /\b(fernseher|fernseh|tv|tizen|samsung)\b/i
export const TV_FOLLOWUP_MS = 120_000
export const TV_FOLLOWUP_ONLY =
  /^\s*(lauter|leiser|stumm|aus|an|hdmi\s*\d|quelle\s*\d|nochmal|noch\s*mal)[\s.!?]*$/i

export function parseTvIntent(text: string, followUp = false): TvIntent | null {
  const t = text.trim()
  const hasAnchor = TV_ANCHOR.test(t)
  if (!hasAnchor && !followUp) return null

  const hdmi = /(?:hdmi|quelle|eingang|input)\s*(?:auf\s*)?(\d)/i.exec(t)
  if (hdmi) {
    const n = Number(hdmi[1])
    if (n >= 1 && n <= 4) return { action: `hdmi${n}` as TvAction }
  }
  if (/\b(stumm|mute|ton\s+aus)\b/i.test(t)) return { action: 'mute' }
  if (/\b(lauter|lautstärke\s*(?:hoch|rauf|plus)|\+)\b/i.test(t)) return { action: 'volume_up' }
  if (/\b(leiser|lautstärke\s*(?:runter|runterdrehen|minus))\b/i.test(t)) return { action: 'volume_down' }
  if (/\b(aus(?:schalten)?|ausmachen|standby)\b/i.test(t)) return { action: 'off' }
  if (/\b(an(?:schalten)?|anmachen|ein(?:schalten)?|wecken|aufwecken)\b/i.test(t)) {
    return { action: 'on' }
  }
  return null
}

export function isFollowUpPhrase(text: string): boolean {
  return TV_FOLLOWUP_ONLY.test(text)
}
