import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const mem = Object.create(null)
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => {
    mem[k] = String(v)
  },
  removeItem: (k) => {
    delete mem[k]
  },
  clear: () => {
    for (const k of Object.keys(mem)) delete mem[k]
  },
}

const {
  START_FEN,
  allLegalUci,
  applyMove,
  handleChess,
  inCheck,
  legalMovesFrom,
  loadFen,
  parseChessIntent,
  saveFen,
  sideToMoveWhite,
  threatValue,
} = await import('../src/engine/chess.ts')
const { pickReplyMove } = await import('../src/engine/chess-engine.ts')

const start = START_FEN
assert.ok(allLegalUci(start).includes('e2e4'))
assert.ok(allLegalUci(start).includes('g1f3'))

const afterE4 = applyMove(start, 'e2e4')
assert.ok(afterE4)
assert.equal(sideToMoveWhite(afterE4), false)
const legalBlack = allLegalUci(afterE4)
assert.ok(legalBlack.includes('e7e5'))
assert.equal(legalBlack.includes('c8f5'), false)

const reply = pickReplyMove(afterE4)
assert.ok(reply)
assert.ok(legalBlack.includes(reply), `illegal engine move ${reply}`)
assert.notEqual(reply, 'c8f5')
assert.equal(reply, 'e7e5')

const afterReply = applyMove(afterE4, reply)
assert.ok(afterReply)
assert.equal(sideToMoveWhite(afterReply), true)

saveFen(start)
const neu = await handleChess('Schach neu')
assert.match(neu.reply || '', /Weiß/)
assert.match(neu.reply || '', /Schwarz/)

const user = await handleChess('Bauer e2 e4')
assert.equal(user.handled, true)
assert.match(user.reply || '', /e2–e4/)
assert.match(user.reply || '', /Ich spiele/)
assert.doesNotMatch(user.reply || '', /c8/)
assert.match(user.reply || '', /Weiß am Zug/)
const fen = loadFen()
assert.equal(fen.split(' ')[1], 'w')
assert.notEqual(fen.split(' ')[0], start.split(' ')[0])

const self = await handleChess('e7 e5')
assert.match(self.reply || '', /nicht legal|am Zug/)

// Der König zählt: gefesselte Figuren bleiben stehen, Matt und Patt heißen so.
const pin = '4q2k/8/8/8/8/8/4R3/4K3 w - - 0 1'
assert.equal(inCheck(pin), false)
assert.equal(applyMove(pin, 'e2d2'), null)
assert.equal(allLegalUci(pin).includes('e2d2'), false)
assert.ok(allLegalUci(pin).includes('e2e8'))

const mate = '7k/6Q1/5K2/8/8/8/8/8 b - - 0 1'
assert.equal(inCheck(mate), true)
assert.deepEqual(allLegalUci(mate), [])
const stale = '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'
assert.equal(inCheck(stale), false)
assert.deepEqual(allLegalUci(stale), [])

saveFen('7k/8/5K2/8/8/8/8/6Q1 w - - 0 1')
const mated = await handleChess('Dame g1 g7')
assert.match(mated.reply || '', /Schachmatt/)

/**
 * Rochade und En passant fehlten ganz: `Koenig e1 g1` hieß „nicht legal“, und
 * in einer normalen Partie rochiert man immer. Dazu schrieb `applyMove` die
 * Felder hinter der Stellung nie mit — `KQkq` blieb stehen, nachdem der König
 * gezogen war, und das En-passant-Feld galt bis zum Schluss.
 */
function tail(fen) {
  const bits = String(fen).split(' ')
  return { castle: bits[2] === '-' ? '' : bits[2], ep: bits[3] === '-' ? '' : bits[3], half: Number(bits[4]), full: Number(bits[5]) }
}
const castleFen = '4k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'
assert.equal(applyMove(castleFen, 'e1g1'), '4k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1')
assert.equal(applyMove(castleFen, 'e1c1'), '4k2r/8/8/8/8/8/8/2KR3R b kq - 1 1')
assert.equal(applyMove('4k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1', 'e8g8'), '5rk1/8/8/8/8/8/8/R3K2R w KQ - 1 2')
assert.equal(applyMove('4k2r/8/8/8/8/8/8/R3K2R w kq - 0 1', 'e1g1'), null)
assert.equal(applyMove('4k2r/8/8/8/8/8/8/R3K1NR w KQkq - 0 1', 'e1g1'), null)
assert.equal(applyMove('4k3/4r3/8/8/8/8/8/R3K2R w KQ - 0 1', 'e1g1'), null)
assert.equal(applyMove('4k3/5r2/8/8/8/8/8/R3K2R w KQ - 0 1', 'e1g1'), null)
assert.equal(applyMove('4k3/6r1/8/8/8/8/8/R3K2R w KQ - 0 1', 'e1g1'), null)
// Der Turm darf angegriffen sein, der König nicht.
assert.ok(applyMove('4k3/7r/8/8/8/8/8/R3K2R w KQ - 0 1', 'e1g1'))
assert.ok(applyMove('4k3/1r6/8/8/8/8/8/R3K3 w Q - 0 1', 'e1c1'))
// Ein Bauer deckt f1 diagonal, auch wenn dort niemand steht.
assert.equal(applyMove('4k3/8/8/8/8/8/6p1/R3K2R w KQ - 0 1', 'e1g1'), null)
assert.equal(tail(applyMove(castleFen, 'e1e2')).castle, 'kq')
assert.equal(tail(applyMove(castleFen, 'h1h2')).castle, 'Qkq')
assert.equal(tail(applyMove(castleFen, 'a1a2')).castle, 'Kkq')
assert.equal(tail(applyMove('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'a1a8')).castle, 'Kk')
assert.ok(allLegalUci(castleFen).includes('e1g1'))
assert.ok(legalMovesFrom(castleFen, 'e1').includes('g1'))

// Am Brett sagt niemand „König e1 g1“.
assert.equal(parseChessIntent('Rochade', true)?.kind, 'castle')
assert.equal(parseChessIntent('Rochade', true)?.side, 'short')
assert.equal(parseChessIntent('lange Rochade', true)?.side, 'long')
assert.equal(parseChessIntent('große Rochade', true)?.side, 'long')
assert.equal(parseChessIntent('0-0', true)?.side, 'short')
assert.equal(parseChessIntent('0-0-0', true)?.side, 'long')
saveFen('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1')
const rochade = await handleChess('Rochade')
assert.match(rochade.reply || '', /Kurze Rochade e1–g1/)
assert.match(loadFen(), /R4RK1/)
saveFen(start)
assert.match((await handleChess('lange Rochade')).reply || '', /Lange Rochade geht hier nicht/)

const epFen = '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'
assert.equal(applyMove(epFen, 'e5d6'), '4k3/8/3P4/8/8/8/8/4K3 b - - 0 1')
assert.equal(applyMove('4k3/8/8/3pP3/8/8/8/4K3 w - - 0 1', 'e5d6'), null)
assert.equal(applyMove('8/8/8/K2pP2q/8/8/8/4k3 w - d6 0 1', 'e5d6'), null)
assert.ok(allLegalUci(epFen).includes('e5d6'))
assert.equal(tail(applyMove(start, 'e2e4')).ep, 'e3')
assert.equal(tail(applyMove(applyMove(start, 'e2e4'), 'e7e5')).ep, 'e6')
assert.equal(tail(applyMove(applyMove(start, 'e2e4'), 'g8f6')).ep, '')
assert.equal(tail(applyMove(castleFen, 'e1e2')).half, 1)
assert.equal(tail(applyMove(start, 'e2e4')).half, 0)
assert.equal(tail(applyMove(applyMove(start, 'e2e4'), 'e7e5')).full, 2)

// Hängende Figuren erkennen, damit Jarvis keine Dame verschenkt.
assert.equal(threatValue('k7/8/8/8/3q4/2P5/8/K7 w - - 0 1'), 900)
assert.equal(threatValue('k7/8/8/2b5/3q4/2P5/8/K7 w - - 0 1'), 800)
const poison = 'rnb1kbnr/pppppppp/8/8/7q/6P1/PPPPPP1P/RNBQKBNR b KQkq - 0 1'
assert.notEqual(pickReplyMove(poison), 'h4g3')

// Figurenfarbe darf nicht am Feld hängen: weiße Figuren auf hellen Feldern
// waren dunkel, weil eine Regel Feld über Figur stellte.
const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
assert.equal(css.includes('.chess-sq.light.w'), false)
assert.equal(css.includes('.chess-sq.dark.b'), false)
const white = /\.chess-sq\.w \{([^}]*)\}/.exec(css)?.[1] || ''
const black = /\.chess-sq\.b \{([^}]*)\}/.exec(css)?.[1] || ''

/** 0 (schwarz) bis 1 (weiß). Feste Hex-Werte in Tests brechen bei jedem Farbdreh. */
function brightness(hex) {
  const h = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim())?.[1]
  assert.ok(h, `kein Hex: ${hex}`)
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Die erste Farbe der Regel ist die Füllung, der Rest ist die Kontur. */
function fillAndOutline(rule) {
  const fill = /color:\s*(#[0-9a-f]{3,8})/i.exec(rule)?.[1] || ''
  const outline = /text-shadow:\s*[^;]*?(#[0-9a-f]{6})/i.exec(rule)?.[1] || ''
  return [fill, outline]
}

const [wFill, wEdge] = fillAndOutline(white)
const [bFill, bEdge] = fillAndOutline(black)
// Weiß muss hell sein und schwarz dunkel, sonst wirken weiße Figuren schwarz.
assert.ok(brightness(wFill) > 0.9, `weiße Figur zu dunkel: ${wFill}`)
assert.ok(brightness(bFill) < 0.1, `schwarze Figur zu hell: ${bFill}`)
// Die Kontur trägt den Gegenton, damit die Figur auf jedem Feld ablesbar bleibt.
assert.ok(brightness(wEdge) < 0.2, `weiße Kontur zu hell: ${wEdge}`)
assert.ok(brightness(bEdge) > 0.8, `schwarze Kontur zu dunkel: ${bEdge}`)
// Als Konturlinie fraß die Kontur die dünnen Glyphenstellen auf.
assert.equal(white.includes('-webkit-text-stroke'), false)
assert.equal(black.includes('-webkit-text-stroke'), false)

// Leere Felder tragen keine Figurenfarbe.
const board = await readFile(new URL('../src/ui/lage/ChessBoard.tsx', import.meta.url), 'utf8')
assert.match(board, /p \? \(white \? 'w' : 'b'\) : ''/)

console.log('test:chess-engine ok', reply)
