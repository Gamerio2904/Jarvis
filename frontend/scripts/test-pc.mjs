import assert from 'node:assert/strict'
import { startJarvisPcServer, lastActions } from '../../desktop/jarvis-pc.mjs'
import { sanitizePcHost } from '../src/engine/pc-host.ts'

assert.equal(sanitizePcHost(' http://192.168.1.20:18790/ '), '192.168.1.20')
assert.equal(sanitizePcHost('192.168.0.10'), '192.168.0.10')
assert.equal(sanitizePcHost('10.0.0.5, 172.22.0.1'), '10.0.0.5')
assert.equal(sanitizePcHost(''), '')

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
  const bad = await fetch(`${base}/v1/status`, { headers: { 'X-Jarvis-Token': 'nope' } }).then((r) => r.json())
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
  console.log('ok pc protocol')
} finally {
  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
}
