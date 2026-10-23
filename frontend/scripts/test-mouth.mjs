import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  createMouthDirector,
  currentMouthLane,
  resetMouthSession,
} from '../src/engine/mouth.ts'

function blob(n) {
  return new Blob([new Uint8Array(n)])
}

function director(over = {}, synth = {}) {
  const calls = []
  const edge = synth.edge || (async () => blob(1))
  const gemini = synth.gemini || (async () => blob(2))
  const dir = createMouthDirector(
    {
      voiceTts: 'auto',
      geminiReady: true,
      edgeTimeoutMs: 3200,
      retryTimeoutMs: 4500,
      preferEdge: () => true,
      ...over,
    },
    {
      edge: async (text, timeoutMs) => {
        calls.push(['edge', text, timeoutMs])
        return edge(text, timeoutMs)
      },
      gemini: async (text) => {
        calls.push(['gemini', text])
        return gemini(text)
      },
    },
  )
  return { dir, calls }
}

resetMouthSession()
{
/** @type {((value?: any) => void) | undefined} */
  let release
  const gate = new Promise((r) => {
    release = r
  })
  let started = 0
  const { dir, calls } = director(
    {},
    {
      edge: async (text) => {
        started += 1
        if (text === 'eins') {
          await gate
          return blob(1)
        }
        return null
      },
      gemini: async () => {
        throw new Error('gemini darf die zweite Spur nicht öffnen')
      },
    },
  )
  const first = dir.prepare('eins')
  const second = dir.prepare('zwei')
  assert.equal(started, 1)
  release?.()
  const a = await first
  const b = await second
  assert.equal(/** @type {any} */ (a)?.size ?? 0, 1)
  assert.equal(b, 'silence')
  assert.equal(calls.some((row) => row[0] === 'gemini'), false)
  assert.equal(currentMouthLane(), 'edge')
}

resetMouthSession()
{
  const { dir, calls } = director(
    {},
    {
      edge: async () => null,
      gemini: async () => null,
    },
  )
  assert.equal(await dir.prepare('eins'), 'native')
  assert.equal(await dir.prepare('zwei'), 'native')
  assert.equal(calls.filter((row) => row[0] === 'edge').length, 2)
  assert.equal(calls.filter((row) => row[0] === 'gemini').length, 1)
  assert.equal(calls.filter((row) => row[1] === 'zwei').length, 0)
  assert.equal(currentMouthLane(), null)
}

resetMouthSession()
{
  let n = 0
  const { dir, calls } = director(
    {},
    {
      edge: async () => {
        n += 1
        return n >= 2 ? blob(4) : null
      },
      gemini: async () => blob(9),
    },
  )
  const audio = await dir.prepare('Wetter heute.')
  assert.equal(/** @type {any} */ (audio)?.size ?? 0, 4)
  assert.equal(calls.some((row) => row[0] === 'gemini'), false)
  assert.equal(calls[0][2], 3200)
  assert.equal(calls[1][2], 4500)
}

resetMouthSession()
{
  const { dir, calls } = director(
    {},
    {
      edge: async () => null,
      gemini: async () => blob(2),
    },
  )
  assert.equal(/** @type {any} */ ((await dir.prepare('eins')))?.size ?? 0, 2)
  const again = createMouthDirector(
    {
      voiceTts: 'auto',
      geminiReady: true,
      edgeTimeoutMs: 100,
      retryTimeoutMs: 100,
      preferEdge: () => true,
    },
    {
      edge: async () => {
        calls.push(['edge-later'])
        return blob(1)
      },
      gemini: async (text) => {
        calls.push(['gemini', text])
        return blob(2)
      },
    },
  )
  assert.equal(/** @type {any} */ ((await again.prepare('zwei')))?.size ?? 0, 2)
  assert.equal(calls.some((row) => row[0] === 'edge-later'), false)
  assert.equal(currentMouthLane(), 'gemini')
}

resetMouthSession()
{
  const first = director({}, { edge: async () => blob(1), gemini: async () => blob(2) })
  assert.equal(/** @type {any} */ ((await first.dir.prepare('Das Wetter ist gut.')))?.size ?? 0, 1)
  const second = director(
    { preferEdge: () => false },
    {
      edge: async () => blob(1),
      gemini: async () => {
        throw new Error('Algieba darf Conrad nicht ablösen')
      },
    },
  )
  assert.equal(/** @type {any} */ ((await second.dir.prepare('Okay.')))?.size ?? 0, 1)
  assert.equal(second.calls.some((row) => row[0] === 'gemini'), false)
}

resetMouthSession()
{
/** @type {((value?: any) => void) | undefined} */
  let release
  const gate = new Promise((r) => {
    release = r
  })
  const first = director(
    {},
    {
      edge: async () => {
        await gate
        return blob(1)
      },
    },
  )
  const pending = first.dir.prepare('alt')
  const second = director(
    {},
    {
      edge: async () => null,
      gemini: async () => blob(2),
    },
  )
  const audio = await second.dir.prepare('neu')
  release?.()
  await pending
  assert.equal(/** @type {any} */ (audio)?.size ?? 0, 2)
  assert.equal(currentMouthLane(), 'gemini')
}

resetMouthSession()
{
  const { dir, calls } = director({ voiceTts: 'system', geminiReady: true })
  assert.equal(await dir.prepare('Hallo.'), 'native')
  assert.equal(calls.length, 0)
}

resetMouthSession()
{
  const { dir, calls } = director(
    { voiceTts: 'gemini', preferEdge: () => true },
    { gemini: async () => blob(2), edge: async () => blob(1) },
  )
  assert.equal(/** @type {any} */ ((await dir.prepare('Das ist Deutsch.')))?.size ?? 0, 2)
  assert.equal(calls[0][0], 'gemini')
  assert.equal(calls.some((row) => row[0] === 'edge'), false)
}

{
  const voiceSrc = readFileSync(new URL('../src/native/voice.ts', import.meta.url), 'utf8')
  assert.match(voiceSrc, /createMouthDirector/)
  assert.match(voiceSrc, /preferEdgeForReply/)
  assert.match(voiceSrc, /Lock the winning lane/)
  assert.doesNotMatch(voiceSrc, /blob \|\| 'native'/)
  assert.doesNotMatch(voiceSrc, /firstBlobWins/)
  const java = readFileSync(new URL('../native/voice/JarvisVoicePlugin.java', import.meta.url), 'utf8')
  assert.match(java, /preemptPlayback/)
  const speak = java.slice(java.indexOf('private void trySpeak'), java.indexOf('private void waitUntilTtsQuiet'))
  assert.match(speak, /preemptPlayback\(\)/)
  const play = java.slice(java.indexOf('public void playMp3'), java.indexOf('private void startMp3'))
  assert.match(play, /tts\.stop\(\)/)
}

console.log('mouth ok')
