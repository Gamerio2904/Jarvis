// @ts-nocheck — Sprint 279: Altbestand (Mocks). Neue Skripte ohne diese Zeile.
import assert from 'node:assert/strict'
import { APP_VERSION } from '../src/engine/store.ts'
import { PKG_VERSION } from './app-version.mjs'
import { parseTeachIntent } from '../src/engine/teach-parse.ts'
import { parsePackAsk, parsePackForget, parsePackRevise } from '../src/engine/pack-parse.ts'
import { isMemoryWrite, isMemoryRecall } from '../src/engine/memory-parse.ts'
import { parseCalendarIntent } from '../src/engine/calendar-parse.ts'
import { parseFanIntent } from '../src/engine/fan-parse.ts'
import { isDeepResearch, deepResearchQueries } from '../src/engine/research-parse.ts'
import { knowledgeBlock } from '../src/engine/knowledge-block.ts'
import { retrievePacks } from '../src/engine/knowledge-retrieve.ts'
import { asBackup } from '../src/engine/backup.ts'
import { TEST_COPY_GROUPS } from '../src/engine/test-copy.ts'
import { filterTopics } from '../src/engine/settings-ia.ts'
import { AGENT_META } from '../src/engine/agents/meta.ts'
import { knowledgeSynapses } from '../src/engine/agent-map.ts'
import {
  CLAIM_CAP,
  claimsFromText,
  mergeClaims,
  normalizePack,
  putKnowledgePack,
  listKnowledgePacks,
  deleteKnowledgePack,
  resetKnowledgeMem,
  teachFromParts,
  PACK_CAP,
} from '../src/engine/knowledge.ts'

assert.equal(APP_VERSION, PKG_VERSION)
resetKnowledgeMem()

// T1 Teach-Paste
{
  const intent = parseTeachIntent(
    'Lern das als Fachwissen Antriebsquelle: Palladium ist knapp, Integration ist das Engpass.',
  )
  assert.ok(intent)
  assert.equal(intent.topic, 'antriebsquelle')
  assert.match(intent.body || '', /Palladium/)
  const pack = await teachFromParts({
    topic: intent.topic,
    text: intent.body,
    origin: 'paste',
  })
  assert.ok(!('empty' in pack))
  assert.equal(pack.user_ok, true)
  assert.ok(pack.claims.some((c) => /Palladium/i.test(c.text)))
}

// T2 Topic-Ask
{
  const packs = await listKnowledgePacks()
  const hits = retrievePacks('Was steht bei uns zur Antriebsquelle?', packs)
  assert.equal(hits.length, 1)
  assert.match(hits[0].topic, /antrieb/)
  const block = knowledgeBlock(packs, 'Was steht bei uns zur Antriebsquelle?')
  assert.match(block, /Palladium/)
  assert.match(block, /Antriebsquelle/)
}

// T3 Mate-Ask kein Pack-Leak
{
  const packs = await listKnowledgePacks()
  assert.ok(packs.length)
  assert.equal(retrievePacks('Was trinke ich?', packs).length, 0)
  assert.equal(knowledgeBlock(packs, 'Was trinke ich?'), '')
  assert.equal(parsePackAsk('Was trinke ich?'), null)
  assert.ok(isMemoryRecall('Was trinke ich?'))
}

// T4 zweites Fach
{
  const steuer = await teachFromParts({
    topic: 'steuer-2026',
    title: 'Steuer 2026',
    text: 'Der Grundfreibetrag steigt 2026.',
    origin: 'paste',
  })
  assert.ok(!('empty' in steuer))
  const packs = await listKnowledgePacks()
  const t2 = retrievePacks('Was steht bei uns zur Antriebsquelle?', packs)
  assert.ok(t2.every((p) => p.topic !== 'steuer-2026'))
  const t4 = retrievePacks('Was steht bei uns zur Steuer 2026?', packs)
  assert.ok(t4.some((p) => p.topic === 'steuer-2026'))
  assert.ok(!t4.some((p) => /antrieb/.test(p.topic)))
}

// T5 Forget
{
  await deleteKnowledgePack('antriebsquelle')
  const packs = await listKnowledgePacks()
  assert.equal(retrievePacks('Was steht bei uns zur Antriebsquelle?', packs).length, 0)
  assert.ok(packs.some((p) => p.topic === 'steuer-2026'))
}

// T6 Deep
{
  assert.equal(isDeepResearch('Recherchiere tief: Anzugs-Energiequelle ehrlich. Entwirf Constraints.'), true)
  assert.equal(isDeepResearch('recherchier Benzinpreis'), false)
  assert.equal(
    isDeepResearch('Deep Researche was im 2 Weltkrieg in Stalingrad passiert ist für meine Abi Prüfung'),
    true,
  )
  const qs = deepResearchQueries('Recherchiere tief: Anzugs-Energiequelle ehrlich, ohne Marvel-Magie. Entwirf Constraints.')
  assert.ok(qs.length >= 3)
  assert.ok(!qs.some((q) => /energy density/i.test(q)))
}

// Parser conflicts
{
  assert.equal(parseTeachIntent('Merk dir Mate'), null)
  assert.ok(isMemoryWrite('Merk dir Mate') || isMemoryWrite('Merk dir: Ich trinke Mate'))
  assert.ok(parseCalendarIntent('Merk dir Freitag Zahnarzt') || parseCalendarIntent('Termin Freitag Zahnarzt'))
  assert.equal(parseTeachIntent('Merk dir Freitag Zahnarzt'), null)
  assert.ok(!parseTeachIntent('Ventilator an'))
  assert.ok(parseFanIntent('Ventilator an'))
  assert.ok(parsePackForget('Vergiss Fachwissen Antriebsquelle'))
  assert.equal(parsePackRevise('Das stimmt nicht', 'pack'), true)
  assert.equal(parsePackRevise('Das stimmt nicht', ''), false)
}

// Store prune + merge cap
{
  resetKnowledgeMem()
  const many = []
  for (let i = 0; i < PACK_CAP + 3; i += 1) {
    many.push(
      await putKnowledgePack(
        normalizePack({
          topic: `fach-${i}`,
          title: `Fach ${i}`,
          user_ok: i > 1,
          claims: [{ id: `c${i}`, text: `Claim nummer ${i} steht hier fest.`, source_urls: [], user_ok: true }],
          sources: [],
          origin: 'user',
        }),
      ),
    )
  }
  const listed = await listKnowledgePacks()
  assert.ok(listed.length <= PACK_CAP, `cap ${listed.length}`)

  const incoming = Array.from({ length: 30 }, (_, i) => ({
    id: `n${i}`,
    text: `Neuer satz nummer ${i} zur lab notiz.`,
    source_urls: [],
    user_ok: true,
  }))
  const merged = mergeClaims(claimsFromText('Alter satz bleibt zuerst stehen.'), incoming)
  assert.ok(merged.claims.length <= CLAIM_CAP)
}

// IGNORE Duplikat
{
  const a = claimsFromText('Palladium ist knapp.')
  const { ignored } = mergeClaims(a, claimsFromText('Palladium ist knapp.'))
  assert.ok(ignored >= 1)
}

// Hausstand Feld
{
  const old = asBackup({
    backup_version: 1,
    exported_at: '2026-09-03T00:00:00Z',
    settings: { gemini_api_key: '' },
    memory: [],
    reminders: [],
    events: [],
    notes: [],
    todos: [],
    shopping: [],
  })
  assert.ok(old)
  assert.equal(old.knowledge_packs, undefined)
  const withPacks = asBackup({
    ...old,
    knowledge_packs: [{ id: 'x', topic: 'x', title: 'X', aliases: [], summary: '', claims: [], sources: [], origin: 'user', taught_at: '', updated_at: '', user_ok: true }],
  })
  assert.equal(withPacks?.knowledge_packs?.length, 1)
}

// Settings IA
{
  assert.ok(filterTopics('Fachwissen').includes('daten'))
  assert.ok(filterTopics('Pack').includes('daten'))
}

// Copy-Gruppe
{
  const g = TEST_COPY_GROUPS.find((x) => x.title === 'Fachwissen-11')
  assert.ok(g)
  assert.ok(g.items.some((i) => / Palladium /i.test(` ${i.text} `) || /Palladium/.test(i.text)))
  assert.ok(g.items.some((i) => /Steuer 2026|FritzBox/.test(i.text)))
  assert.ok(!g.items.some((i) => /Tony|Jarvis, I need you to redesign/i.test(i.text)))
}

{
  resetKnowledgeMem()
  const generic = await putKnowledgePack(
    normalizePack({
      topic: 'allgemein',
      title: 'Allgemein',
      aliases: ['fach'],
      claims: [{ id: 'c-pall', text: 'Palladium ist knapp im Lichtbogen.', source_urls: [], user_ok: true }],
      sources: [],
      origin: 'user',
    }),
  )
  const hits = retrievePacks('Was steht zum Palladium?', [generic])
  assert.ok(hits.some((p) => p.topic === 'allgemein'))
}

{
  resetKnowledgeMem()
  const a = await putKnowledgePack(
    normalizePack({
      topic: 'lichtbogen',
      title: 'Lichtbogen',
      aliases: ['palladium'],
      claims: [{ id: 'c1', text: 'Palladium ist knapp.', source_urls: [], user_ok: true }],
      sources: [],
      origin: 'user',
    }),
  )
  const b = await putKnowledgePack(
    normalizePack({
      topic: 'huelle',
      title: 'Hülle',
      aliases: ['palladium', 'mantel'],
      claims: [{ id: 'c2', text: 'Palladium bleibt knapp in der Hülle.', source_urls: [], user_ok: true }],
      sources: [],
      origin: 'user',
    }),
  )
  const c = await putKnowledgePack(
    normalizePack({
      topic: 'kaffee',
      title: 'Kaffee',
      aliases: ['espresso'],
      claims: [{ id: 'c3', text: 'Espresso kommt aus der Maschine.', source_urls: [], user_ok: true }],
      sources: [],
      origin: 'user',
    }),
  )
  const listed = await listKnowledgePacks()
  const licht = listed.find((p) => p.topic === 'lichtbogen')
  const huelle = listed.find((p) => p.topic === 'huelle')
  assert.ok(licht?.links?.includes('huelle') || huelle?.links?.includes('lichtbogen'))
  const hop = retrievePacks('Was steht bei uns zum Lichtbogen?', listed)
  assert.ok(hop.some((p) => p.topic === 'lichtbogen'))
  assert.ok(hop.some((p) => p.topic === 'huelle'))
  assert.ok(!hop.some((p) => p.topic === 'kaffee'))
  await putKnowledgePack({ ...c, user_ok: false })
  const after = await listKnowledgePacks()
  assert.ok(!retrievePacks('Espresso Maschine', after).some((p) => p.topic === 'kaffee'))
  void a
  void b
}

assert.equal(AGENT_META.fuel.knowledge, undefined)
assert.equal(AGENT_META.tv.knowledge, undefined)
assert.equal(AGENT_META.film.knowledge, true)
assert.equal(AGENT_META.watchlist.knowledge, true)
{
  const edges = knowledgeSynapses('film', ['filme-gesehen'])
  assert.ok(edges.some((e) => e.to === 'wissen:filme-gesehen'))
}

console.log('test-knowledge-11 ok')
