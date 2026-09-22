import assert from 'node:assert/strict'
import { parseCatalog } from '../src/engine/agents/parse-catalog.ts'
import { AGENT_SWEEP } from '../src/engine/agents/sweep.ts'
import { EXECUTOR_IDS } from '../src/engine/agents/executor-ids.ts'
import { orphanExecutorIds } from '../src/engine/agents/catalog.ts'
import { PROMPT_SLICES } from '../src/engine/agents/prompt-slices.ts'
import { GOLD_EXPECT } from '../src/engine/eval/corpus.ts'
import { routeForEval } from '../src/engine/eval/route-eval.ts'
import { parseReminderIntent } from '../src/engine/remind-parse.ts'
import { normalizeUtterance } from '../src/engine/utterance.ts'

const catalog = parseCatalog()
const ids = catalog.map((a) => a.id)

assert.equal(orphanExecutorIds().length, 0, `verwaiste Executoren: ${orphanExecutorIds().join(', ')}`)
assert.equal(catalog.length, EXECUTOR_IDS.length)

const missingSweep = ids.filter((id) => !AGENT_SWEEP[id])
assert.equal(missingSweep.length, 0, `Sweep fehlt: ${missingSweep.join(', ')}`)

const extraSweep = Object.keys(AGENT_SWEEP).filter((id) => !ids.includes(id))
assert.equal(extraSweep.length, 0, `Sweep ohne Katalog: ${extraSweep.join(', ')}`)

const fails = []
for (const [id, text] of Object.entries(AGENT_SWEEP)) {
  const got = routeForEval(text)
  const ok = got === id || (id === 'todo' && got === 'tools')
  if (!ok) fails.push(`${id}: ${JSON.stringify(text)} → ${got}`)
  const slice = PROMPT_SLICES[id]
  assert.ok(slice, `${id} ohne Prompt-Slice`)
  assert.ok((slice.goldPrompts || []).includes(text), `${id} Slice ohne Sweep-Satz`)
}
assert.equal(fails.length, 0, `Sweep-Route falsch:\n  ${fails.join('\n  ')}`)

const goldIds = new Set(Object.values(GOLD_EXPECT))
for (const id of ids) {
  if (id === 'todo') {
    assert.ok(goldIds.has('tools') || goldIds.has('todo'), 'todo/tools fehlt in GOLD')
    continue
  }
  assert.ok(goldIds.has(id), `GOLD ohne Agent ${id}`)
}

const zehn = parseReminderIntent(normalizeUtterance('weck mich in zehn Minuten'))
assert.equal(zehn?.kind, 'create')
assert.equal(routeForEval('weck mich in zehn Minuten'), 'reminder')

const directZehn = parseReminderIntent('weck mich in zehn Minuten')
assert.equal(directZehn?.kind, 'create', 'Reminder-Parser muss Zahlenworte selbst auflösen')

console.log(`test:agents-sweep ok — ${ids.length} Agenten, ${Object.keys(AGENT_SWEEP).length} Sätze`)
