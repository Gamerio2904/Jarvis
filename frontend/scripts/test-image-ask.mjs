// @ts-nocheck — Test-Skript mit losen Literalen/Mocks; Laufzeit wird vom Test selbst geprüft.
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

const { parseImageAsk, safeImageSrc } = await import('../src/engine/image-parse.ts')
const { crestFromTeams, thumbFromSummary, wikiTitle } = await import('../src/engine/image-fetch.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')

const elbe = parseImageAsk('Zeig mir ein Bild der Elbe')
assert.equal(elbe?.kind, 'photo')
assert.equal(elbe?.q.toLowerCase(), 'elbe')

const wappen = parseImageAsk('wie sieht das wappen von bayern münchen aus')
assert.equal(wappen?.kind, 'crest')
assert.match(wappen?.q || '', /bayern/i)

assert.equal(parseImageAsk('erkläre photosynthese'), null)
assert.equal(parseImageAsk('Zeig mir London'), null)
assert.equal(parseImageAsk('wie wird das wetter'), null)
assert.equal(parseImageAsk('mach ein Foto'), null)

assert.equal(pickRoute('Zeig mir ein Bild der Elbe'), 'search')
assert.equal(pickRoute('wie sieht das wappen von bayern münchen aus'), 'search')
assert.equal(pickRoute('Zeig mir London'), 'hud')

assert.equal(safeImageSrc('https://upload.wikimedia.org/a.jpg'), 'https://upload.wikimedia.org/a.jpg')
assert.equal(safeImageSrc('http://example.com/a.jpg'), null)
assert.equal(safeImageSrc('javascript:alert(1)'), null)
assert.equal(safeImageSrc('data:image/jpeg;base64,abc'), 'data:image/jpeg;base64,abc')
const qrSvg = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E'
assert.equal(safeImageSrc(qrSvg), qrSvg)
assert.equal(safeImageSrc('data:image/svg+xml,<svg></svg>'), null)
assert.equal(safeImageSrc('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='), null)

assert.equal(wikiTitle('elbe'), 'Elbe')
assert.equal(
  thumbFromSummary({ thumbnail: { source: 'https://upload.wikimedia.org/elbe.jpg' } }),
  'https://upload.wikimedia.org/elbe.jpg',
)
assert.equal(thumbFromSummary({ type: 'disambiguation', thumbnail: { source: 'https://upload.wikimedia.org/x.jpg' } }), null)
assert.equal(thumbFromSummary({ thumbnail: { source: 'http://insecure.example/a.jpg' } }), null)

const icon = crestFromTeams(
  [{ teamName: 'FC Bayern München', shortName: 'Bayern', teamIconUrl: 'https://example.com/bayern.png' }],
  'bayern münchen',
)
assert.equal(icon, 'https://example.com/bayern.png')
assert.equal(
  crestFromTeams([{ teamName: '1. FC Union Berlin', teamIconUrl: 'http://example.com/u.png' }], 'union berlin'),
  null,
)

console.log('ok image-ask')
