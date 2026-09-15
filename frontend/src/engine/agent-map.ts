import { parseCatalog } from './agents/parse-catalog.ts'
import { getTurnTraces } from './agents/trace-store.ts'
import type { AgentSpec, DepartmentId } from './agents/types.ts'

export type DepartmentNode = {
  id: DepartmentId
  label: string
  x: number
  y: number
}

/** Seven domain clusters around Haus-Gehirn (Sprint 234). */
export const DEPARTMENT_NODES: DepartmentNode[] = [
  { id: 'geraete', label: 'Geräte', x: -0.82, y: 0.28 },
  { id: 'medien', label: 'Medien', x: 0, y: 0.88 },
  { id: 'navigation', label: 'Navigation', x: 0.82, y: 0.28 },
  { id: 'alltag', label: 'Alltag', x: 0.88, y: -0.32 },
  { id: 'information', label: 'Information', x: 0.34, y: -0.88 },
  { id: 'wissen', label: 'Wissen', x: -0.34, y: -0.88 },
  { id: 'werkstatt', label: 'Werkstatt', x: -0.88, y: -0.32 },
]

export const BRAIN_CENTER = { id: 'brain', label: 'Haus-Gehirn', x: 0, y: 0 }

export function departmentLabel(id: DepartmentId): string {
  if (id === 'system') return 'Kern'
  return DEPARTMENT_NODES.find((d) => d.id === id)?.label || id
}

export function visibleAgents(showInternal = false): AgentSpec[] {
  return parseCatalog().filter((a) => showInternal || a.visibility !== 'internal')
}

export function agentsInDepartment(dept: DepartmentId, showInternal = false): AgentSpec[] {
  return visibleAgents(showInternal).filter((a) => a.department === dept)
}

/** Nur der Agent, der gerade läuft — nicht der letzte aus einer alten Sitzung. */
export function activeAgentId(): string {
  const traces = getTurnTraces()
  for (let i = traces.length - 1; i >= 0; i--) {
    const id = traces[i]?.agentId || ''
    if (id && id !== 'router' && id !== 'curator') return id
  }
  return ''
}

export function activeTracePath(): string[] {
  return getTurnTraces().map((t) => t.agentId)
}

export function departmentLive(dept: DepartmentId): boolean {
  const active = activeAgentId()
  if (!active) return false
  const agent = parseCatalog().find((a) => a.id === active)
  return agent?.department === dept
}

export type AgentDot = {
  id: string
  label: string
  task: string
  department: DepartmentId
  x: number
  y: number
}

export type Synapse = { from: string; to: string }

export function agentTask(agent: { label: string; promptSlice?: string; goldPrompts?: string[] }): string {
  const gold = (agent.goldPrompts || []).find((g) => String(g).trim())
  if (gold) return `${agent.label} — ${gold}`
  const slice = String(agent.promptSlice || '')
    .replace(/^Domäne \w+:\s*/i, '')
    .trim()
  if (slice && !/^Parser-Fakten/i.test(slice)) return `${agent.label} — ${slice}`
  return `${agent.label} — Im Chat ansprechen.`
}

/** Einzelne sichtbare Agenten, in Büscheln um die sieben Cluster. */
export function layoutAgentDots(): AgentDot[] {
  const shown = visibleAgents()
  const byDept = new Map<DepartmentId, ReturnType<typeof visibleAgents>>()
  for (const a of shown) {
    const list = byDept.get(a.department) || []
    list.push(a)
    byDept.set(a.department, list)
  }
  const dots: AgentDot[] = []
  for (const dept of DEPARTMENT_NODES) {
    const agents = byDept.get(dept.id) || []
    const n = agents.length
    const hub = Math.hypot(dept.x, dept.y) || 1
    const ux = dept.x / hub
    const uy = dept.y / hub
    const px = -uy
    const py = ux
    agents.forEach((a, i) => {
      const t = n <= 1 ? 0 : (i / (n - 1) - 0.5)
      const fan = t * 0.62
      const out = 0.2 + Math.abs(t) * 0.04
      dots.push({
        id: a.id,
        label: a.label,
        task: agentTask(a),
        department: a.department,
        x: dept.x + ux * out + px * fan,
        y: dept.y + uy * out + py * fan,
      })
    })
  }
  const core = byDept.get('system') || []
  core.forEach((a, i) => {
    const n = Math.max(1, core.length)
    const ang = (i / n) * Math.PI * 2 - Math.PI / 2
    dots.push({
      id: a.id,
      label: a.label,
      task: agentTask(a),
      department: a.department,
      x: Math.cos(ang) * 0.44,
      y: Math.sin(ang) * 0.44,
    })
  })
  return dots
}

export function synapses(dots: AgentDot[]): Synapse[] {
  const edges: Synapse[] = []
  const liveDepts = DEPARTMENT_NODES.filter((d) => dots.some((a) => a.department === d.id))
  for (const d of liveDepts) {
    edges.push({ from: 'brain', to: `dept:${d.id}` })
  }
  for (let i = 0; i < liveDepts.length; i++) {
    const a = liveDepts[i]
    const b = liveDepts[(i + 1) % liveDepts.length]
    if (a && b && liveDepts.length > 1) edges.push({ from: `dept:${a.id}`, to: `dept:${b.id}` })
  }
  const byDept = new Map<DepartmentId, AgentDot[]>()
  for (const dot of dots) {
    const list = byDept.get(dot.department) || []
    list.push(dot)
    byDept.set(dot.department, list)
  }
  for (const [dept, group] of byDept) {
    for (let i = 0; i < group.length; i++) {
      if (dept === 'system') {
        edges.push({ from: 'brain', to: group[i].id })
      } else {
        edges.push({ from: `dept:${dept}`, to: group[i].id })
      }
      if (group.length > 1) {
        edges.push({ from: group[i].id, to: group[(i + 1) % group.length].id })
      }
      if (group.length > 3) {
        edges.push({ from: group[i].id, to: group[(i + 2) % group.length].id })
      }
    }
  }
  return edges
}

/** Hirn → Cluster → Agent, entlang der letzten Spur. */
export function sparkPath(activeId: string, traces: string[]): string[] {
  const seen: string[] = []
  for (const id of traces) {
    if (!id || id === 'router' || id === 'curator') continue
    if (seen[seen.length - 1] === id) continue
    seen.push(id)
  }
  const hops = [...seen]
  if (activeId && hops[hops.length - 1] !== activeId) hops.push(activeId)
  if (!hops.length) return []
  const path: string[] = ['brain']
  for (const id of hops) {
    const agent = parseCatalog().find((a) => a.id === id)
    if (!agent) continue
    if (agent.department !== 'system') {
      const dept = `dept:${agent.department}`
      if (path[path.length - 1] !== dept) path.push(dept)
    }
    if (path[path.length - 1] !== id) path.push(id)
  }
  return path.length > 1 ? path : hops.length ? ['brain'] : []
}

/** Hin und zurück — die Blitzkugel pendelt zwischen den Knoten. */
export function sparkLoop(path: string[]): string[] {
  if (path.length < 2) return path
  return path.concat(path.slice().reverse().slice(1))
}
