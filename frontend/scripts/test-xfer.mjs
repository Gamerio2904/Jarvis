// @ts-nocheck
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import jsQR from 'jsqr'

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

const { parseXferIntent } = await import('../src/engine/xfer-parse.ts')
const {
  assembleChunks,
  maxSliceChars,
  parseXferChunk,
  planTransfer,
  renderRgba,
} = await import('../src/engine/xfer-codec.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')

assert.equal(parseXferIntent('Übertrage das fürs Tablet')?.kind, 'send')
assert.equal(parseXferIntent('Übertrage das fürs Handy')?.kind, 'send')
assert.equal(parseXferIntent('Mach den QR-Code')?.kind, 'send')
assert.equal(parseXferIntent('Mach den QR Code')?.kind, 'send')
assert.deepEqual(parseXferIntent('Zum Kopieren: Türcode 4711')?.copies, ['Türcode 4711'])
assert.deepEqual(
  parseXferIntent('Das hier zum Kopieren als Anhang in der Nachricht: WLAN Blau12')?.copies,
  ['WLAN Blau12'],
)
const multi = parseXferIntent('Übertrage das fürs Tablet. Zum Kopieren:\nWLAN Blau12\nTürcode 4711')
assert.deepEqual(multi?.copies, ['WLAN Blau12', 'Türcode 4711'])
assert.equal(parseXferIntent('PC QR scannen'), null)
assert.equal(parseXferIntent('Lies das PDF'), null)
assert.equal(parseXferChunk('jarvis-pc:v1|host|1|token'), null)

assert.equal(pickRoute('Übertrage das fürs Tablet'), 'xfer')
assert.equal(pickRoute('Mach den QR-Code'), 'xfer')
assert.equal(pickRoute('PC QR scannen'), 'pc')
assert.equal(pickRoute('Lies das PDF'), 'doc')
assert.equal(pickRoute('nächster Lidl'), 'poi')

const cap = maxSliceChars()
assert.ok(cap >= 200, `slice ${cap}`)
const only = planTransfer('abcd1234', ['WLAN Blau12'], [])
assert.equal(only.inside.length, 0)
assert.ok(only.codes.length >= 1 && only.codes.length <= 6)
const back = assembleChunks(only.codes.map(parseXferChunk))
assert.deepEqual(back?.c, ['WLAN Blau12'])
assert.deepEqual(back?.f, [])

const small = { name: 'note.txt', mime: 'text/plain', b64: btoa('hallo') }
const big = { name: 'gross.pdf', mime: 'application/pdf', b64: 'A'.repeat(cap * 8) }
const mixed = planTransfer('abcd1234', [], [big, small])
assert.ok(mixed.inside.includes('note.txt'))
assert.ok(mixed.outside.includes('gross.pdf'))
assert.ok(!mixed.codes.join('').includes(big.b64.slice(0, 80)))
const files = assembleChunks(mixed.codes.map(parseXferChunk))
assert.equal(files?.f.length, 1)
assert.equal(files?.f[0].name, 'note.txt')
assert.equal(files?.f[0].b64, small.b64)

const bmp = renderRgba(only.codes[0])
assert.ok(bmp)
const hit = jsQR(bmp.data, bmp.width, bmp.height)
assert.equal(hit?.data, only.codes[0])

console.log('ok test-xfer')
