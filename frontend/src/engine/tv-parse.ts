import { type TvAppId } from './tv-apps.ts'

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

export type { TvAppId }

export type TvWatchIntent =
  | { kind: 'open'; app: TvAppId }
  | { kind: 'play'; title: string; app?: TvAppId; content?: 'movie' | 'show' | 'video' }

export const TV_ANCHOR = /\b(fernseher|fernseh|\btv\b|tizen|samsung)\b/i
export const FIRE_ANCHOR =
  /\b(?:fire[\s-]*tv|fire[\s-]*stick|amazon[\s-]*fire(?:[\s-]*tv|[\s-]*stick)?|amazon[\s-]*stick)\b/i
export const TV_FOLLOWUP_MS = 120_000
export const TV_FOLLOWUP_ONLY =
  /^\s*(lauter|leiser|stumm|aus|an|hdmi\s*\d|quelle\s*\d|nochmal|noch\s*mal|lautstärke\s*(?:auf\s*)?\d{1,3}|lauter\s+um\s+\d{1,3}|leiser\s+um\s+\d{1,3}|\d{1,3}|pause|play|weiter|zurück|home|ok|enter|bestätigen|runter|hoch|oben|unten|links|rechts)\s*[.!?]*$/i

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
  if (/\b(ok|okay|enter|auswählen|select|bestätigen)\b/i.test(t)) return 'ok'
  if (/\b(hoch|rauf|oben)\b/i.test(t)) return 'up'
  if (/\b(runter|unten)\b/i.test(t)) return 'down'
  if (/\blinks\b/i.test(t)) return 'left'
  if (/\brechts\b/i.test(t)) return 'right'
  if (/\b(aus(?:schalten)?|ausmachen|standby|schlaf)\b/i.test(t)) return 'off'
  if (/\b(an(?:schalten)?|anmachen|ein(?:schalten)?|wecken)\b/i.test(t)) return 'on'
  return null
}

const APP_PAT: Array<[TvAppId, RegExp]> = [
  ['youtube', /\b(?:you\s*tube|youtube|\byt\b)\b/i],
  ['netflix', /\bnetflix\b/i],
  ['disney', /\bdisney(?:\s*(?:\+|plus))?\b/i],
  ['prime', /\b(?:amazon(?:\s*prime(?:\s*video)?)?|prime(?:\s*video)?)\b/i],
]

const VERB =
  /^(?:öffne|starte?|zeig(?:e)?|spiel(?:e)?|schau(?:e)?n?|mach(?:e)?|such(?:e)?|find(?:e)?)\s+(?:mal\s+)?(?:bitte\s+)?(?:die\s+|den\s+|das\s+)?/i

export function parseTvApp(text: string): TvAppId | null {
  if (FIRE_ANCHOR.test(text)) return null
  for (const [id, re] of APP_PAT) {
    if (re.test(text)) return id
  }
  return null
}

function stripWatchTitle(raw: string): string {
  return raw
    .replace(/\b(?:am|auf\s+dem|auf)\s+(?:fernseher|tv|samsung|tizen)\b/gi, ' ')
    .replace(/\b(?:auf\s+)?(?:you\s*tube|youtube|\byt\b|netflix|disney(?:\s*(?:\+|plus))?|amazon(?:\s*prime(?:\s*video)?)?|prime(?:\s*video)?)\b/gi, ' ')
    .replace(/\b(?:filme?|movies?|serien?|folge|apps?|ganzer?|stream(?:en)?|videos?|clips?|shorts?|kanal|channel)\b/gi, ' ')
    .replace(/\s+\bab\s*$/i, '')
    .replace(/\b(?:an|aus|anmachen|ausmachen|starten|öffnen)\s*$/i, '')
    .replace(/^(?:den|die|das|der|mal|bitte|ein(?:e[sn]?)?|eines|einer)\s+(?:der\s+|von\s+(?:den\s+)?)?/i, '')
    .replace(/^(?:den|die|das|der|mal|bitte)\s+/i, '')
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export type TvWatchCtx = { followUp?: boolean; lastApp?: TvAppId }

export function parseTvWatch(text: string, ctx?: TvWatchCtx | boolean): TvWatchIntent | null {
  const followUp = typeof ctx === 'boolean' ? ctx : Boolean(ctx?.followUp)
  const lastApp = typeof ctx === 'object' ? ctx?.lastApp : undefined
  const t = text.trim().replace(/[.!?]+$/g, '')
  if (!t || /\bspotify\b/i.test(t)) return null
  if (FIRE_ANCHOR.test(t)) return null

  const named = parseTvApp(t)
  const app = named || (followUp ? lastApp : undefined) || null
  const tvCue = TV_ANCHOR.test(t) || /\bam\s+fernseher\b|\bauf\s+dem\s+(?:tv|fernseher)\b/i.test(t)
  const filmCue = /\b(?:filme?|movies?)\b/i.test(t)
  const showCue = /\b(?:serien?|folge)\b/i.test(t)
  const appCue = /\bapps?\b/i.test(t)
  const videoCue = /\b(?:videos?|clips?|shorts?|kanal|channel)\b/i.test(t)
  const playAb = /\bab\s*$/i.test(t)
  const openVerb = /^(?:öffne|starte?|zeig(?:e)?|mach(?:e)?)\b/i.test(t)
  const playVerb = /^(?:spiel(?:e)?|schau(?:e)?n?)\b/i.test(t)
  const searchVerb = /^(?:such(?:e)?|find(?:e)?)\b/i.test(t)
  const rest = stripWatchTitle(t.replace(VERB, ''))
  const content =
    showCue ? 'show' as const : filmCue ? 'movie' as const : videoCue || app === 'youtube' ? 'video' as const : undefined

  if (app && rest.length >= 2 && (openVerb || playVerb || searchVerb)) {
    return { kind: 'play', title: rest, app, content: content || (app === 'youtube' ? 'video' : undefined) }
  }
  if (
    app &&
    (openVerb ||
      (playVerb && !rest) ||
      (tvCue && !playVerb && !rest) ||
      (/\ban\b/i.test(t) && !rest && !/\baus\b/i.test(t)))
  ) {
    return { kind: 'open', app }
  }
  if (
    playVerb &&
    rest.length >= 2 &&
    (filmCue || showCue || appCue || tvCue || videoCue || (followUp && playAb))
  ) {
    return {
      kind: 'play',
      title: rest,
      app: app || undefined,
      content:
        content ||
        (followUp && lastApp === 'youtube' && !filmCue ? 'video' : undefined),
    }
  }
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

  const pad = fireAction(t)
  if (pad && pad !== 'on' && pad !== 'off' && (followUp || hasAnchor || fire)) {
    return { action: pad, via: fire ? 'fire' : via }
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
