/** Stücke auf der Tafel. Anteile der Fläche, nicht Pixel. */

export const PIECE_IDS = [
  'sprintliste',
  'psp',
  'auftrag',
  'uhr',
  'quellen',
  'termin',
  'jobleiste',
  'module',
  'draht',
] as const

export type PieceId = (typeof PIECE_IDS)[number]
export type PlaceDir = 'links' | 'rechts' | 'oben' | 'unten' | 'mitte'

export type PiecePos = { id: PieceId; x: number; y: number; off: boolean }

const NAMES: Record<string, PieceId> = {
  sprintliste: 'sprintliste',
  psp: 'psp',
  auftrag: 'auftrag',
  uhr: 'uhr',
  quellen: 'quellen',
  termin: 'termin',
  jobleiste: 'jobleiste',
  module: 'module',
  draht: 'draht',
}

const LABEL: Record<PieceId, string> = {
  sprintliste: 'Sprintliste',
  psp: 'PSP',
  auftrag: 'Auftrag',
  uhr: 'Uhr',
  quellen: 'Quellen',
  termin: 'Termin',
  jobleiste: 'Jobleiste',
  module: 'Module',
  draht: 'Draht',
}

const ARTICLE: Record<PieceId, 'die' | 'der'> = {
  sprintliste: 'die',
  psp: 'der',
  auftrag: 'der',
  uhr: 'die',
  quellen: 'die',
  termin: 'der',
  jobleiste: 'die',
  module: 'die',
  draht: 'der',
}

export function pieceLabel(id: PieceId): string {
  return LABEL[id]
}

export function pieceFromName(raw: string): PieceId | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, '')
  return NAMES[key] || null
}

export function pieceNames(): string {
  return PIECE_IDS.map((id) => LABEL[id]).join(', ')
}

export function defaultPieces(): PiecePos[] {
  return [
    { id: 'uhr', x: 0.12, y: 0.14, off: false },
    { id: 'termin', x: 0.12, y: 0.36, off: false },
    { id: 'sprintliste', x: 0.18, y: 0.62, off: false },
    { id: 'auftrag', x: 0.5, y: 0.42, off: false },
    { id: 'psp', x: 0.72, y: 0.5, off: false },
    { id: 'quellen', x: 0.82, y: 0.2, off: false },
    { id: 'jobleiste', x: 0.5, y: 0.86, off: false },
    { id: 'module', x: 0.5, y: 0.46, off: true },
    { id: 'draht', x: 0.5, y: 0.46, off: true },
  ]
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0.5
  return Math.min(0.92, Math.max(0.04, n))
}

export function loadPieces(raw: string): PiecePos[] {
  const base = defaultPieces()
  if (!raw) return base
  try {
    const rows = JSON.parse(raw) as PiecePos[]
    if (!Array.isArray(rows)) return base
    return base.map((d) => {
      const hit = rows.find((r) => r && r.id === d.id)
      if (!hit) return d
      return { id: d.id, x: clamp(Number(hit.x)), y: clamp(Number(hit.y)), off: Boolean(hit.off) }
    })
  } catch {
    return base
  }
}

export function serializePieces(rows: PiecePos[]): string {
  return JSON.stringify(rows)
}

export function anchorOf(dir: PlaceDir, piece: PiecePos): PiecePos {
  if (dir === 'links') return { ...piece, x: 0.18, off: false }
  if (dir === 'rechts') return { ...piece, x: 0.78, off: false }
  if (dir === 'oben') return { ...piece, y: 0.16, off: false }
  if (dir === 'unten') return { ...piece, y: 0.78, off: false }
  return { ...piece, x: 0.5, y: 0.46, off: false }
}

export function anchorWord(dir: PlaceDir): string {
  if (dir === 'links') return 'links'
  if (dir === 'rechts') return 'rechts'
  if (dir === 'oben') return 'oben'
  if (dir === 'unten') return 'unten'
  return 'in der Mitte'
}

function titled(id: PieceId): string {
  const art = ARTICLE[id]
  const name = LABEL[id]
  return `${art.charAt(0).toUpperCase()}${art.slice(1)} ${name}`
}

export function liesInTray(id: PieceId): string {
  return `${titled(id)} liegt in der Ablage.`
}

export function alreadyOn(id: PieceId): string {
  return `${titled(id)} liegt schon auf dem Tisch.`
}

export type PlaceOp =
  | { op: 'move'; piece: PieceId | null; dir: PlaceDir }
  | { op: 'throw'; piece: PieceId | null }
  | { op: 'recall'; piece: PieceId | null }
  | { op: 'clear' }

export type MotionCue = {
  seq: number
  kind: 'move' | 'throw' | 'recall' | 'clear' | 'focus'
  ids: PieceId[]
  from: Array<{ id: PieceId; x: number; y: number }>
  steps: number
}

export function applyPlace(
  pieces: PiecePos[],
  intent: PlaceOp,
  wide: boolean,
  seq = Date.now(),
): { pieces: PiecePos[]; reply: string; motion: MotionCue } {
  const none: MotionCue = { seq, kind: 'move', ids: [], from: [], steps: 0 }
  if (intent.op !== 'clear' && !intent.piece) {
    return { pieces, reply: `Das Stück gibt es nicht. ${pieceNames()}.`, motion: none }
  }
  if (intent.op === 'move' && !wide) {
    return { pieces, reply: 'Die freie Fläche ist das Tablet.', motion: none }
  }
  if (intent.op === 'clear') {
    const on = pieces.filter((p) => !p.off)
    const next = pieces.map((p) => ({ ...p, off: true }))
    return {
      pieces: next,
      reply: 'Der Tisch ist geräumt.',
      motion: { seq, kind: 'clear', ids: on.map((p) => p.id), from: on.map((p) => ({ id: p.id, x: p.x, y: p.y })), steps: Math.max(1, on.length) },
    }
  }
  const id = intent.piece as PieceId
  const cur = pieces.find((p) => p.id === id) || defaultPieces().find((p) => p.id === id)!
  if (intent.op === 'throw') {
    if (cur.off) return { pieces, reply: liesInTray(id), motion: none }
    const next = pieces.map((p) => (p.id === id ? { ...p, off: true } : p))
    return {
      pieces: next,
      reply: liesInTray(id),
      motion: { seq, kind: 'throw', ids: [id], from: [{ id, x: cur.x, y: cur.y }], steps: 1 },
    }
  }
  if (intent.op === 'recall') {
    if (!cur.off) return { pieces, reply: alreadyOn(id), motion: none }
    const back = { ...cur, off: false }
    const next = pieces.map((p) => (p.id === id ? back : p))
    return {
      pieces: next,
      reply: `${LABEL[id]} liegt wieder auf dem Tisch.`,
      motion: { seq, kind: 'recall', ids: [id], from: [], steps: 1 },
    }
  }
  const moved = anchorOf(intent.dir, { ...cur, off: false })
  const next = pieces.map((p) => (p.id === id ? moved : p))
  const where = anchorWord(intent.dir)
  const reply = intent.dir === 'mitte' ? `${LABEL[id]} liegt in der Mitte.` : `${LABEL[id]} liegt ${where}.`
  return {
    pieces: next,
    reply,
    motion: { seq, kind: 'move', ids: [id], from: [], steps: 1 },
  }
}

export function focusPiece(view: string): PieceId {
  if (view === 'psp') return 'psp'
  if (view === 'modules') return 'module'
  if (view === 'sim') return 'draht'
  if (view === 'research') return 'quellen'
  return 'sprintliste'
}

export function bringForward(pieces: PiecePos[], id: PieceId, seq = Date.now()): { pieces: PiecePos[]; motion: MotionCue } {
  const cur = pieces.find((p) => p.id === id)
  const next = pieces.map((p) => {
    if (p.id !== id) return p
    if (!p.off) return p
    return { ...p, off: false, x: 0.5, y: 0.46 }
  })
  return {
    pieces: next,
    motion: { seq, kind: 'focus', ids: [id], from: cur?.off ? [] : [], steps: 1 },
  }
}

export function boardIsWide(): boolean {
  if (typeof window === 'undefined') return true
  return window.innerWidth >= 900
}

export async function waitForMotion(steps: number): Promise<void> {
  if (typeof window === 'undefined' || steps <= 0) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const ms = reduce ? 120 : Math.min(1200, 160 + 480 + Math.max(0, steps - 1) * 140)
  await new Promise((resolve) => window.setTimeout(resolve, ms))
}

export function hapticTick(): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(8)
  } catch {
    /* ohne Tick ist die Fahrt fertig */
  }
}
