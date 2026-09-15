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
  loadFen,
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
assert.match(white, /color: #fcfdf9/)
assert.match(white, /-webkit-text-stroke/)
assert.match(black, /color: #0d130f/)
assert.match(black, /-webkit-text-stroke/)

// Leere Felder tragen keine Figurenfarbe.
const board = await readFile(new URL('../src/ui/lage/ChessBoard.tsx', import.meta.url), 'utf8')
assert.match(board, /p \? \(white \? 'w' : 'b'\) : ''/)

console.log('test:chess-engine ok', reply)
