export type SpotifyIntent =
  | { kind: 'play'; query: string }
  | { kind: 'pause' }
  | { kind: 'resume' }
  | { kind: 'next' }
  | { kind: 'prev' }
  | { kind: 'volume_set'; level: number }
  | { kind: 'volume_up'; steps: number }
  | { kind: 'volume_down'; steps: number }

export type SpotifySource = 'internal' | 'connect' | 'preview'

export function spotifySourceLabel(source?: SpotifySource | null): string {
  if (source === 'internal') return 'in Jarvis'
  if (source === 'preview') return '30s-Vorschau'
  if (source === 'connect') return 'anderes Gerät'
  return ''
}

function stripSpotifyPrefix(text: string): string {
  return text
    .trim()
    .replace(/^\s*spotify\s*[:\-–]?\s+/i, '')
    .replace(/\s+auf\s+spotify\s*[.!?]*$/i, '')
    .trim()
}

function clampLevel(n: number): number {
  return Math.max(1, Math.min(100, Math.round(n)))
}

function clampSteps(n: number): number {
  return Math.max(1, Math.min(30, Math.round(n)))
}

export function parseSpotifyIntent(text: string): SpotifyIntent | null {
  const t = stripSpotifyPrefix(text)
  if (/^\s*(?:zeig(?:e)?|öffne)\s+spotify\s*[.!?]*$/i.test(text.trim())) return { kind: 'resume' }
  const setVol = /(?:lautstärke|volume)\s*(?:auf\s*)?(\d{1,3})\b/i.exec(t)
  if (setVol) return { kind: 'volume_set', level: clampLevel(Number(setVol[1])) }
  const upN = /\blauter\s+um\s+(\d{1,3})\b|\b(\d{1,3})\s+lauter\b/i.exec(t)
  if (upN) return { kind: 'volume_up', steps: clampSteps(Number(upN[1] || upN[2])) }
  const downN = /\bleiser\s+um\s+(\d{1,3})\b|\b(\d{1,3})\s+leiser\b/i.exec(t)
  if (downN) return { kind: 'volume_down', steps: clampSteps(Number(downN[1] || downN[2])) }
  if (/^\s*lauter\s*[.!?]*$/i.test(t)) return { kind: 'volume_up', steps: 1 }
  if (/^\s*leiser\s*[.!?]*$/i.test(t)) return { kind: 'volume_down', steps: 1 }
  if (/^\s*(pause|pausier(?:e)?(?:n)?|stopp(?:e)?(?:\s+die)?\s*musik|musik\s+(?:aus|pause))\s*[.!?]*$/i.test(t)) {
    return { kind: 'pause' }
  }
  if (/^\s*(weiter\s*spielen|play|musik\s+an|weiterhören)\s*[.!?]*$/i.test(t)) {
    return { kind: 'resume' }
  }
  if (/^\s*(weiter|nächste[rs]?|skip|nächster\s+(?:song|titel))\s*[.!?]*$/i.test(t)) {
    return { kind: 'next' }
  }
  if (/^\s*(zurück|vorherige[rs]?|letzter\s+(?:song|titel))\s*[.!?]*$/i.test(t)) {
    return { kind: 'prev' }
  }
  const play = /^\s*(?:spiel(?:e)?(?:\s+mal)?|play)\s+(?:musik\s+)?(?:von\s+)?(.+?)\s*$/i.exec(t)
  if (play?.[1]) {
    const query = play[1].replace(/[.!?]+$/, '').trim()
    if (/^(das|es|musik|was|das\s+hier)$/i.test(query)) return { kind: 'resume' }
    if (/^(?:was|etwas|irgendwas|irgendetwas)\s+(?:nettes|schönes|gutes|liebes)\b/i.test(query)) {
      return null
    }
    return { kind: 'play', query }
  }
  return null
}
