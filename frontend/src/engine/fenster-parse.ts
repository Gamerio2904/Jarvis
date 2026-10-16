export type FensterKind = 'handy' | 'tablet'

export const FENSTER_SURFACES = [
  'home',
  'tisch',
  'lage',
  'chat',
  'calendar',
  'watchlist',
  'voice',
  'planning',
  'sprints',
] as const

export type FensterSurface = (typeof FENSTER_SURFACES)[number]

const SURFACE_WORD: Array<[RegExp, FensterSurface]> = [
  [/tischplatte|tisch|tafel/, 'tisch'],
  [/lage/, 'lage'],
  [/start|hauptbildschirm|homescreen|home/, 'home'],
  [/chat/, 'chat'],
  [/kalender/, 'calendar'],
  [/filme|watchliste|watchlist/, 'watchlist'],
  [/hören|hoeren|horen|sprache/, 'voice'],
  [/planung|planungsmodus|projektplanung/, 'planning'],
  [/sprints?/, 'sprints'],
]

export function parseFensterConnect(text: string): FensterKind | null {
  const t = text.trim()
  if (!t || t.length > 80) return null
  if (/^\s*(?:verbinde|verinde)(?:\s+dich)?(?:\s+mit)?\s+(?:das\s+|mein\s+|dem\s+)?handy\s*[.!?]*$/i.test(t)) return 'handy'
  if (/^\s*(?:verbinde|verinde)(?:\s+dich)?(?:\s+mit)?\s+(?:das\s+|mein\s+|dem\s+)?tablet\s*[.!?]*$/i.test(t)) return 'tablet'
  return null
}

/** „2. Bildschirm“ ist das gekoppelte Gerät, nicht ein dritter Typ. */
export function parseSecondScreen(text: string): FensterSurface | 'current' | null {
  const t = text.trim()
  if (!t || t.length > 160) return null
  if (!/\b(?:2\.|zweiten|zweiter)\s+bildschirm\b/i.test(t)) return null
  const what = t
    .replace(/\b(?:öffne|oeffne|zeig(?:e)?|mach)\b/gi, ' ')
    .replace(/\b(?:auf\s+dem|am)\s+(?:2\.|zweiten|zweiter)\s+bildschirm\b/gi, ' ')
    .replace(/\b(?:die|den|das|mir|bitte)\b/gi, ' ')
    .replace(/[.?!,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  if (!what) return 'current'
  for (const [re, surface] of SURFACE_WORD) {
    if (re.test(what)) return surface
  }
  return null
}

export function parseFensterShow(text: string): { kind: FensterKind; surface: FensterSurface } | null {
  const t = text.trim()
  if (!t || t.length > 120) return null
  const tail = /^\s*(?:zeig(?:e)?|öffne|oeffne)\s+(?:mir\s+)?(?:die\s+|den\s+|das\s+)?(.+?)\s+auf\s+dem\s+(handy|tablet)\s*[.!?]*$/i.exec(t)
  const head = /^\s*(?:zeig(?:e)?|öffne|oeffne)\s+auf\s+dem\s+(handy|tablet)\s+(?:die\s+|den\s+|das\s+)?(.+?)\s*[.!?]*$/i.exec(t)
  const kindWord = (tail?.[2] || head?.[1] || '').toLowerCase()
  const what = (tail?.[1] || head?.[2] || '').trim().toLowerCase()
  if (!kindWord || !what) return null
  const kind: FensterKind = kindWord === 'tablet' ? 'tablet' : 'handy'
  for (const [re, surface] of SURFACE_WORD) {
    if (re.test(what)) return { kind, surface }
  }
  return null
}

export function fensterKindLabel(kind: FensterKind): string {
  return kind === 'tablet' ? 'Tablet' : 'Handy'
}

export function fensterSurfaceLabel(surface: FensterSurface): string {
  if (surface === 'tisch') return 'Tischplatte'
  if (surface === 'lage') return 'Lage'
  if (surface === 'home') return 'Start'
  if (surface === 'chat') return 'Chat'
  if (surface === 'calendar') return 'Kalender'
  if (surface === 'watchlist') return 'Filme'
  if (surface === 'voice') return 'Hören'
  return surface === 'planning' ? 'Planung' : 'Sprints'
}
