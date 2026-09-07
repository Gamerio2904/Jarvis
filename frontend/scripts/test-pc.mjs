import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { startJarvisPcServer, lastActions } from '../../desktop/jarvis-pc.mjs'
import { sanitizePcHost } from '../src/engine/pc-host.ts'
import { formatPcPairPayload, parsePcPairPayload, pcPairRejectReason } from '../src/engine/pc-pair.ts'

assert.equal(sanitizePcHost(' http://192.168.1.20:18790/ '), '192.168.1.20')
assert.equal(sanitizePcHost('192.168.0.10'), '192.168.0.10')
assert.equal(sanitizePcHost('10.0.0.5, 172.22.0.1'), '10.0.0.5')
assert.equal(sanitizePcHost(''), '')

assert.equal(parsePcPairPayload(formatPcPairPayload('127.0.0.1', 18790, 'AB12CD34'))?.token, 'AB12CD34')
assert.match(pcPairRejectReason('jarvis-pc:v1|8.8.8.8|18790|AB12CD34'), /192\.168/)
assert.match(pcPairRejectReason('http://172.22.0.1:18790/?t=654321'), /192\.168/)

const desktopDir = join(dirname(fileURLToPath(import.meta.url)), '../../desktop')
const pairHtml = readFileSync(join(desktopDir, 'pair.html'), 'utf8')
assert.match(pairHtml, /%%PAYLOAD%%/)
assert.match(readFileSync(join(desktopDir, 'qrcode.min.js'), 'utf8'), /qrcode-generator/)
assert.match(readFileSync(join(desktopDir, 'JarvisPC.ps1'), 'utf8'), /QR-Code öffnen/)
assert.match(readFileSync(join(desktopDir, 'JarvisPC.ps1'), 'utf8'), /Test-LikelyLan/)

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

const port = 18791
const token = '654321'
const server = await startJarvisPcServer({ port, token, stub: true, host: '127.0.0.1' })
const base = `http://127.0.0.1:${port}`

async function post(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Jarvis-Token': token },
    body: JSON.stringify(body || {}),
  })
  return res.json()
}

try {
  const badRes = await fetch(`${base}/v1/status`, { headers: { 'X-Jarvis-Token': 'nope' } })
  assert.equal(badRes.status, 401)
  const bad = await badRes.json()
  assert.equal(bad.ok, false)
  const st = await fetch(`${base}/v1/status`, { headers: { 'X-Jarvis-Token': token } }).then((r) => r.json())
  assert.equal(st.ok, true)
  const shot = await post('/v1/screenshot', {})
  assert.equal(shot.ok, true)
  assert.ok(String(shot.image).length > 20)
  const click = await post('/v1/input', { kind: 'click', nx: 0.5, ny: 0.5 })
  assert.equal(click.ok, true)
  const launch = await post('/v1/launch', { query: 'fifa' })
  assert.equal(launch.ok, true)
  const missing = await post('/v1/launch', { query: 'missing-app' })
  assert.equal(missing.ok, false)
  const files = await post('/v1/files', { op: 'list', path: 'desktop' })
  assert.equal(files.ok, true)
  assert.ok(lastActions.includes('launch:fifa'))

  const { saveSettings, loadSettings } = await import('../src/engine/store.ts')
  const rejected = parsePcPairPayload(formatPcPairPayload('8.8.8.8', port, token))
  assert.equal(rejected, null)
  const pair = parsePcPairPayload(formatPcPairPayload('127.0.0.1', port, token))
  assert.ok(pair)
  saveSettings({
    pc_host: pair.host,
    pc_port: pair.port,
    pc_token: pair.token,
    pc_enabled: true,
  })
  const ping = await fetch(`${base}/v1/status`, { headers: { 'X-Jarvis-Token': pair.token } })
  assert.equal(ping.status, 200)
  const pingJson = await ping.json()
  assert.equal(pingJson.ok, true)
  const saved = loadSettings()
  assert.equal(saved.pc_host, '127.0.0.1')
  assert.equal(saved.pc_port, port)
  assert.equal(saved.pc_token, token)
  assert.equal(saved.pc_enabled, true)
  console.log('ok pc protocol')
} finally {
  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
}
