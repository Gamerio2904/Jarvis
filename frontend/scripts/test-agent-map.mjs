import assert from 'node:assert/strict'
import {
  agentTask,
  layoutAgentDots,
  sparkLoop,
  sparkPath,
  synapses,
  visibleAgents,
} from '../src/engine/agent-map.ts'

const agents = visibleAgents()
assert.ok(agents.length >= 40, `zu wenige Agenten: ${agents.length}`)

const dots = layoutAgentDots()
assert.equal(dots.length, agents.length)
const ids = new Set(dots.map((d) => d.id))
for (const a of agents) {
  assert.ok(ids.has(a.id), `fehlt auf der Karte: ${a.id}`)
  assert.ok(Number.isFinite(dots.find((d) => d.id === a.id)?.x))
}

const edges = synapses(dots)
assert.ok(edges.some((e) => e.from === 'brain' && e.to.startsWith('dept:')))
assert.ok(edges.some((e) => e.to === 'timer' || e.from === 'timer'))
assert.equal(
  edges.every((e) => e.from !== e.to),
  true,
)

assert.match(agentTask({ label: 'Timer', goldPrompts: ['Stell einen Timer'] }), /Timer/)
assert.match(agentTask({ label: 'Geburtstag', promptSlice: 'Domäne birthday: Parser-Fakten only.' }), /Im Chat/)
assert.equal(sparkPath('timer', ['router', 'timer']).join('>'), 'brain>dept:alltag>timer')
assert.equal(sparkPath('identity', []).join('>'), 'brain>identity')
assert.deepEqual(sparkPath('', []), [])
assert.deepEqual(sparkLoop(['brain', 'dept:alltag', 'timer']), [
  'brain',
  'dept:alltag',
  'timer',
  'dept:alltag',
  'brain',
])
assert.ok(dots.some((d) => d.department === 'system'))
assert.ok(edges.some((e) => e.from.startsWith('dept:') && e.to.startsWith('dept:')))

console.log('test:agent-map ok')
