import assert from 'node:assert/strict'
import {
  agentTask,
  layoutAgentDots,
  sparkLoop,
  sparkPath,
  synapses,
  visibleAgents,
} from '../src/engine/agent-map.ts'
import { buildAgentGraph } from '../src/engine/agent-graph.ts'
import {
  clampPan,
  clampZoom,
  labelsVisible,
  MAP_ZOOM_MAX,
  MAP_ZOOM_MIN,
  zoomMagnify,
} from '../src/engine/agent-zoom.ts'

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

const idle = buildAgentGraph('brain', false)
assert.ok(idle.nodes.filter((n) => n.kind === 'agent').length >= 40)
assert.equal(idle.nodes.some((n) => n.live), false)
assert.match(idle.nodes[0]?.line || '', /Agenten/)
const busy = buildAgentGraph('brain', true)
assert.equal(busy.busy, true)

// Zoom: Grenzen halten, Schwenken bleibt im Bild, Namen erst nah.
assert.equal(clampZoom(0.2), MAP_ZOOM_MIN)
assert.equal(clampZoom(99), MAP_ZOOM_MAX)
assert.equal(clampZoom(Number.NaN), MAP_ZOOM_MIN)
assert.equal(clampZoom(2.4), 2.4)
assert.equal(clampPan(9999, 300, 1), 40)
assert.equal(clampPan(-9999, 300, 1), -40)
assert.equal(clampPan(0, 300, 3), 0)
assert.equal(clampPan(9999, 300, 3), 340)
assert.equal(clampPan(Number.NaN, 300, 3), 0)
assert.equal(zoomMagnify(1), 1)
assert.ok(zoomMagnify(2.4) > 1.5)
assert.equal(zoomMagnify(20), 2)
assert.equal(labelsVisible(1), false)
assert.equal(labelsVisible(1.6), true)

const { nearestHit } = await import('../src/engine/agent-zoom.ts')
// Der erste in der Liste darf nicht gewinnen, wenn ein späterer näher liegt.
assert.equal(
  nearestHit(10, 10, [
    { id: 'fan', x: 0, y: 0, r: 14 },
    { id: 'tv', x: 10, y: 10, r: 14 },
  ]),
  'tv',
)
assert.equal(nearestHit(0, 0, [{ id: 'a', x: 40, y: 0, r: 14 }]), null)
// Bei gleichem Abstand gewinnt die vordere Halbkugel (kleineres z).
assert.equal(
  nearestHit(0, 0, [
    { id: 'back', x: 0, y: 0, r: 14, z: 0.8 },
    { id: 'front', x: 0, y: 0, r: 14, z: -0.4 },
  ]),
  'front',
)

const { beginAgentTurn, pushAgentTrace, subscribeAgentTraces } = await import(
  '../src/engine/agents/trace-store.ts'
)
let kicks = 0
const off = subscribeAgentTraces(() => {
  kicks += 1
})
beginAgentTurn()
pushAgentTrace({
  agentId: 'tv',
  phase: 'execute',
  ok: true,
  ms: 1,
})
off()
assert.ok(kicks >= 2, `Körper muss bei jedem Trace neu zeichnen, nicht erst beim Poll: ${kicks}`)

console.log('test:agent-map ok')
