import { normalizeUtterance } from './utterance.ts'

export type RmSceneIntent =
  | { kind: 'write'; season: number; episode: number; code: string }
  | { kind: 'recall'; code?: string }
  | { kind: 'forget'; code?: string }

const STAFFEL = /staffel\s+(\d{1,2})\s+folge\s+(\d{1,2})/i
const CODE = /\bS(\d{1,2})E(\d{1,2})\b/i
const SCENE = /\b(?:fähigkeit(?:en)?|szene|kamera|rick|morty|serie[- ]?netz)\b/i

export function formatRmCode(season: number, episode: number): string {
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
}

export function parseRmEpisodeStamp(text: string): { season: number; episode: number; code: string } | null {
  const t = normalizeUtterance(text.trim())
  const a = STAFFEL.exec(t)
  if (a) {
    const season = Number(a[1])
    const episode = Number(a[2])
    if (season >= 1 && season <= 20 && episode >= 1 && episode <= 20) {
      return { season, episode, code: formatRmCode(season, episode) }
    }
  }
  const b = CODE.exec(t)
  if (b) {
    const season = Number(b[1])
    const episode = Number(b[2])
    if (season >= 1 && season <= 20 && episode >= 1 && episode <= 20) {
      return { season, episode, code: formatRmCode(season, episode) }
    }
  }
  return null
}

export function parseRmSceneIntent(text: string): RmSceneIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (/\b(?:wäsche|waschschüssel|carbonara|nutella|barcode)\b/i.test(t)) return null
  const stamp = parseRmEpisodeStamp(t)
  if (/^\s*(?:vergiss|lösch(?:e)?)\s+/i.test(t) && (SCENE.test(t) || stamp)) {
    if (stamp && stamp.season < 6 && !SCENE.test(t)) return null
    return { kind: 'forget', code: stamp?.code }
  }
  if (/^\s*(?:welche|zeig(?:e)?)\s+(?:die\s+)?(?:kamera[- ]?)?(?:fähigkeiten|szenen)\b/i.test(t)) {
    return { kind: 'recall', code: stamp?.code }
  }
  if (!stamp) return null
  if (stamp.season < 6 && !SCENE.test(t)) return null
  return { kind: 'write', season: stamp.season, episode: stamp.episode, code: stamp.code }
}
