/**
 * Sprints 272–281: Fakten-Absage, Tanke/POI ohne Zweitversuch, Widerspruch,
 * Abbruch mit Abkürzungsliste.
 */
import assert from 'node:assert/strict'
import { agentById } from '../src/engine/agents/catalog.ts'
import { dispatchAttempts } from '../src/engine/agents/bus.ts'
import { failureReply } from '../src/engine/director.ts'
import { contradictionSearchAsk, looksFactualContradiction } from '../src/engine/last-step.ts'
import { pickRouteFromCtx } from '../src/engine/route-pick.ts'

const EMPTY = {
  conversationId: 't',
  text: '',
  lastTool: '',
  lastMedium: '',
  inDrive: false,
  weatherLast: null,
  plugNames: [],
  lastPlace: '',
}

function pick(text, lastTool = '') {
  return pickRouteFromCtx({ ...EMPTY, text, lastTool })
}

{
  const fuel = agentById('fuel')
  const poi = agentById('poi')
  const weather = agentById('weather')
  const sport = agentById('sport')
  assert.equal(fuel?.factual, true)
  assert.equal(poi?.factual, true)
  assert.equal(weather?.factual, true)
  assert.equal(sport?.factual, true)
  assert.equal(fuel?.sideEffect, 'device', 'Tanke nicht mehr read — sonst doppelte Navi')
  assert.equal(poi?.sideEffect, 'device')
  assert.equal(weather?.sideEffect, 'read')
  assert.equal(dispatchAttempts('read'), 2)
  assert.equal(dispatchAttempts('device'), 1)
  assert.equal(dispatchAttempts('write'), 1)
}

{
  const open = { handled: false, failed: true, failReason: 'breaker', internal: [] }
  assert.match(failureReply('weather', open), /rate nicht/)
  assert.match(failureReply('fuel', { handled: false, failed: true, failReason: 'timeout', internal: [] }), /rate nicht/)
  assert.match(failureReply('sport', { handled: false, failed: true, failReason: 'error', internal: [] }), /rate nicht/)
  assert.equal(
    failureReply('news', open),
    '',
    'Nachrichten ohne factual dürfen weiterfallen',
  )
  assert.match(failureReply('tv', open), /nichts geändert/)
}

{
  assert.equal(looksFactualContradiction('Das stimmt nicht'), true)
  assert.equal(looksFactualContradiction('Ja das ist stand jetzt nicht der Fall'), true)
  assert.equal(looksFactualContradiction('Guten Morgen'), false)
  assert.equal(
    contradictionSearchAsk('Das stimmt nicht', { last_step_tool: 'memory', last_step_utterance: 'Was trinke ich?' }),
    null,
  )
  assert.equal(
    contradictionSearchAsk('Das stimmt nicht', {
      last_step_tool: 'llm',
      last_step_utterance: 'Wahlergebnis Sachsen-Anhalt',
    }),
    'Wahlergebnis Sachsen-Anhalt',
  )
  assert.equal(
    contradictionSearchAsk('nicht der Fall', {
      last_step_tool: 'research',
      last_step_utterance: 'Wahlergebnis Sachsen-Anhalt',
    }),
    'Wahlergebnis Sachsen-Anhalt',
  )
}

{
  assert.equal(pick('Das stimmt nicht'), 'memory')
  assert.equal(pick('Das stimmt nicht', 'memory'), 'memory')
  assert.equal(pick('Das stimmt nicht', 'llm'), null, 'nach LLM zieht Widerspruch keine Memory-Route')
  assert.equal(pick('Das stimmt nicht', 'research'), null)
}

{
  assert.equal(pick('Wo ist die Apotheke'), 'poi', 'device-Kosten dürfen POI nicht an Maps verlieren')
  assert.equal(pick('nächste Tankstelle'), 'fuel')
}

console.log('test:sprints-272-281 ok')
