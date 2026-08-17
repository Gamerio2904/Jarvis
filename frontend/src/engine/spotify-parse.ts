export type SpotifyIntent =
  | { kind: 'play'; query: string }
  | { kind: 'pause' }
  | { kind: 'resume' }
  | { kind: 'next' }
  | { kind: 'prev' }

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

export function parseSpotifyIntent(text: string): SpotifyIntent | null {
  const t = stripSpotifyPrefix(text)
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
    return { kind: 'play', query }
  }
  return null
}
