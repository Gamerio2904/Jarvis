/**
 * Smoke: AgentSpec metadata + parse catalog; executor IDs match domain agents.
 */
import assert from 'node:assert/strict'
import { parseCatalog, routingAgents } from '../src/engine/agents/parse-catalog.ts'
import { AGENT_META } from '../src/engine/agents/meta.ts'
import { EXECUTOR_IDS } from '../src/engine/agents/executor-ids.ts'

/** @type {import('../src/engine/route-types.ts').RouteCtx} */
const EMPTY_CTX = {
  conversationId: 'test-agents',
  text: 'test',
  lastTool: '',
  lastMedium: '',
  inDrive: false,
  weatherLast: null,
  plugNames: [],
  lastPlace: '',
}

const catalog = parseCatalog()
assert.ok(catalog.length >= 59, `expected >=59 agents, got ${catalog.length}`)

for (const id of Object.keys(AGENT_META)) {
  assert.ok(catalog.some((a) => a.id === id), `catalog missing meta id ${id}`)
}

for (const agent of catalog) {
  assert.ok(agent.label, `${agent.id} label`)
  assert.ok(agent.department, `${agent.id} department`)
  assert.ok(Array.isArray(agent.organs) && agent.organs.length > 0, `${agent.id} organs`)
  assert.ok(['read', 'write', 'device'].includes(agent.sideEffect), `${agent.id} sideEffect`)
}

const routing = routingAgents()
assert.equal(routing.length, catalog.filter((a) => a.parse).length)

assert.ok(routing.some((a) => a.id === 'identity'), 'identity routes')
assert.ok(!EXECUTOR_IDS.includes('identity'), 'identity has no execute')

for (const agent of routing) {
  const score = agent.parse(EMPTY_CTX)
  assert.ok(score === null || typeof score === 'number', `${agent.id} parse smoke`)
}

for (const agent of catalog) {
  if (agent.id === 'identity') continue
  assert.ok(EXECUTOR_IDS.includes(agent.id), `${agent.id} missing executor id`)
}

const byDept = new Map()
for (const agent of catalog) {
  byDept.set(agent.department, (byDept.get(agent.department) || 0) + 1)
}
assert.ok(byDept.get('geraete') >= 6, 'geraete cluster')
assert.ok(byDept.get('navigation') >= 11, 'navigation cluster')

console.log(`test:agents ok — ${catalog.length} specs, ${routing.length} parsers, ${EXECUTOR_IDS.length} executors`)
