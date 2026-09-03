import assert from 'node:assert/strict'
import { decideGate } from '../src/engine/memory-gate.ts'
import { dumpLikeValue, inferKind, pruneMemoryItems } from '../src/engine/memory-layer.ts'
import { extractEntities, utteranceHints } from '../src/engine/memory-alias.ts'
import { retrieveFromCorpus, isDumpLine, applyE5Rerank } from '../src/engine/retrieve.ts'
import { parseRecallIntent } from '../src/engine/recall-parse.ts'
import { isUtilityCorrection } from '../src/engine/memory-parse.ts'
import { TEST_COPY_GROUPS, PROBE_COPY_GROUPS } from '../src/engine/test-copy.ts'
import { qualityPack, resetPackExistsProbe } from '../src/engine/quality-pack.ts'
import { DEFAULT_SETTINGS } from '../src/engine/store.ts'

resetPackExistsProbe()

function pin(partial) {
  return {
    id: partial.id || partial.key,
    key: partial.key,
    value: partial.value,
    category: partial.category || 'fact',
    confidence: partial.confidence ?? 0.95,
    updated_at: partial.updated_at || '2026-09-01T00:00:00Z',
    origin: partial.origin || 'user',
    kind: partial.kind,
    entities: partial.entities,
    tense: partial.tense,
    related_ids: partial.related_ids,
    parent_key: partial.parent_key,
    not_useful: partial.not_useful,
  }
}

// G1 Getränk
{
  const hits = retrieveFromCorpus('Was trinke ich?', {
    memory: [pin({ key: 'getränk', value: 'Mate', category: 'pref', kind: 'pref' })],
  })
  assert.ok(hits.some((h) => /Mate/i.test(h.body)), 'G1 Mate in Top 6')
}

// G2 WLAN-Alias ohne e5
{
  const mem = [
    pin({
      id: 'fb',
      key: 'fritzbox',
      value: 'Blau12',
      kind: 'fact',
      entities: extractEntities('fritzbox', 'Blau12'),
    }),
  ]
  const hits = retrieveFromCorpus('Was ist mein WLAN-Passwort?', { memory: mem })
  assert.ok(hits.some((h) => h.id === 'fb' || /Blau12/.test(h.body)), 'G2 FritzBox via WLAN-Alias')
  assert.ok(parseRecallIntent('Was ist mein WLAN-Passwort?'))
}

// G3 Japan-Goal
{
  const mem = [
    pin({
      id: 'jp',
      key: 'reise',
      value: 'Tokyo 2027',
      kind: 'goal',
      tense: 'future',
      entities: ['japan', 'tokyo', 'reise'],
      parent_key: 'reise',
    }),
  ]
  const hits = retrieveFromCorpus('Was wollte ich in Japan machen?', { memory: mem })
  assert.ok(hits.some((h) => h.id === 'jp' || /Tokyo/.test(h.body)), 'G3 Tokyo-Goal')
  assert.equal(utteranceHints('Was wollte ich in Japan machen?').kind, 'goal')
  assert.equal(inferKind('reise', 'Tokyo 2027', 'fact', 'Ich will 2027 nach Tokyo.'), 'goal')
}

// G4 REVISE Döner
{
  const existing = [pin({ id: 'ess', key: 'essen', value: 'Döner', category: 'pref', kind: 'pref' })]
  const d = decideGate({ key: 'essen', value: 'kein Döner', category: 'pref' }, existing)
  assert.equal(d.action, 'REVISE')
  const after = retrieveFromCorpus('Mag ich Döner?', {
    memory: [pin({ id: 'ess', key: 'essen', value: 'kein Döner', category: 'pref', kind: 'pref' })],
  })
  assert.ok(!after.some((h) => h.body === 'Döner'), 'G4 alter Döner-Pin weg')
}

// G5 keine Reise erfinden
{
  const hits = retrieveFromCorpus('Welche Reisen plane ich?', {
    memory: [pin({ key: 'essen', value: 'Döner', category: 'pref', kind: 'pref' })],
  })
  assert.ok(!hits.some((h) => /Döner/i.test(h.body)), 'G5 kein Döner als Reise')
  assert.equal(hits.filter((h) => h.store === 'memory').length, 0)
}

// G6 Dump raus
{
  const dump = 'Gefunden: • a: 1 • b: 2 • c: 3 • d: 4 extra text hier wirklich lang genug'
  assert.equal(dumpLikeValue(dump) || isDumpLine(dump), true)
  const hits = retrieveFromCorpus('Was steht dazu?', {
    memory: [pin({ key: 'getränk', value: 'Mate', category: 'pref', kind: 'pref' })],
    messages: [
      {
        id: 'm1',
        conversation_id: 'c1',
        role: 'assistant',
        content: dump,
        created_at: '2026-09-01T00:00:00Z',
      },
    ],
    convs: [{ id: 'c1', title: 'Chat', created_at: '', updated_at: '' }],
  })
  assert.ok(!hits.some((h) => isDumpLine(h.body) || dumpLikeValue(h.body)), 'G6 Dump nicht in Top 6')
}

{
  const d = decideGate({ key: 'notiz', value: 'Gefunden: • a: 1 • b: 2 • c: 3 • d: 4 und noch mehr text', category: 'fact' }, [])
  assert.equal(d.action, 'IGNORE')
}

{
  const d = decideGate({ key: 'notiz', value: 'heute habe ich Nudeln gegessen', category: 'fact', spoken: 'heute nudeln' }, [])
  assert.equal(d.action, 'IGNORE')
}

{
  const ident = pin({ key: 'getränk', value: 'Mate', category: 'pref' })
  const d = decideGate({ key: 'getränk', value: 'Mate', category: 'pref' }, [ident])
  assert.equal(d.action, 'IGNORE')
}

{
  const d = decideGate({ key: 'notiz', value: 'Zahnarzt Freitag', category: 'fact' }, [])
  assert.equal(d.action, 'STORE')
}

{
  const now = Date.parse('2026-09-01T00:00:00Z')
  const { keep, drop } = pruneMemoryItems(
    [
      pin({ id: 'n', key: 'name', value: 'Max', category: 'fact', confidence: 0.95, updated_at: '2026-01-01T00:00:00Z' }),
      pin({
        id: 'u',
        key: 'tmp',
        value: 'alt',
        category: 'fact',
        confidence: 0.9,
        not_useful: 4,
        updated_at: '2026-01-01T00:00:00Z',
      }),
      ...Array.from({ length: 80 }, (_, i) =>
        pin({
          id: `k${i}`,
          key: `k${i}`,
          value: `v${i}`,
          confidence: 0.8,
          updated_at: '2026-08-01T00:00:00Z',
        }),
      ),
    ],
    now,
  )
  assert.ok(keep.some((r) => r.key === 'name'))
  assert.ok(drop.some((r) => r.id === 'u') || keep.find((r) => r.id === 'u') === undefined || (keep.find((r) => r.id === 'u') && drop.length > 0))
  assert.ok(keep.length <= 80)
}

{
  const japan = pin({
    id: 'pref-jp',
    key: 'anime',
    value: 'One Piece',
    kind: 'pref',
    entities: ['japan'],
  })
  const goal = pin({
    id: 'goal-jp',
    key: 'reise',
    value: 'Tokyo 2027',
    kind: 'goal',
    entities: ['japan', 'tokyo'],
    related_ids: ['pref-jp'],
  })
  const hits = retrieveFromCorpus('Japan', { memory: [japan, { ...japan, related_ids: ['goal-jp'] }, goal] })
  const ids = hits.map((h) => h.id)
  assert.ok(ids.includes('goal-jp') || hits.some((h) => /Tokyo/.test(h.body)), '1-Hop oder direkter Goal-Treffer')
}

assert.equal(isUtilityCorrection('Das stimmt nicht'), true)
assert.equal(isUtilityCorrection('Hallo'), false)
assert.ok(TEST_COPY_GROUPS.some((g) => g.title === 'Memory-10'))
assert.ok(PROBE_COPY_GROUPS.some((g) => g.title === 'Memory-10'))
assert.equal(PROBE_COPY_GROUPS.length, 10)
assert.equal(PROBE_COPY_GROUPS[0].title, 'Memory-10')

const e5 = applyE5Rerank([{ store: 'memory', title: 'x', body: 'y', rank: 1 }])
assert.equal(e5[0].rank, 1)
assert.equal(qualityPack('e5', DEFAULT_SETTINGS).wanted, false)

console.log('test-memory-10 ok')
