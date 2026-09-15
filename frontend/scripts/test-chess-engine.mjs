import assert from 'node:assert/strict'

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
  loadFen,
  saveFen,
  sideToMoveWhite,
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

console.log('test:chess-engine ok', reply)
