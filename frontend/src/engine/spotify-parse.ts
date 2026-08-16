export type SpotifyIntent =
  | { kind: 'play'; query: string }
  | { kind: 'pause' }
  | { kind: 'resume' }
  | { kind: 'next' }
  | { kind: 'prev' }

export function parseSpotifyIntent(text: string): SpotifyIntent | null {
  const t = text.trim()
  if (/^\s*(pause|pausier(?:e)?(?:n)?|stopp(?:e)?(?:\s+die)?\s*musik|musik\s+(?:aus|pause))\s*[.!?]*$/i.test(t)) {
    return { kind: 'pause' }
  }
  if (/^\s*(weiter\s*spielen|play|musik\s+an|weiterhören)\s*[.!?]*$/i.test(t)) {
    return { kind: 'resume' }
  }
  if (/^\s*(weiter|nächste[rs]?|skip|nächster\s+song)\s*[.!?]*$/i.test(t)) {
    return { kind: 'next' }
  }
  if (/^\s*(zurück|vorherige[rs]?|letzter\s+song)\s*[.!?]*$/i.test(t)) {
    return { kind: 'prev' }
  }
  const play = /^\s*(?:spiel(?:e)?|play)\s+(?:musik\s+)?(?:von\s+)?(.+?)\s*$/i.exec(t)
  if (play?.[1]) return { kind: 'play', query: play[1].replace(/[.!?]+$/, '').trim() }
  return null
}
