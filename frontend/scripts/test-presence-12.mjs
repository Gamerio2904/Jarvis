import assert from 'node:assert/strict'
import { APP_VERSION } from '../src/engine/store.ts'
import { tabletCommandCenter, TABLET_BP, lageSceneOf } from '../src/engine/layout-probe.ts'
import { parseDeskIntent } from '../src/engine/desk-parse.ts'
import { handleDesk } from '../src/engine/desk.ts'
import {
  handlePresenceHttp,
  presenceWriteAllowed,
  isPresenceLan,
  newPresenceToken,
  tokensMatch,
  PRESENCE_PORT,
  ROLE_COPY,
  WONT_COPY,
  VR_PARKING,
  bindStatusLine,
  isPresenceWindow,
} from '../src/engine/presence.ts'
import { TEST_COPY_GROUPS } from '../src/engine/test-copy.ts'
import { filterTopics } from '../src/engine/settings-ia.ts'

assert.equal(APP_VERSION, '13.30.0')
assert.equal(PRESENCE_PORT, 18791)

// F1 Tablet
{
  const f1 = tabletCommandCenter({
    width: 900,
    lageOn: true,
    lageWide: true,
    messagesHidden: false,
    composerVisible: true,
  })
  assert.equal(f1.ok, true)
  assert.equal(f1.mode, 'tablet')
  assert.equal(lageSceneOf(900, true), false)
}

// F2 Handy-Portrait + Lage
{
  const f2 = tabletCommandCenter({
    width: 390,
    lageOn: true,
    lageWide: false,
    messagesHidden: true,
    composerVisible: true,
  })
  assert.equal(f2.ok, true)
  assert.equal(f2.mode, 'phone-scene')
  assert.ok(/weicht/.test(f2.detail))
}

// F3 Presence aus = kein Schreib
{
  const off = presenceWriteAllowed({
    enabled: false,
    expectedToken: 'aabbccddeeff0011',
    givenToken: 'aabbccddeeff0011',
    remoteHost: '192.168.1.20',
  })
  assert.equal(off.ok, false)
  assert.match(off.error, /Presence aus/)
}

// F4 Presence an + Token
{
  const token = 'aabbccddeeff00112233445566778899'
  const store = {
    loadSettings: () => ({ presence_enabled: true, presence_token: token }),
    listConversations: async () => [{ id: 'c1' }],
    listMessages: async () => [
      { id: 'm1', conversation_id: 'c1', role: 'user', content: 'Was trinke ich?', created_at: '2026-09-03T00:00:00Z' },
    ],
    addNote: async (text) => ({ id: 'n1', body: text }),
    notes: [],
  }
  const posted = []
  const res = await handlePresenceHttp(
    {
      method: 'POST',
      path: '/v1/presence',
      headers: { 'X-Jarvis-Token': token },
      body: JSON.stringify({ text: 'Was trinke ich?' }),
      remoteHost: '192.168.1.20',
    },
    async (conversationId, text) => {
      posted.push({ conversationId, text })
      return { reply: 'Mate.' }
    },
    store,
  )
  assert.equal(res.status, 200)
  assert.equal(res.body.ok, true)
  assert.equal(res.body.reply, 'Mate.')
  assert.equal(posted[0].conversationId, 'c1')
  assert.equal(isPresenceLan('8.8.8.8'), false)
  assert.equal(isPresenceLan('172.16.0.1'), false)
  assert.equal(isPresenceLan('192.168.1.10'), true)
}

// F5 ohne Hirn
{
  const noTok = presenceWriteAllowed({
    enabled: true,
    expectedToken: 'aabbccddeeff0011',
    givenToken: '',
    remoteHost: '192.168.1.20',
  })
  assert.equal(noTok.ok, false)
}

// F6 Desk ohne Frame
{
  assert.ok(parseDeskIntent('Schau auf den Tisch'))
  assert.ok(parseDeskIntent('Tisch aus'))
  assert.equal(parseDeskIntent('Wetter Hotel Stuttgart'), null)
  const empty = await handleDesk('c', 'Schau auf den Tisch')
  assert.match(empty.reply || '', /Kein Frame|erfinde/)
  const off = await handleDesk('c', 'Tisch aus')
  assert.match(off.reply || '', /Tisch aus/)
}

// F7 Token-Trennung + Pin nur Hirn
{
  const a = newPresenceToken()
  const b = newPresenceToken()
  assert.notEqual(a, b)
  assert.equal(tokensMatch(a, a), true)
  assert.equal(tokensMatch(a, b), false)
  assert.ok(!ROLE_COPY.includes('Cloud-Account'))
  assert.match(WONT_COPY, /IndexedDB/)
  assert.match(VR_PARKING, /Parking/)
}

// Drop nur mit Token
{
  const token = 'aabbccddeeff00112233445566778899'
  const notes = []
  const store = {
    loadSettings: () => ({ presence_enabled: true, presence_token: token }),
    listConversations: async () => [],
    listMessages: async () => [],
    addNote: async (text) => {
      notes.push(text)
      return { id: 'n1' }
    },
  }
  const denied = await handlePresenceHttp(
    { method: 'POST', path: '/v1/presence/drop', headers: {}, body: JSON.stringify({ text: 'x' }), remoteHost: '192.168.1.2' },
    undefined,
    store,
  )
  assert.equal(denied.status, 401)
  const ok = await handlePresenceHttp(
    {
      method: 'POST',
      path: '/v1/presence/drop',
      headers: { 'X-Jarvis-Token': token },
      body: JSON.stringify({ text: 'Notiz vom Pad' }),
      remoteHost: '10.0.0.2',
    },
    undefined,
    store,
  )
  assert.equal(ok.status, 200)
  assert.equal(notes.length, 1)
}

// Secrets nicht im Presence-JSON
{
  const token = 'aabbccddeeff00112233445566778899'
  const store = {
    loadSettings: () => ({ presence_enabled: true, presence_token: token }),
    listConversations: async () => [{ id: 'c1' }],
    listMessages: async () => [
      {
        id: 'm1',
        conversation_id: 'c1',
        role: 'assistant',
        content: 'Key AIzaSyDummyKey1234567890xxxx',
        created_at: '2026-09-03T00:00:00Z',
      },
    ],
    addNote: async () => ({ id: 'n' }),
  }
  const got = await handlePresenceHttp(
    { method: 'GET', path: '/v1/presence', headers: { 'X-Jarvis-Token': token }, remoteHost: '127.0.0.1' },
    undefined,
    store,
  )
  const raw = JSON.stringify(got.body)
  assert.ok(!/AIzaSy/.test(raw), raw)
}

assert.ok(filterTopics('Presence').includes('geraete'))
assert.ok(filterTopics('Lage immer').includes('lage'))
assert.ok(TEST_COPY_GROUPS.some((g) => g.title === 'Flächen-12'))
assert.ok(ROLE_COPY.includes('Fenster braucht Token'))
assert.equal(isPresenceWindow({ presence_role: 'window' }), true)
assert.equal(isPresenceWindow({ presence_role: 'brain' }), false)
assert.match(bindStatusLine(false), /Presence aus/)
assert.match(bindStatusLine(true, false), /Bind/)
assert.match(bindStatusLine(true, true), /lauscht/)

console.log('test-presence-12 ok')
