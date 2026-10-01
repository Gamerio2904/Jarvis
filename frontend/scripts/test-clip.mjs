// @ts-nocheck
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { buildAss, extractWords, handleClip as pcClip, renderLocal } from '../../desktop/clip-job.mjs'

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

const { parseClipIntent, confirmReply } = await import('../src/engine/clip-parse.ts')
const { acceptSegments, parseRankJson } = await import('../src/engine/clip-rank.ts')
const { cleanVisionTitle, handleClip } = await import('../src/engine/clip.ts')
const { callPc } = await import('../src/engine/pc.ts')
const { routeForEval } = await import('../src/engine/eval/route-eval.ts')
const { APP_VERSION, loadSettings, saveSettings } = await import('../src/engine/store.ts')

const GOLD = 'Schneide Highlights aus https://www.youtube.com/watch?v=aNvsF1jToJQ'

assert.equal(APP_VERSION, '18.25.2')
assert.equal(routeForEval(GOLD), 'clip')
assert.equal(routeForEval('Clip-Status'), 'clip')
assert.equal(routeForEval('YouTube auf dem Fernseher Rick and Morty'), 'tv')
assert.equal(routeForEval('Spiele ein YouTube Video auf dem Fernseher'), 'tv')
assert.equal(routeForEval('Wie gut ist Dune'), 'film')
assert.equal(routeForEval('Öffne TikTok'), 'wont')
assert.notEqual(routeForEval('https://www.youtube.com/watch?v=aNvsF1jToJQ'), 'clip')
assert.equal(parseClipIntent('https://www.youtube.com/shorts/aNvsF1jToJQ'), null)

const cut = parseClipIntent('Top eins aus https://youtu.be/aNvsF1jToJQ Titel 1: Bull Dragon')
assert.equal(cut?.kind, 'cut')
assert.equal(cut.urls[0], 'https://www.youtube.com/watch?v=aNvsF1jToJQ')
assert.equal(cut.titles[1], 'Bull Dragon')
assert.match(confirmReply(1), /kein Upload/)
assert.match(confirmReply(1), /eigenen Knopf/)
assert.equal(cleanVisionTitle('Bull Dragon Combination, wow', 2), 'Bull Dragon Combination wow')
assert.equal(cleanVisionTitle('x', 2), 'Abschnitt 2')

function grid(seconds) {
  const words = []
  for (let t = 0; t < seconds; t += 0.5) words.push({ t, d: 0.5, w: 'wort' })
  return words
}

const words = grid(300)
const kept = acceptSegments(
  [
    { start: 10, end: 40, quote: 'a' },
    { start: 0, end: 10, quote: 'kurz' },
    { start: 0, end: 90, quote: 'lang' },
    { start: 400, end: 430, quote: 'hinten' },
    { start: 50, end: 120, quote: 'b' },
    { start: 130, end: 200, quote: 'c' },
    { start: 210, end: 270, quote: 'd' },
  ],
  words,
  300,
)
assert.equal(kept.length, 3)
assert.ok(kept.every((row) => row.end - row.start >= 20 && row.end - row.start <= 75))
const sum = kept.reduce((n, row) => n + (row.end - row.start), 0)
assert.ok(sum <= 180)

const parsed = parseRankJson('Text davor [{"url":0,"start":1,"end":30,"quote":"x"}] danach')
assert.equal(parsed.length, 1)
assert.equal(parsed[0].url, 0)

const json3 = JSON.stringify({
  events: [
    {
      tStartMs: 1000,
      dDurationMs: 800,
      segs: [
        { utf8: 'Manhattan', tOffsetMs: 0 },
        { utf8: ' ', tOffsetMs: 200 },
        { utf8: 'portal', tOffsetMs: 400 },
      ],
    },
  ],
})
const pulled = extractWords(json3)
assert.deepEqual(
  pulled.map((word) => word.w),
  ['Manhattan', 'portal'],
)

const armed = await handleClip('c1', GOLD)
assert.equal(armed.handled, true)
assert.match(armed.reply, /Ja\?/)
assert.ok(loadSettings().last_clip_json.includes('confirm'))
const stopped = await handleClip('c1', 'Nein')
assert.equal(stopped.reply, 'Abgebrochen.')
assert.equal(loadSettings().last_clip_json, '')

await handleClip('c1', GOLD)
const down = await handleClip('c1', 'Ja')
assert.equal(down.reply, 'Kein Groq-Schlüssel. Ohne den wähle ich die Stellen nicht.')
assert.ok(loadSettings().last_clip_json.includes('confirm'))
const closed = await handleClip('c1', 'Clip-Status')
assert.equal(closed.reply, 'PC-Fenster ist zu.')

const server = http.createServer((req, res) => {
  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    const body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
    if (req.headers['x-jarvis-token'] !== 'tok') {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, message: 'token' }))
      return
    }
    if (body.action === 'status') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, phase: 'idle', message: 'Kein Schnitt läuft.' }))
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: false, error: 'tool', tool: 'ffmpeg', message: 'ffmpeg fehlt.' }))
  })
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
saveSettings({
  pc_enabled: true,
  pc_host: '127.0.0.1',
  pc_port: port,
  pc_token: 'tok',
  last_clip_json: '',
})
const idle = await handleClip('c1', 'Clip-Status')
assert.equal(idle.reply, 'Kein Schnitt läuft.')
saveSettings({
  last_clip_json: JSON.stringify({ kind: 'job', id: 'alt', at: Date.now(), titles: ['A'] }),
})
const gone = await handleClip('c1', 'Clip-Status')
assert.equal(gone.reply, 'PC neu gestartet, Job weg.')
const tool = await callPc('/v1/clip', { action: 'probe', urls: ['https://www.youtube.com/watch?v=aNvsF1jToJQ'] }, 3000)
assert.equal(tool.ok, false)
assert.equal(tool.tool, 'ffmpeg')
server.close()

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-clip-'))
const work = path.join(root, 'work')
fs.mkdirSync(work, { recursive: true })
fs.writeFileSync(
  path.join(work, 'current.json'),
  JSON.stringify({ id: 'old', at: Date.now() - 31 * 60 * 1000, phase: 'render', message: 'alt' }),
)
const expired = await pcClip({ action: 'status' }, { root })
assert.equal(expired.phase, 'idle')
assert.equal(expired.message, 'Kein Schnitt läuft.')
fs.writeFileSync(
  path.join(work, 'current.json'),
  JSON.stringify({ id: 'run', at: Date.now(), phase: 'render', message: 'Schneide.' }),
)
const locked = await pcClip(
  {
    action: 'render',
    segments: [{ url: 'https://www.youtube.com/watch?v=aNvsF1jToJQ', start: 1, end: 30, title: 'x' }],
  },
  { root },
)
assert.match(locked.message, /schon ein Schnitt/)

const ass = buildAss({
  theme: 'Rick And Morty',
  duration: 4,
  pieces: [
    { title: 'Bull Dragon', duration: 2, words: [{ t: 0.2, d: 0.3, w: 'Manhattan' }] },
    { title: 'Cow Horns', duration: 2, words: [{ t: 0.1, d: 0.3, w: 'portal' }] },
  ],
})
assert.match(ass, /Bull Dragon/)
assert.match(ass, /Cow Horns/)
assert.match(ass, /Manhattan/)
assert.match(ass, /Dialogue: 0,0:00:02\.00,.*,Item2/)

const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-fix-'))
const source = path.join(fixtureDir, 'src.mp4')
const made = spawnSync(
  'ffmpeg',
  [
    '-y',
    '-f',
    'lavfi',
    '-i',
    'color=c=0x224466:s=640x360:d=4:r=30',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=440:duration=4',
    '-shortest',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    source,
  ],
  { encoding: 'utf8' },
)
assert.equal(made.status, 0, made.stderr?.slice(-300))
const rendered = await renderLocal({
  root,
  source,
  theme: 'Rick And Morty',
  pieces: [
    { start: 0, end: 2, title: 'Bull Dragon', words: [{ t: 0.4, d: 0.4, w: 'Manhattan' }] },
    { start: 2, end: 4, title: 'Cow Horns', words: [{ t: 2.2, d: 0.4, w: 'portal' }] },
  ],
})
assert.equal(rendered.ok, true, rendered.detail || rendered.message)
const caption = fs.readFileSync(rendered.ass, 'utf8')
assert.match(caption, /Bull Dragon/)
assert.match(caption, /Cow Horns/)
const probe = spawnSync(
  'ffprobe',
  ['-v', 'error', '-show_entries', 'stream=width,height', '-show_entries', 'format=duration', '-of', 'json', rendered.path],
  { encoding: 'utf8' },
)
const info = JSON.parse(probe.stdout)
const video = info.streams.find((stream) => stream.width)
assert.equal(video.width, 1080)
assert.equal(video.height, 1920)
const duration = Number(info.format.duration)
assert.ok(Math.abs(duration - 4) < 0.8, `Dauer ${duration}`)

console.log('ok test-clip')
