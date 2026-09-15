import type { ChatBlock } from './chat-blocks.ts'
import { pickReplyMove } from './chess-engine.ts'
import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'

const START =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const KEY = 'jarvis_chess_fen'

const PIECE = '(bauer|springer|pferd|l[aä]ufer|turm|dame|k[oö]nig(?:in)?)'

/** Genannte Figur → FEN-Buchstabe. „Königin“ ist die Dame, nicht der König. */
const PIECE_LETTER: Array<[RegExp, string]> = [
  [/^bauer$/i, 'p'],
  [/^(?:springer|pferd)$/i, 'n'],
  [/^l[aä]ufer$/i, 'b'],
  [/^turm$/i, 'r'],
  [/^(?:dame|k[oö]nigin)$/i, 'q'],
  [/^k[oö]nig$/i, 'k'],
]

const PIECE_NAME: Record<string, string> = {
  p: 'Bauer',
  n: 'Springer',
  b: 'Läufer',
  r: 'Turm',
  q: 'Dame',
  k: 'König',
}

/** Die Dame ist die einzige weibliche Figur — „kein Dame“ liest sich wie ein Fehler. */
export function piecePhrase(letter: string, negated: boolean): string {
  const name = PIECE_NAME[letter] || 'Figur'
  const female = letter === 'q'
  return `${negated ? 'kein' : 'ein'}${female ? 'e' : ''} ${name}`
}

function pieceLetter(word: string): string {
  const w = (word || '').trim()
  for (const [re, letter] of PIECE_LETTER) {
    if (re.test(w)) return letter
  }
  return ''
}
const SQ = '([a-h])\\s*([1-8])'
/** Ziel darf 9 sein — sonst fällt „Läufer e8 f9“ ans Modell statt auf illegal. */
const SQ_ANY = '([a-h])\\s*(\\d+)'
const FROM_TO = new RegExp(`${SQ}\\s*(?:[-–]|nach|auf|bis)?\\s*${SQ_ANY}([qrbn])?`, 'i')
const PIECE_MOVE = new RegExp(`${PIECE}\\s+${SQ}\\s*(?:[-–]|nach|auf|bis)?\\s*${SQ_ANY}([qrbn])?`, 'i')
const PLAY =
  /\b(?:lass(?:t)?\s+(?:uns|mich)|las\s+uns|wollen\s+wir|spiel(?:en)?\s+wir)\s+schach\b|\bschach\s+spiel(?:en)?\b|^\s*(?:spiel(?:e)?(?:\s+mal)?|play)\s+schach\b/i

export type ChessIntent = {
  kind: 'new' | 'show' | 'move' | 'castle'
  move?: string
  piece?: string
  side?: 'short' | 'long'
}

/**
 * Am Brett sagt niemand „König e1 g1“, sondern „Rochade“. Ohne diese Zeilen
 * fiel der häufigste Zug der Eröffnung durch den Parser.
 */
const CASTLE = /\brochade\b|\broch(?:ier|ieren|iere|iert)\b/i
/** `0-0` ist auch ein Fußballstand — die Kurzform gilt nur am Brett. */
const CASTLE_SHORT_HAND = /\b0\s*-\s*0(?:\s*-\s*0)?\b|\bo\s*-\s*o(?:\s*-\s*o)?\b/i
const CASTLE_LONG = /\b(?:lang|lange|langen|gro(?:ss|ß)e?n?|damenseite|damenfl[uü]gel)\b|0\s*-\s*0\s*-\s*0|o\s*-\s*o\s*-\s*o/i

export function parseChessIntent(text: string, follow = false): ChessIntent | null {
  const t = normalizeUtterance(text.trim()).toLowerCase()
  if (!t || t.length > 120) return null
  if (/\b(spotify|musik|song|lied|titel)\b/i.test(t)) return null
  if (/^\s*schach\s*(?:neu|reset|von\s+vorn)\s*$/i.test(t) || /^\s*neues\s+schach\s*$/i.test(t)) {
    return { kind: 'new' }
  }
  if (PLAY.test(t)) return { kind: 'new' }
  if (
    /^\s*(?:das\s+)?schach(?:brett)?\s*$/i.test(t) ||
    /\bzeig(?:e)?(?:\s+mir)?(?:\s+(?:mal\s+)?)?(?:das\s+|ein\s+)?schachbrett\b/i.test(t)
  ) {
    return { kind: 'show' }
  }
  if (CASTLE.test(t) || ((follow || /\bschach\b/i.test(t)) && CASTLE_SHORT_HAND.test(t))) {
    return { kind: 'castle', side: CASTLE_LONG.test(t) ? 'long' : 'short' }
  }
  const piece = PIECE_MOVE.exec(t)
  if (piece) {
    return {
      kind: 'move',
      move: `${piece[2]}${piece[3]}${piece[4]}${piece[5]}${piece[6] || ''}`.toLowerCase(),
      piece: pieceLetter(piece[1]),
    }
  }
  const spaced = FROM_TO.exec(t)
  if (
    spaced &&
    (/\bschach\b/i.test(t) || follow || PIECE_MOVE.test(t) || /^\s*[a-h]\s*[1-8]\s/.test(t))
  ) {
    return { kind: 'move', move: `${spaced[1]}${spaced[2]}${spaced[3]}${spaced[4]}${spaced[5] || ''}`.toLowerCase() }
  }
  const m = /(?:schach\s+)?([a-h][1-8][a-h][1-8][qrbn]?)|([a-h][1-8]-[a-h][1-8])/i.exec(t)
  if (m && (/\bschach\b/i.test(t) || follow || /^\s*[a-h][1-8][a-h][1-8]/.test(t))) {
    const raw = (m[1] || m[2] || '').replace('-', '')
    return { kind: 'move', move: raw.toLowerCase() }
  }
  return null
}

export async function handleChess(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string; blocks?: ChatBlock[] }> {
  const follow = loadFen() !== START
  const intent = parseChessIntent(text, follow)
  if (!intent) return { handled: false }
  if (intent.kind === 'new') {
    saveFen(START)
    return pack('Neues Spiel. Du bist Weiß, ich Schwarz. Züge wie Bauer e2 e4.', START)
  }
  const fen = loadFen()
  if (intent.kind === 'show') {
    const after = applyEngineIfBlack(fen)
    const note = after.reply ? `Ich spiele ${prettyMove(after.reply)}. ${endLine(after.fen)}` : endLine(after.fen)
    if (after.fen !== fen) saveFen(after.fen)
    return pack(note, after.fen)
  }
  // Nach Matt/Patt/Remis verschluckte jeder weitere Zug die Stellung und
  // wiederholte nur die Schlusszeile, ohne zu sagen, wie es weitergeht.
  if (gameOver(fen)) {
    return pack(endLine(fen), fen)
  }
  let move = intent.kind === 'castle' ? castleUci(fen, intent.side === 'long') : intent.move || ''
  if ((/^[a-h]7[a-h]8$/.test(move) || /^[a-h]2[a-h]1$/.test(move)) && standsOn(fen, move) === 'p') {
    move += 'q'
  }
  /**
   * Die genannte Figur wurde vorher nur zum Erkennen gelesen und dann
   * weggeworfen: „Dame e2 e4“ zog den Bauern auf e2 und meldete Erfolg. Wer
   * eine Figur benennt, meint sie auch.
   */
  const named = intent.piece ? standsOn(fen, move) : ''
  if (intent.piece && named && named !== intent.piece) {
    return pack(
      `Auf ${move.slice(0, 2)} steht ${piecePhrase(intent.piece, true)}, sondern ${piecePhrase(named, false)}. ${endLine(fen)}`,
      fen,
    )
  }
  if (!sideToMoveWhite(fen)) {
    const after = applyEngineIfBlack(fen)
    if (after.reply && after.fen !== fen) saveFen(after.fen)
    return pack(
      after.reply
        ? `Ich bin am Zug. Ich spiele ${prettyMove(after.reply)}. ${endLine(after.fen)}`
        : endLine(after.fen),
      after.fen,
    )
  }
  // Wer „Rochade“ gesagt hat, versteht „Zug e1–g1 ist nicht legal“ nicht.
  const spoken = intent.kind === 'castle' ? `${intent.side === 'long' ? 'Lange' : 'Kurze'} Rochade` : ''
  const next = applyMove(fen, move)
  if (!next) {
    return pack(
      spoken ? `${spoken} geht hier nicht. ${endLine(fen)}` : `Zug ${prettyMove(move)} ist nicht legal. ${endLine(fen)}`,
      fen,
    )
  }
  const engine = applyEngineIfBlack(next)
  saveFen(engine.fen)
  const userLine = spoken ? `${spoken} ${prettyMove(move)}` : prettyMove(move)
  if (!engine.reply) {
    return pack(`${userLine}. ${endLine(engine.fen)}`, engine.fen)
  }
  return pack(`${userLine}. Ich spiele ${prettyMove(engine.reply)}. ${endLine(engine.fen)}`, engine.fen)
}

/** „Rochade“ als Zug der Seite, die am Zug ist. */
function castleUci(fen: string, long: boolean): string {
  const rank = sideToMoveWhite(fen) ? '1' : '8'
  return `e${rank}${long ? 'c' : 'g'}${rank}`
}

/** Welche Figur steht auf dem Startfeld des Zugs? Leer, wenn das Feld frei ist. */
function standsOn(fen: string, uci: string): string {
  if (!/^[a-h][1-8]/.test(uci)) return ''
  const { grid } = parseBoard(fen)
  const sq = grid[8 - Number(uci[1])]?.[uci.charCodeAt(0) - 97]
  return sq ? sq.p : ''
}

function prettyMove(uci: string): string {
  const m = /^([a-h][1-8])([a-h]\d+)([qrbn])?/.exec(uci)
  if (!m) return uci
  const promo = m[3] ? `=${PIECE_NAME[m[3]]}` : ''
  return `${m[1]}–${m[2]}${promo}`
}

function pack(line: string, fen: string) {
  return {
    handled: true,
    reply: line,
    tool: { tool_status: 'executed', tool: 'chess', action: 'move', label: 'Schach' } as ToolMeta,
    lastTool: 'chess',
    blocks: [{ kind: 'chess' as const, fen }],
  }
}

export const START_FEN = START

const chessListeners = new Set<() => void>()

export function loadFen(): string {
  try {
    return localStorage.getItem(KEY) || START
  } catch {
    return START
  }
}

/** Stellungen dieser Partie, damit Jarvis nicht dieselbe Figur hin und her schiebt. */
const seen: string[] = []

export function saveFen(fen: string): void {
  const place = fen.split(' ')[0] || ''
  if (fen === START) seen.length = 0
  seen.push(place)
  if (seen.length > 24) seen.shift()
  try {
    localStorage.setItem(KEY, fen)
  } catch {
    /* ignore */
  }
  for (const fn of [...chessListeners]) {
    try {
      fn()
    } catch {
      /* listener */
    }
  }
}

export function subscribeChess(fn: () => void): () => void {
  chessListeners.add(fn)
  return () => {
    chessListeners.delete(fn)
  }
}

function sideName(fen: string): string {
  return fen.split(' ')[1] === 'b' ? 'Schwarz' : 'Weiß'
}

function turnLine(fen: string): string {
  const check = inCheck(fen) ? ' Schach!' : ''
  return `${sideName(fen)} am Zug.${check}`
}

/**
 * Ohne Königsprüfung endete jede Partie im Nichts: „keinen Zug“ stand auch
 * unter einem Matt. Jetzt sagt die Zeile, was auf dem Brett steht.
 */
function endLine(fen: string): string {
  const draw = drawWhy(fen)
  if (draw) return `${draw} Sag „Schach neu“ für ein neues Spiel.`
  if (allLegalUci(fen).length) return turnLine(fen)
  const side = sideName(fen)
  if (inCheck(fen)) return `Schachmatt — ${side} steht matt. Sag „Schach neu“ für ein neues Spiel.`
  return `Patt — ${side} hat keinen Zug. Sag „Schach neu“ für ein neues Spiel.`
}

function gameOver(fen: string): boolean {
  return Boolean(drawWhy(fen)) || allLegalUci(fen).length === 0
}

/** Material, 50-Züge, dreimal dieselbe Stellung. */
function drawWhy(fen: string): string | null {
  if (insufficient(fen)) return 'Remis — kein Matt mehr möglich.'
  const st = parseState(fen)
  if (st.half >= 100) return 'Remis — 50 Züge ohne Schlag und ohne Bauer.'
  const place = fen.split(' ')[0]
  let n = 0
  for (const s of seen) if (s === place) n += 1
  if (n >= 3) return 'Remis — dreimal dieselbe Stellung.'
  return null
}

/** König gegen König, oder eine Leichtfigur extra — Matt geht nicht mehr. */
function insufficient(fen: string): boolean {
  const letters = [...(fen.split(' ')[0] || '')].filter((c) => /[pnbrqk]/i.test(c))
  if (letters.some((c) => /[pqr]/i.test(c))) return false
  return letters.filter((c) => /[nb]/i.test(c)).length <= 1
}

/** Jarvis ist Schwarz. Zieht nach, wenn Schwarz am Zug ist. */
export function applyEngineIfBlack(fen: string): { fen: string; reply: string | null } {
  if (sideToMoveWhite(fen)) return { fen, reply: null }
  const moves = allLegalUci(fen)
  if (!moves.length) return { fen, reply: null }
  const reply = pickReplyMove(fen, new Set(seen.slice(-8)))
  if (!reply) return { fen, reply: null }
  const next = applyMove(fen, reply)
  if (!next) return { fen, reply: null }
  return { fen: next, reply }
}

export function playEngineIfBlack(): string | null {
  const fen = loadFen()
  const after = applyEngineIfBlack(fen)
  if (after.fen !== fen) saveFen(after.fen)
  return after.reply
}

export function turnLabel(fen: string): string {
  return turnLine(fen)
}

type Sq = { p: string; white: boolean } | null

function parseBoard(fen: string): { grid: Sq[][]; white: boolean } {
  const [place, stm] = fen.split(' ')
  const grid: Sq[][] = []
  for (const row of (place || '').split('/')) {
    const line: Sq[] = []
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) line.push(null)
      } else {
        line.push({ p: ch.toLowerCase(), white: ch === ch.toUpperCase() })
      }
    }
    while (line.length < 8) line.push(null)
    grid.push(line.slice(0, 8))
  }
  return { grid, white: stm !== 'b' }
}

export function pieceAt(fen: string, sq: string): { p: string; white: boolean } | null {
  if (!/^[a-h][1-8]$/.test(sq)) return null
  const { grid } = parseBoard(fen)
  const ff = sq.charCodeAt(0) - 97
  const fr = 8 - Number(sq[1])
  return grid[fr]?.[ff] || null
}

export function sideToMoveWhite(fen: string): boolean {
  return parseBoard(fen).white
}

/** Die Felder hinter der Stellung: Rochaderechte, En-passant-Feld, Zähler. */
type State = { castle: string; ep: string; half: number; full: number }

function parseState(fen: string): State {
  const bits = fen.split(' ')
  return {
    castle: bits[2] && bits[2] !== '-' ? bits[2] : '',
    ep: bits[3] && bits[3] !== '-' ? bits[3] : '',
    half: Number.parseInt(bits[4] || '0', 10) || 0,
    full: Number.parseInt(bits[5] || '1', 10) || 1,
  }
}

/** Verlorene Rochaderechte streichen. */
function dropRights(castle: string, letters: string): string {
  return [...castle].filter((c) => !letters.includes(c)).join('')
}

function fenOf(grid: Sq[][], white: boolean, tail: string): string {
  const rows = grid.map((row) => {
    let s = ''
    let z = 0
    for (const sq of row) {
      if (!sq) {
        z += 1
        continue
      }
      if (z) {
        s += String(z)
        z = 0
      }
      s += sq.white ? sq.p.toUpperCase() : sq.p
    }
    if (z) s += String(z)
    return s
  })
  return `${rows.join('/')} ${white ? 'w' : 'b'} ${tail}`
}

export function applyMove(fen: string, uci: string): string | null {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return null
  const { grid, white } = parseBoard(fen)
  const st = parseState(fen)
  const ff = uci.charCodeAt(0) - 97
  const fr = 8 - Number(uci[1])
  const tf = uci.charCodeAt(2) - 97
  const tr = 8 - Number(uci[3])
  const piece = grid[fr]?.[ff]
  if (!piece || piece.white !== white) return null
  const dest = grid[tr]?.[tf]
  if (dest && dest.white === white) return null
  const df = tf - ff
  const dr = tr - fr
  const dir = piece.white ? -1 : 1
  const home = white ? 7 : 0
  let capture = Boolean(dest)
  let rookFrom = -1

  if (piece.p === 'k' && dr === 0 && Math.abs(df) === 2) {
    // Rochade: der König springt zwei Felder, der Turm setzt sich daneben.
    if (fr !== home || ff !== 4) return null
    const short = df > 0
    if (!st.castle.includes(white ? (short ? 'K' : 'Q') : short ? 'k' : 'q')) return null
    rookFrom = short ? 7 : 0
    const tower = grid[home]?.[rookFrom]
    if (!tower || tower.p !== 'r' || tower.white !== white) return null
    const step = short ? 1 : -1
    for (let f = 4 + step; f !== rookFrom; f += step) {
      if (grid[home][f]) return null
    }
    // Nicht aus dem Schach, nicht durchs Schach. Das Zielfeld prüft die
    // Königsprüfung weiter unten.
    if (kingAttacked(grid, white)) return null
    if (attacks(grid, 4 + step, home, !white)) return null
  } else if (piece.p === 'p' && Math.abs(df) === 1 && dr === dir && !dest && st.ep === square(tf, tr)) {
    // En passant: der geschlagene Bauer steht neben dem Zielfeld, nicht darauf.
    const victim = grid[fr]?.[tf]
    if (!victim || victim.p !== 'p' || victim.white === white) return null
    grid[fr][tf] = null
    capture = true
  } else if (!legal(grid, piece, ff, fr, tf, tr, df, dr, dest)) {
    return null
  }

  grid[tr][tf] = piece
  grid[fr][ff] = null
  if (rookFrom >= 0) {
    grid[home][ff + (df > 0 ? 1 : -1)] = grid[home][rookFrom]
    grid[home][rookFrom] = null
  }
  if (piece.p === 'p' && (tr === 0 || tr === 7)) {
    const promo = uci[4] || 'q'
    grid[tr][tf] = { p: promo, white: piece.white }
  }
  // Ein Zug, der den eigenen König im Schach lässt, ist keiner. Vorher durfte
  // jede Seite den König stehen lassen — und Jarvis zog ins Matt hinein.
  if (kingAttacked(grid, white)) return null

  // Rechte und Zähler mitschreiben: sonst bleibt `KQkq` stehen, nachdem der
  // König gezogen ist, und das En-passant-Feld gilt die ganze Partie.
  let castle = st.castle
  if (piece.p === 'k') castle = dropRights(castle, white ? 'KQ' : 'kq')
  if (piece.p === 'r' && fr === home) {
    if (ff === 0) castle = dropRights(castle, white ? 'Q' : 'q')
    if (ff === 7) castle = dropRights(castle, white ? 'K' : 'k')
  }
  // Ein in der Ecke geschlagener Turm nimmt das Recht des Gegners mit.
  if (tr === (white ? 0 : 7) && (tf === 0 || tf === 7)) {
    castle = dropRights(castle, white ? (tf === 0 ? 'q' : 'k') : tf === 0 ? 'Q' : 'K')
  }
  const ep = piece.p === 'p' && dr === 2 * dir ? square(ff, fr + dir) : ''
  const half = capture || piece.p === 'p' ? 0 : st.half + 1
  const full = white ? st.full : st.full + 1
  return fenOf(grid, !white, `${castle || '-'} ${ep || '-'} ${half} ${full}`)
}

function square(file: number, rank: number): string {
  return `${String.fromCharCode(97 + file)}${8 - rank}`
}

/** Greift die Gegenseite das Feld an? Pseudo-Züge, ohne Königsprüfung. */
function attacks(grid: Sq[][], tf: number, tr: number, byWhite: boolean): boolean {
  // Auf einem leeren Feld steht ein gedachter Gegner: der Bauer schlägt nur
  // diagonal auf ein besetztes Feld, und ohne diesen Platzhalter hielte die
  // Rochade ein von einem Bauern gedecktes Durchgangsfeld für frei. Für alle
  // anderen Figuren ändert der Platzhalter nichts.
  const dest = grid[tr]?.[tf] || { p: 'p', white: !byWhite }
  for (let fr = 0; fr < 8; fr++) {
    for (let ff = 0; ff < 8; ff++) {
      const piece = grid[fr]?.[ff]
      if (!piece || piece.white !== byWhite) continue
      if (fr === tr && ff === tf) continue
      if (legal(grid, piece, ff, fr, tf, tr, tf - ff, tr - fr, dest)) return true
    }
  }
  return false
}

function kingAttacked(grid: Sq[][], white: boolean): boolean {
  for (let fr = 0; fr < 8; fr++) {
    for (let ff = 0; ff < 8; ff++) {
      const piece = grid[fr]?.[ff]
      if (piece && piece.p === 'k' && piece.white === white) return attacks(grid, ff, fr, !white)
    }
  }
  return false
}

/** Steht die Seite am Zug im Schach? */
export function inCheck(fen: string): boolean {
  const { grid, white } = parseBoard(fen)
  return kingAttacked(grid, white)
}

const CAPTURE_VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 }

function cheapestAttacker(grid: Sq[][], tf: number, tr: number, byWhite: boolean): number {
  const dest = grid[tr]?.[tf] || null
  let best = -1
  for (let fr = 0; fr < 8; fr++) {
    for (let ff = 0; ff < 8; ff++) {
      const piece = grid[fr]?.[ff]
      if (!piece || piece.white !== byWhite) continue
      if (fr === tr && ff === tf) continue
      if (!legal(grid, piece, ff, fr, tf, tr, tf - ff, tr - fr, dest)) continue
      const worth = CAPTURE_VALUE[piece.p] || 0
      if (best < 0 || worth < best) best = worth
    }
  }
  return best
}

/**
 * Was die Seite am Zug im nächsten Halbzug an Material gewinnt, wenn der
 * Gegner zurückschlägt. Grobe Schätzung, aber sie erkennt hängende Figuren —
 * ohne sie verschenkte Jarvis nach jedem Materialgriff die eigene Dame.
 */
export function threatValue(fen: string): number {
  const { grid, white } = parseBoard(fen)
  let best = 0
  for (let tr = 0; tr < 8; tr++) {
    for (let tf = 0; tf < 8; tf++) {
      const dest = grid[tr]?.[tf]
      if (!dest || dest.white === white) continue
      const worth = CAPTURE_VALUE[dest.p] || 0
      if (worth <= best) continue
      const attacker = cheapestAttacker(grid, tf, tr, white)
      if (attacker < 0) continue
      const gain = attacks(grid, tf, tr, !white) ? worth - attacker : worth
      if (gain > best) best = gain
    }
  }
  return best
}

function legal(
  grid: Sq[][],
  piece: { p: string; white: boolean },
  ff: number,
  fr: number,
  tf: number,
  tr: number,
  df: number,
  dr: number,
  dest: Sq,
): boolean {
  const dir = piece.white ? -1 : 1
  if (piece.p === 'p') {
    if (df === 0 && !dest) {
      if (dr === dir) return true
      if (dr === 2 * dir && ((piece.white && fr === 6) || (!piece.white && fr === 1)) && !grid[fr + dir][ff]) return true
    }
    if (Math.abs(df) === 1 && dr === dir && dest) return true
    return false
  }
  if (piece.p === 'n') return (Math.abs(df) === 1 && Math.abs(dr) === 2) || (Math.abs(df) === 2 && Math.abs(dr) === 1)
  if (piece.p === 'k') return Math.abs(df) <= 1 && Math.abs(dr) <= 1 && (df !== 0 || dr !== 0)
  if (piece.p === 'b') return Math.abs(df) === Math.abs(dr) && df !== 0 && clear(grid, ff, fr, tf, tr)
  if (piece.p === 'r') return (df === 0 || dr === 0) && (df !== 0 || dr !== 0) && clear(grid, ff, fr, tf, tr)
  if (piece.p === 'q') {
    const diag = Math.abs(df) === Math.abs(dr) && df !== 0
    const ortho = (df === 0 || dr === 0) && (df !== 0 || dr !== 0)
    return (diag || ortho) && clear(grid, ff, fr, tf, tr)
  }
  return false
}

function clear(grid: Sq[][], ff: number, fr: number, tf: number, tr: number): boolean {
  const sf = Math.sign(tf - ff)
  const sr = Math.sign(tr - fr)
  let f = ff + sf
  let r = fr + sr
  while (f !== tf || r !== tr) {
    if (grid[r][f]) return false
    f += sf
    r += sr
  }
  return true
}

export function legalMovesFrom(fen: string, from: string): string[] {
  if (!/^[a-h][1-8]$/.test(from)) return []
  const out: string[] = []
  for (let f = 0; f < 8; f++) {
    for (let r = 1; r <= 8; r++) {
      const to = `${String.fromCharCode(97 + f)}${r}`
      if (to === from) continue
      if (applyMove(fen, from + to)) out.push(to)
    }
  }
  return out
}

export function allLegalUci(fen: string): string[] {
  const { grid, white } = parseBoard(fen)
  const out: string[] = []
  for (let fr = 0; fr < 8; fr++) {
    for (let ff = 0; ff < 8; ff++) {
      const piece = grid[fr]?.[ff]
      if (!piece || piece.white !== white) continue
      const from = `${String.fromCharCode(97 + ff)}${8 - fr}`
      for (let tr = 0; tr < 8; tr++) {
        for (let tf = 0; tf < 8; tf++) {
          if (tr === fr && tf === ff) continue
          const to = `${String.fromCharCode(97 + tf)}${8 - tr}`
          const dest = from + to
          if (piece.p === 'p' && (tr === 0 || tr === 7)) {
            for (const promo of ['q', 'r', 'b', 'n'] as const) {
              if (applyMove(fen, dest + promo)) out.push(dest + promo)
            }
          } else if (applyMove(fen, dest)) {
            out.push(dest)
          }
        }
      }
    }
  }
  return out.sort()
}
