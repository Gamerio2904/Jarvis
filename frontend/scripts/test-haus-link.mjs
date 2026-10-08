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

const { parseHausLink, parseHausQr, hausCode } = await import('../src/engine/haus-link.ts')
const { parseBackupIntent } = await import('../src/engine/backup.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { qrSvgDataUrl, qrImageDataUrl } = await import('../src/engine/xfer-codec.ts')
const { safeImageSrc } = await import('../src/engine/image-parse.ts')

assert.equal(parseHausLink('Hausstand übertragen'), 'offer')
assert.equal(parseHausLink('QR Code für Hausstand'), 'offer')
assert.equal(parseHausLink('qe Code für Hausstand'), 'offer')
assert.equal(parseHausLink('scanne qr Code'), 'scan')
assert.equal(parseHausLink('Scanne QR Code'), 'scan')
assert.equal(parseHausLink('PC QR scannen'), null)
assert.equal(parseBackupIntent('Hausstand exportieren'), 'export')
assert.equal(parseBackupIntent('Hausstand übertragen'), 'offer')
assert.equal(parseBackupIntent('scanne qr Code'), 'scan')

assert.equal(pickRoute('Hausstand übertragen'), 'backup')
assert.equal(pickRoute('QR Code für Hausstand'), 'backup')
assert.equal(pickRoute('scanne qr Code'), 'backup')
assert.equal(pickRoute('Hausstand exportieren'), 'backup')
assert.equal(pickRoute('Übertrage das fürs Tablet'), 'xfer')
assert.equal(pickRoute('PC QR scannen'), 'pc')

const url = 'http://192.168.1.20:43210/hausstand?t=abc123'
assert.equal(parseHausQr(hausCode(url)), url)
assert.equal(parseHausQr('jarvis-pc:v1|192.168.0.2|18790|x'), null)
const svg = qrSvgDataUrl(hausCode(url))
assert.ok(svg?.startsWith('data:image/svg+xml;charset=utf-8,'))
assert.equal(safeImageSrc(svg), svg)
const png = qrImageDataUrl(hausCode(url))
assert.ok(png?.startsWith('data:image/png;base64,'))
assert.equal(safeImageSrc(png), png)

console.log('ok test-haus-link')
