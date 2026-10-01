/** Jarvis-Glas: ein Hint färbt Launcher und Tischplatte. Kein Marvel-Prompt. */

export const MOTIFS = ['orbit', 'grid', 'pulse'] as const
export type BoardMotif = (typeof MOTIFS)[number]

export type BoardTheme = {
  accent: string
  glow: number
  density: number
  motif: BoardMotif
}

export const DEFAULT_THEME: BoardTheme = {
  accent: '#e23a42',
  glow: 0.4,
  density: 0.3,
  motif: 'orbit',
}

const HEX = /^#([0-9a-f]{6})$/i

function clip(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

export function isBoardMotif(v: string): v is BoardMotif {
  return (MOTIFS as readonly string[]).includes(v)
}

/** Unbekannte Keys fallen weg. Kaputtes JSON → Default. */
export function parseThemeHint(raw: unknown): BoardTheme {
  const base = { ...DEFAULT_THEME }
  if (!raw) return base
  let o: Record<string, unknown> = {}
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (!t) return base
    try {
      const parsed = JSON.parse(t) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return base
      o = parsed as Record<string, unknown>
    } catch {
      return base
    }
  } else if (typeof raw === 'object' && !Array.isArray(raw)) {
    o = raw as Record<string, unknown>
  } else {
    return base
  }
  const accent = typeof o.accent === 'string' && HEX.test(o.accent.trim()) ? o.accent.trim().toLowerCase() : base.accent
  const glowRaw = typeof o.glow === 'number' ? o.glow : o.glow != null ? Number(o.glow) : NaN
  const densityRaw = typeof o.density === 'number' ? o.density : o.density != null ? Number(o.density) : NaN
  const glow = Number.isFinite(glowRaw) ? clip(glowRaw, 0, 1) : base.glow
  const density = Number.isFinite(densityRaw) ? clip(densityRaw, 0, 1) : base.density
  const motif = typeof o.motif === 'string' && isBoardMotif(o.motif) ? o.motif : base.motif
  return { accent, glow, density, motif }
}

export function serializeTheme(theme: BoardTheme): string {
  return JSON.stringify({
    accent: theme.accent,
    glow: theme.glow,
    density: theme.density,
    motif: theme.motif,
  })
}

export function cycleMotif(current: BoardMotif): BoardMotif {
  const i = MOTIFS.indexOf(current)
  return MOTIFS[(i + 1) % MOTIFS.length]
}

/** Drei deutlich verschiedene Flächen. Nur das Motiv zu tauschen bleibt unsichtbar. */
export const THEME_LOOKS: BoardTheme[] = [
  { motif: 'orbit', accent: '#7dd3c7', glow: 0.4, density: 0.3 },
  { motif: 'grid', accent: '#e8c36a', glow: 0.62, density: 0.85 },
  { motif: 'pulse', accent: '#8eb6ff', glow: 0.78, density: 0.16 },
]

export function nextTheme(current: BoardTheme): BoardTheme {
  const i = MOTIFS.indexOf(current.motif)
  return { ...THEME_LOOKS[(Math.max(i, 0) + 1) % THEME_LOOKS.length] }
}

export function motifLabel(motif: BoardMotif): string {
  if (motif === 'grid') return 'Gitter'
  if (motif === 'pulse') return 'Pulse'
  return 'Orbit'
}

const PULSE = THEME_LOOKS[2]
const GRID = THEME_LOOKS[1]
const ORBIT = THEME_LOOKS[0]

/** Farbwort aus dem Satz. Unbekannt → null, damit niemand einen Wechsel behauptet. */
export function themeFromWords(raw: string): { theme: BoardTheme; note: string } | null {
  const t = raw
    .toLowerCase()
    .replace(/[^a-zäöüß\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t || t.length > 48) return null
  const has = (re: RegExp) => re.test(t)
  if (has(/blau/) && has(/schwarz/)) {
    return { theme: { motif: 'pulse', accent: '#8eb6ff', glow: 0.55, density: 0.14 }, note: 'Blau auf Schwarz.' }
  }
  if (has(/gitter|gold|gelb/)) return { theme: { ...GRID }, note: 'Gitter.' }
  if (has(/blau|navy/)) return { theme: { ...PULSE }, note: 'Blau.' }
  if (has(/schwarz|dunkel/)) {
    return { theme: { motif: 'pulse', accent: '#8eb6ff', glow: 0.28, density: 0.08 }, note: 'Dunkel, ohne Goldgitter.' }
  }
  if (has(/\bpulse\b/)) return { theme: { ...PULSE }, note: 'Pulse.' }
  if (has(/orbit|türkis|tuerkis|mint/)) return { theme: { ...ORBIT }, note: 'Orbit.' }
  return null
}
