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
  | 'play'
  | 'pause'
  | 'next'
  | 'prev'
  | 'home'
  | 'back'
  | 'ok'
  | 'up'
  | 'down'
  | 'left'
  | 'right'

export type TvIntent = { action: TvAction; steps?: number; level?: number; via?: 'tv' | 'fire' }

export const TV_ANCHOR = /\b(fernseher|fernseh|\btv\b|tizen|samsung)\b/i
export const FIRE_ANCHOR =
  /\b(?:fire[\s-]*tv|fire[\s-]*stick|amazon[\s-]*fire(?:[\s-]*tv|[\s-]*stick)?|amazon[\s-]*stick)\b/i
export const TV_FOLLOWUP_MS = 120_000
export const TV_FOLLOWUP_ONLY =
  /^\s*(lauter|leiser|stumm|aus|an|hdmi\s*\d|quelle\s*\d|nochmal|noch\s*mal|lautstärke\s*(?:auf\s*)?\d{1,3}|lauter\s+um\s+\d{1,3}|leiser\s+um\s+\d{1,3}|\d{1,3}|pause|play|weiter|zurück|home|ok)\s*[.!?]*$/i

const VOL_WORD = /\b(lautstärke|volume)\b/i
const RELATIVE = /\b(?:lauter|leiser)\s+um\s+\d{1,3}\b/i

function clampLevel(n: number): number {
  return Math.max(1, Math.min(100, Math.round(n)))
}

function clampSteps(n: number): number {
  return Math.max(1, Math.min(100, Math.round(n)))
}

function fireAction(t: string): TvAction | null {
  if (/\b(pause|pausier)\b/i.test(t)) return 'pause'
  if (/\b(play|spiel(?:en)?|weiter\s*spielen)\b/i.test(t) && !/\bspiel(?:e)?\s+\w/i.test(t)) return 'play'
  if (/\b(nächste[rs]?|weiter|skip)\b/i.test(t)) return 'next'
  if (/\b(vorherige[rs]?|zurückspulen)\b/i.test(t)) return 'prev'
  if (/\b(home|startseite|start)\b/i.test(t)) return 'home'
  if (/\b(zurück|back)\b/i.test(t)) return 'back'
  if (/\b(ok|enter|auswählen|select)\b/i.test(t)) return 'ok'
  if (/\b(hoch|rauf|oben)\b/i.test(t)) return 'up'
  if (/\b(runter|unten)\b/i.test(t)) return 'down'
  if (/\blinks\b/i.test(t)) return 'left'
  if (/\brechts\b/i.test(t)) return 'right'
  if (/\b(aus(?:schalten)?|ausmachen|standby|schlaf)\b/i.test(t)) return 'off'
  if (/\b(an(?:schalten)?|anmachen|ein(?:schalten)?|wecken)\b/i.test(t)) return 'on'
  return null
}

export function parseTvIntent(text: string, followUp = false): TvIntent | null {
  const t = text.trim()
  const fire = FIRE_ANCHOR.test(t)
  const hasAnchor = TV_ANCHOR.test(t) || fire
  const volish = VOL_WORD.test(t) || RELATIVE.test(t)
  if (!hasAnchor && !followUp && !volish) return null

  const via: 'tv' | 'fire' | undefined = fire ? 'fire' : undefined

  const set =
    /(?:lautstärke|volume)\s*(?:auf\s*)?(\d{1,3})\b/i.exec(t) ||
    (followUp ? /^\s*(?:auf\s*)?(\d{1,3})\s*(?:%|prozent)?\s*[.!?]*$/i.exec(t) : null)
  if (set) return { action: 'volume_set', level: clampLevel(Number(set[1])), via }

  const upN = /\blauter\s+um\s+(\d{1,3})\b|\b(\d{1,3})\s+lauter\b/i.exec(t)
  if (upN) return { action: 'volume_up', steps: clampSteps(Number(upN[1] || upN[2])), via }

  const downN = /\bleiser\s+um\s+(\d{1,3})\b|\b(\d{1,3})\s+leiser\b/i.exec(t)
  if (downN) return { action: 'volume_down', steps: clampSteps(Number(downN[1] || downN[2])), via }

  const hdmi = /(?:hdmi|quelle|eingang|input)\s*(?:auf\s*)?(\d)/i.exec(t)
  if (hdmi) {
    const n = Number(hdmi[1])
    if (n >= 1 && n <= 4) return { action: `hdmi${n}` as TvAction, via }
  }
  if (/\b(stumm|mute|ton\s+aus)\b/i.test(t)) return { action: 'mute', via }
  if (/\b(lauter|lautstärke\s*(?:hoch|rauf|plus)|\+)\b/i.test(t)) return { action: 'volume_up', steps: 1, via }
  if (/\b(leiser|lautstärke\s*(?:runter|runterdrehen|minus))\b/i.test(t)) {
    return { action: 'volume_down', steps: 1, via }
  }

  if (fire) {
    const fa = fireAction(t)
    if (fa) return { action: fa, via: 'fire' }
    return { action: 'on', via: 'fire' }
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
