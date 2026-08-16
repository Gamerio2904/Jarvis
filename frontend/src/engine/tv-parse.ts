export type TvAction =
  | 'on'
  | 'off'
  | 'volume_up'
  | 'volume_down'
  | 'volume_set'
  | 'mute'
  | 'hdmi1'
  | 'hdmi2'
  | 'hdmi3'
  | 'hdmi4'

export type TvIntent = { action: TvAction; steps?: number; level?: number }

export const TV_ANCHOR = /\b(fernseher|fernseh|tv|tizen|samsung)\b/i
export const TV_FOLLOWUP_MS = 120_000
export const TV_FOLLOWUP_ONLY =
  /^\s*(lauter|leiser|stumm|aus|an|hdmi\s*\d|quelle\s*\d|nochmal|noch\s*mal|lautstärke\s*(?:auf\s*)?\d{1,3}|lauter\s+um\s+\d{1,3}|leiser\s+um\s+\d{1,3}|\d{1,3})\s*[.!?]*$/i

const VOL_WORD = /\b(lautstärke|volume)\b/i
const RELATIVE = /\b(?:lauter|leiser)\s+um\s+\d{1,3}\b/i

function clampLevel(n: number): number {
  return Math.max(1, Math.min(100, Math.round(n)))
}

function clampSteps(n: number): number {
  return Math.max(1, Math.min(100, Math.round(n)))
}

export function parseTvIntent(text: string, followUp = false): TvIntent | null {
  const t = text.trim()
  const hasAnchor = TV_ANCHOR.test(t)
  const volish = VOL_WORD.test(t) || RELATIVE.test(t)
  if (!hasAnchor && !followUp && !volish) return null

  const set =
    /(?:lautstärke|volume)\s*(?:auf\s*)?(\d{1,3})\b/i.exec(t) ||
    (followUp ? /^\s*(?:auf\s*)?(\d{1,3})\s*(?:%|prozent)?\s*[.!?]*$/i.exec(t) : null)
  if (set) return { action: 'volume_set', level: clampLevel(Number(set[1])) }

  const upN = /\blauter\s+um\s+(\d{1,3})\b|\b(\d{1,3})\s+lauter\b/i.exec(t)
  if (upN) return { action: 'volume_up', steps: clampSteps(Number(upN[1] || upN[2])) }

  const downN = /\bleiser\s+um\s+(\d{1,3})\b|\b(\d{1,3})\s+leiser\b/i.exec(t)
  if (downN) return { action: 'volume_down', steps: clampSteps(Number(downN[1] || downN[2])) }

  const hdmi = /(?:hdmi|quelle|eingang|input)\s*(?:auf\s*)?(\d)/i.exec(t)
  if (hdmi) {
    const n = Number(hdmi[1])
    if (n >= 1 && n <= 4) return { action: `hdmi${n}` as TvAction }
  }
  if (/\b(stumm|mute|ton\s+aus)\b/i.test(t)) return { action: 'mute' }
  if (/\b(lauter|lautstärke\s*(?:hoch|rauf|plus)|\+)\b/i.test(t)) return { action: 'volume_up', steps: 1 }
  if (/\b(leiser|lautstärke\s*(?:runter|runterdrehen|minus))\b/i.test(t)) {
    return { action: 'volume_down', steps: 1 }
  }
  if (/\b(aus(?:schalten)?|ausmachen|standby)\b/i.test(t)) return { action: 'off' }
  if (/\b(an(?:schalten)?|anmachen|ein(?:schalten)?|wecken|aufwecken)\b/i.test(t)) {
    return { action: 'on' }
  }
  return null
}

export function isFollowUpPhrase(text: string): boolean {
  return TV_FOLLOWUP_ONLY.test(text)
}
