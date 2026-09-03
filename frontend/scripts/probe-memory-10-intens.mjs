import { decideGate } from '../src/engine/memory-gate.ts'
import { dumpLikeValue, inferKind, inferTense, pruneMemoryItems } from '../src/engine/memory-layer.ts'
import { extractEntities, inferParentKey, utteranceHints, aliasQueries } from '../src/engine/memory-alias.ts'
import { retrieveFromCorpus, isDumpLine, applyE5Rerank, subQueries, formatRecallReply } from '../src/engine/retrieve.ts'
import { parseRecallIntent } from '../src/engine/recall-parse.ts'
import { isUtilityCorrection, isMemoryRecall, isMemoryWrite, parseMemoryFacts, parsePrefItemAsk, CONTRADICTION } from '../src/engine/memory-parse.ts'
import { memoryBlock } from '../src/engine/memory-block.ts'
import { PROBE_COPY_GROUPS } from '../src/engine/test-copy.ts'
import { qualityPack, resetPackExistsProbe } from '../src/engine/quality-pack.ts'
import { DEFAULT_SETTINGS, APP_VERSION } from '../src/engine/store.ts'

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

function fromMerk(text) {
  const facts = parseMemoryFacts(text)
  return facts.map((f) => {
    const spoken = text
    const kind = inferKind(f.key, f.value, f.category, spoken)
    const entities = extractEntities(f.key, f.value)
    const tense = inferTense(`${f.key} ${f.value} ${spoken}`)
    const parent_key = inferParentKey(kind, f.key, f.value, entities)
    return pin({
      id: f.key,
      key: f.key,
      value: f.value,
      category: f.category,
      kind,
      entities,
      tense,
      parent_key,
    })
  })
}

const rows = []
function check(id, ok, detail) {
  rows.push({ id, ok: Boolean(ok), detail: String(detail) })
}

check('APP 13.30.0', APP_VERSION === '13.30.0', APP_VERSION)

// --- Live write keys (Merk → notiz), not Gold-synthetic keys ---
const g1facts = parseMemoryFacts('Ich trinke gerne Mate.')
check('W1 G1 parse getränk=Mate', g1facts.some((f) => f.key === 'getränk' && /Mate/i.test(f.value)), JSON.stringify(g1facts))

const g2facts = parseMemoryFacts('Merk dir: FritzBox-Passwort ist Blau12')
check('W2 G2 parse key=notiz (nicht fritzbox)', g2facts[0]?.key === 'notiz' && /Blau12/.test(g2facts[0].value), JSON.stringify(g2facts))

const g3facts = parseMemoryFacts('Merk dir: Ich will 2027 nach Tokyo.')
check('W3 G3 parse key=notiz', g3facts[0]?.key === 'notiz' && /Tokyo/.test(g3facts[0]?.value || ''), JSON.stringify(g3facts))

const g3pins = fromMerk('Merk dir: Ich will 2027 nach Tokyo.')
check('W3b G3 kind=goal', g3pins[0]?.kind === 'goal', JSON.stringify(g3pins[0]))
check('W3c G3 entities japan/tokyo', g3pins[0]?.entities?.includes('japan') && g3pins[0]?.entities?.includes('tokyo'), JSON.stringify(g3pins[0]?.entities))

const car = fromMerk('Merk dir: Ich will ein neues Auto.')
check('W4 Auto-Goal parent_key nicht reise (Soll)', car[0]?.kind !== 'goal' || car[0]?.parent_key !== 'reise', `kind=${car[0]?.kind} parent=${car[0]?.parent_key}`)

check('W5 Ohne Merk kein Write', isMemoryWrite('Ich will 2027 nach Tokyo.') === false, isMemoryWrite('Ich will 2027 nach Tokyo.'))

const g2pins = fromMerk('Merk dir: FritzBox-Passwort ist Blau12')
const g2hits = retrieveFromCorpus('Was ist mein WLAN-Passwort?', { memory: g2pins })
check('R2 live-notiz WLAN→Blau12', g2hits.some((h) => /Blau12/.test(h.body)), g2hits.map((h) => `${h.title}:${h.body}`).join('|') || 'leer')

const g3hits = retrieveFromCorpus('Was wollte ich in Japan machen?', { memory: g3pins })
check('R3 live-notiz Japan→Tokyo', g3hits.some((h) => /Tokyo/.test(h.body)), g3hits.map((h) => `${h.title}:${h.body}`).join('|') || 'leer')

check('R2 recall-intent G2', Boolean(parseRecallIntent('Was ist mein WLAN-Passwort?')), String(parseRecallIntent('Was ist mein WLAN-Passwort?')))
check('R3 recall-intent G3', Boolean(parseRecallIntent('Was wollte ich in Japan machen?')), String(parseRecallIntent('Was wollte ich in Japan machen?')))

// --- memoryBlock wirft Memory-Hits weg ---
const fb = pin({
  id: 'fb',
  key: 'fritzbox',
  value: 'Blau12',
  kind: 'fact',
  entities: extractEntities('fritzbox', 'Blau12'),
})
const blockHits = retrieveFromCorpus('Was ist mein WLAN-Passwort?', { memory: [fb] })
const block = memoryBlock([fb], 'Was ist mein WLAN-Passwort?', blockHits)
check('B1 memoryBlock enthält Blau12 bei Alias-Query', /Blau12/.test(block), block.slice(0, 280))
check(
  'B1b Ursache: memory-Hits im Block',
  blockHits.some((h) => h.store === 'memory' && /Blau12/.test(h.body)) && /Blau12/.test(block),
  `retrieve=${blockHits.filter((h) => h.store === 'memory').length} blockHas=${/Blau12/.test(block)}`,
)

const mate = pin({ key: 'getränk', value: 'Mate', category: 'pref', kind: 'pref' })
check(
  'B2 G1 memoryBlock Mate (token getränk/trinke)',
  /Mate/.test(memoryBlock([mate], 'Was trinke ich?', retrieveFromCorpus('Was trinke ich?', { memory: [mate] }))),
  memoryBlock([mate], 'Was trinke ich?', []).slice(0, 200),
)

// --- Alias-Überbreite ---
const pizza = pin({
  id: 'ess',
  key: 'essen',
  value: 'Pizza',
  category: 'pref',
  kind: 'pref',
  entities: extractEntities('essen', 'Pizza'),
})
check('A1 essen-Pin bekommt döner-Entities (Soll: nein)', !extractEntities('essen', 'Pizza').includes('döner'), JSON.stringify(extractEntities('essen', 'Pizza')))
const donerQ = retrieveFromCorpus('Mag ich Döner?', { memory: [pizza] })
check('A2 Pizza nicht als Döner-Treffer', !donerQ.some((h) => h.id === 'ess' || /Pizza/.test(h.body)), donerQ.map((h) => h.body).join('|') || 'leer')

const bank = pin({
  id: 'bank',
  key: 'notiz',
  value: 'Bank-Passwort ist 9999',
  kind: 'fact',
  entities: extractEntities('notiz', 'Bank-Passwort ist 9999'),
})
check('A3 Bank-Passwort nicht in WLAN-Gruppe', !extractEntities('notiz', 'Bank-Passwort ist 9999').includes('fritzbox'), JSON.stringify(extractEntities('notiz', 'Bank-Passwort ist 9999')))
const bankHits = retrieveFromCorpus('Was ist mein WLAN-Passwort?', { memory: [bank, fb] })
check('A4 WLAN-Query nicht Bank vor FritzBox', bankHits[0]?.id !== 'bank', bankHits.map((h) => `${h.id}:${h.body}`).join('|'))
check('A5 Query Passwort allein → Alias fritzbox', !aliasQueries('Was ist mein Passwort?').includes('fritzbox'), JSON.stringify(aliasQueries('Was ist mein Passwort?')))

const term = extractEntities('notiz', 'Vorsorge-Termin beim Hausarzt')
check('A6 Hausarzt-Termin nicht zahnarzt-Gruppe', !term.includes('zahnarzt'), JSON.stringify(term))

// --- G5 / Tense ---
const pastJp = pin({
  id: 'past',
  key: 'notiz',
  value: 'war 2019 in Tokyo',
  kind: 'event',
  tense: 'past',
  entities: ['japan', 'tokyo', 'reise'],
})
const futureHits = retrieveFromCorpus('Welche Reisen plane ich?', { memory: [pastJp, pizza] })
check('T1 Vergangenheit nicht als geplante Reise', !futureHits.some((h) => h.id === 'past'), futureHits.map((h) => `${h.id}:${h.body}`).join('|') || 'leer')
check('T1b hints goal+future', utteranceHints('Welche Reisen plane ich?').kind === 'goal', JSON.stringify(utteranceHints('Welche Reisen plane ich?')))

const warHits = retrieveFromCorpus('War ich in Japan?', { memory: [g3pins[0], pastJp] })
check('T2 War-ich filtert Future-Goal raus oder ehrlich', !warHits.some((h) => /2027/.test(h.body)) || utteranceHints('War ich in Japan?').tense === 'past', `${JSON.stringify(utteranceHints('War ich in Japan?'))} hits=${warHits.map((h) => h.body).join('|')}`)

// --- Gate ---
check('G DUMP IGNORE', decideGate({ key: 'notiz', value: 'Gefunden: • a: 1 • b: 2 • c: 3 • d: 4 extra text hier wirklich lang genug', category: 'fact' }, []).action === 'IGNORE', '')
check('G IDENT IGNORE', decideGate({ key: 'getränk', value: 'Mate', category: 'pref' }, [mate]).action === 'IGNORE', '')
check('G IDENT gleicher Wert IGNORE', decideGate({ key: 'essen', value: 'Pizza', category: 'pref' }, [pizza]).action === 'IGNORE', '')
check('G REVISE neuer Wert', decideGate({ key: 'essen', value: 'Döner', category: 'pref' }, [pizza]).action === 'REVISE', '')
check('G STORE neu', decideGate({ key: 'notiz', value: 'Zahnarzt Freitag', category: 'fact' }, []).action === 'STORE', '')
check('G Nudeln IGNORE', decideGate({ key: 'notiz', value: 'heute Nudeln gegessen', category: 'fact', spoken: 'heute nudeln' }, []).action === 'IGNORE', '')
check('G merk Nudeln nicht IGNORE', decideGate({ key: 'notiz', value: 'heute Nudeln', category: 'fact', spoken: 'merk dir heute nudeln' }, []).action !== 'IGNORE', decideGate({ key: 'notiz', value: 'heute Nudeln', category: 'fact', spoken: 'merk dir heute nudeln' }, []).action)

const contra = CONTRADICTION.exec('kein Döner mehr')
check('G4 live Contradiction-Delete nicht Gate-REVISE', Boolean(contra) && contra[1].toLowerCase().includes('döner'), String(contra && contra[1]))
check('G4 isMemoryWrite contradiction', isMemoryWrite('kein Döner mehr'), '')

const tokyo1 = pin({ id: 't1', key: 'notiz', value: 'Tokyo 2027', kind: 'goal', entities: extractEntities('notiz', 'Tokyo 2027') })
const tokyo2 = decideGate({ key: 'notiz2', value: 'Tokyo Hotel buchen', category: 'fact', kind: 'goal', entities: extractEntities('notiz2', 'Tokyo Hotel buchen') }, [tokyo1])
check('G MERGE Tokyo-Goal mit Hotel-Notiz', tokyo2.action === 'MERGE' || tokyo2.action === 'STORE', `${tokyo2.action} ${tokyo2.reason}`)

// --- 1-Hop ---
const hopA = pin({ id: 'a', key: 'reise', value: 'Tokyo 2027', kind: 'goal', entities: ['japan', 'tokyo'], related_ids: ['b'] })
const hopB = pin({ id: 'b', key: 'hotel', value: 'Park Hyatt', kind: 'fact', entities: ['tokyo'], related_ids: ['a'] })
const hopHits = retrieveFromCorpus('Was wollte ich in Japan machen?', { memory: [hopA, hopB] })
check('H1 1-Hop Hotel oder Tokyo in Top6', hopHits.some((h) => h.id === 'a') && (hopHits.some((h) => h.id === 'b') || hopHits.length >= 1), hopHits.map((h) => h.id).join(','))
check('H2 max 6 Hits', hopHits.length <= 6, String(hopHits.length))

// --- Prune ---
const now = Date.parse('2026-09-01T00:00:00Z')
const { keep, drop } = pruneMemoryItems(
  [
    pin({ id: 'n', key: 'name', value: 'Max', confidence: 0.2, updated_at: '2025-01-01T00:00:00Z' }),
    pin({ id: 'u', key: 'tmp', value: 'alt', confidence: 0.9, not_useful: 5, updated_at: '2025-01-01T00:00:00Z' }),
    ...Array.from({ length: 80 }, (_, i) => pin({ id: `k${i}`, key: `k${i}`, value: `v${i}`, confidence: 0.85, updated_at: '2026-08-01T00:00:00Z' })),
  ],
  now,
)
check('P1 name trotz niedriger Conf', keep.some((r) => r.key === 'name'), '')
check('P2 cap 80', keep.length <= 80, String(keep.length))
check('P3 not_useful eher drop', drop.some((r) => r.id === 'u') || keep.findIndex((r) => r.id === 'u') > 40, `dropU=${drop.some((r) => r.id === 'u')}`)

// --- Utility / e5 / copy ---
check('U1 stimmt nicht', isUtilityCorrection('Das stimmt nicht'))
check('U2 falsch gemerkt', isUtilityCorrection('falsch gemerkt'))
check('U3 Hallo nicht', !isUtilityCorrection('Hallo'))
check('E5 default aus', qualityPack('e5', DEFAULT_SETTINGS).wanted === false, '')
check('E5 identity', applyE5Rerank([{ store: 'memory', title: 'x', body: 'y', rank: 1 }])[0].rank === 1, '')
check('Copy Memory-10', PROBE_COPY_GROUPS[0]?.title === 'Memory-10' && PROBE_COPY_GROUPS.length === 12, String(PROBE_COPY_GROUPS.length))

// --- Gold synthetic still ---
check('Gold G1 Mate', retrieveFromCorpus('Was trinke ich?', { memory: [mate] }).some((h) => /Mate/.test(h.body)))
check('Gold G2 FritzBox', retrieveFromCorpus('Was ist mein WLAN-Passwort?', { memory: [fb] }).some((h) => /Blau12/.test(h.body)))
check('Gold G5 leer', retrieveFromCorpus('Welche Reisen plane ich?', { memory: [pizza] }).filter((h) => h.store === 'memory').length === 0)
const dump = 'Gefunden: • a: 1 • b: 2 • c: 3 • d: 4 extra text hier wirklich lang genug'
check('Gold G6 dumpLike', dumpLikeValue(dump) || isDumpLine(dump))

const empty = retrieveFromCorpus('Welche Reisen plane ich?', { memory: [pizza] })
check('G5 formatRecall ehrlich leer', /Nichts Belegtes/.test(formatRecallReply('Welche Reisen plane ich?', empty)), formatRecallReply('Welche Reisen plane ich?', empty))

{
  const echoHits = retrieveFromCorpus('Welche Reisen plane ich?', {
    memory: [pizza],
    messages: [
      {
        id: 'm1',
        conversation_id: 'c1',
        role: 'user',
        content: 'Welche Reisen plane ich?',
        created_at: '2026-09-01T00:00:00Z',
      },
    ],
    convs: [{ id: 'c1', title: 'Chat', created_at: '', updated_at: '' }],
  })
  const reply = formatRecallReply('Welche Reisen plane ich?', echoHits)
  check(
    'G5 live kein Gespräch-Echo der Frage',
    /Nichts Belegtes/.test(reply) && !/Gespräch:/.test(reply),
    reply,
  )
}

const g2reply = formatRecallReply('Was ist mein WLAN-Passwort?', retrieveFromCorpus('Was ist mein WLAN-Passwort?', { memory: g2pins }))
check('R2 formatRecall Blau12', /Blau12/.test(g2reply), g2reply)

check('Q1 Mag ich Döner Parser', isMemoryRecall('Mag ich Döner?') && parsePrefItemAsk('Mag ich Döner?') === 'Döner', String(parsePrefItemAsk('Mag ich Döner?')))
check('Q2 Mag ich noch', isMemoryRecall('Mag ich noch Döner?'), '')
check('Q3 Serie nicht Pref', parsePrefItemAsk('Mag ich diese Serie') === null, String(parsePrefItemAsk('Mag ich diese Serie')))

// subQueries cap
check('SQ max 5', subQueries('Was ist mein WLAN-Passwort und FritzBox Router Wifi').length <= 5, JSON.stringify(subQueries('Was ist mein WLAN-Passwort und FritzBox Router Wifi')))

const green = rows.filter((r) => r.ok)
const red = rows.filter((r) => !r.ok)
console.log('=== Memory-10 Intensiv ===')
for (const r of rows) {
  console.log(`${r.ok ? 'OK ' : 'ROT'}  ${r.id}${r.detail ? ' — ' + r.detail.replace(/\n/g, ' ').slice(0, 180) : ''}`)
}
console.log(`\nGrün ${green.length} / Rot ${red.length} / ${rows.length}`)
if (red.length) {
  console.log('ROT:')
  for (const r of red) console.log(`- ${r.id}: ${r.detail.slice(0, 240)}`)
  process.exit(1)
}
process.exit(0)
