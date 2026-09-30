import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

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

const { fileBotAsk, offerForResult, parseBotAskIntent, readBotAsk } = await import('../src/engine/bot-ask.ts')
const { handleAblauf } = await import('../src/engine/ablauf.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { loadSettings, put, saveSettings } = await import('../src/engine/store.ts')

assert.equal(fileBotAsk({ from: 'idea', agent: 'kein-bot', task: 'Suche im Internet nach Preis', why: 'Netz' }), null)
assert.equal(fileBotAsk({ from: 'idea', agent: 'idea', task: 'Zeig mir meine Ideen', why: 'Ideen' }), null)

const weatherRoute = pickRoute('Wie wird das Wetter morgen in Berlin')
const weatherOffer = offerForResult({
  from: 'idea',
  task: 'Wie wird das Wetter morgen in Berlin',
  reply: 'Noch leer.',
  empty: true,
  taken: ['idea'],
  routed: weatherRoute,
})
assert.equal(weatherRoute, 'weather')
assert.equal(weatherOffer?.agent, 'weather')
assert.equal(weatherOffer?.task, 'Wie wird das Wetter morgen in Berlin')

const researchOffer = offerForResult({
  from: 'idea',
  task: 'Wie hoch ist der Benzinpreis in Deutschland?',
  reply: 'Noch leer.',
  empty: true,
  taken: ['idea'],
  routed: pickRoute('Wie hoch ist der Benzinpreis in Deutschland?'),
})
assert.equal(researchOffer?.agent, 'research')
assert.match(researchOffer?.task || '', /^Suche im Internet nach /)

assert.equal(
  offerForResult({
    from: 'idea',
    task: 'Zeig mir meine Ideen',
    reply: 'Keine offenen Ideen.',
    empty: false,
    taken: ['idea'],
    routed: 'idea',
  }),
  null,
)

const first = fileBotAsk({
  from: 'alarm',
  agent: 'idea',
  task: 'Zeig mir meine Ideen',
  why: 'Ideen',
})
assert.ok(first)
assert.equal(fileBotAsk({ from: 'alarm', agent: 'news', task: 'Nachrichten', why: 'Nachrichten' }), null)
assert.equal(parseBotAskIntent('Ja')?.kind, 'accept')
saveSettings({ proposal_pending: true })
assert.equal(parseBotAskIntent('Ja'), null)
assert.equal(parseBotAskIntent('Dazuholen')?.kind, 'accept')
saveSettings({ proposal_pending: false })

const yes = await handleAblauf('c-ask', 'Ja')
assert.match(yes.reply || '', /Keine offenen Ideen/)
assert.equal(readBotAsk(), null)
const idle = await handleAblauf('c-ask', 'Ja')
assert.equal(idle.handled, false)

saveSettings({ ablauf_id: 'plan-ask', ablauf_status: 'warten' })
await put('plans', {
  id: 'plan-ask',
  title: 'Preis',
  work: ['Preis', 'Ideen'],
  waves: [
    { n: 1, cards: [{ n: 1, agent: 'idea', task: 'Wie hoch ist der Benzinpreis in Deutschland?', state: 'vorgeschlagen' }] },
    { n: 2, cards: [{ n: 2, agent: 'idea', task: 'Alle Ideen', state: 'vorgeschlagen' }] },
  ],
  gray: [],
  status: 'warten',
  created_at: '2026-01-05T00:00:00.000Z',
  updated_at: '2026-01-05T00:00:00.000Z',
})
const ran = await handleAblauf('c-ask', 'So')
assert.match(ran.reply || '', /Darf Recherche dazukommen/)
assert.match(ran.reply || '', /Suche im Internet nach /)
assert.equal(loadSettings().ablauf_status, 'fragt')
const mid = readBotAsk()
assert.equal(mid?.agent, 'research')
assert.equal(mid?.from, 'idea')
const { get } = await import('../src/engine/store.ts')
const paused = await get('plans', 'plan-ask')
assert.equal(paused.waves[1].cards[0].state, 'vorgeschlagen')

const no = await handleAblauf('c-ask', 'Nein')
assert.match(no.reply || '', /Recherche bleibt draußen/)
assert.match(no.reply || '', /Keine Ideen/)
assert.equal(readBotAsk(), null)
assert.equal(loadSettings().ablauf_status, 'fertig')

saveSettings({ ablauf_id: 'plan-zu', ablauf_status: 'fragt', bot_ask_json: JSON.stringify({
  id: 'a',
  from: 'idea',
  agent: 'research',
  task: 'Suche im Internet nach Preis',
  why: 'Internet-Recherche',
  ablauf_id: 'plan-zu',
  after_wave: 1,
}) })
await put('plans', {
  id: 'plan-zu',
  title: 'Zu',
  work: ['Preis'],
  waves: [{ n: 1, cards: [{ n: 1, agent: 'idea', task: 'Wie hoch ist der Benzinpreis in Deutschland?', state: 'leer', result: 'Noch leer.' }] }],
  gray: [],
  status: 'fragt',
  created_at: '2026-01-06T00:00:00.000Z',
  updated_at: '2026-01-06T00:00:00.000Z',
})
const closed = await handleAblauf('c-ask', 'Plan zu')
assert.match(closed.reply || '', /Ablauf zu/)
assert.equal(readBotAsk(), null)
assert.equal(loadSettings().ablauf_status, 'zu')

console.log('ok test-bot-ask')
