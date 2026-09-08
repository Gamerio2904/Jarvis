import { parseCatalog } from './agents/parse-catalog.ts'
import { getTurnTraces } from './agents/trace-store.ts'
import type { AgentSpec, DepartmentId } from './agents/types.ts'
import { loadSettings } from './store.ts'

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
  return DEPARTMENT_NODES.find((d) => d.id === id)?.label || id
}

export function visibleAgents(showInternal = false): AgentSpec[] {
  return parseCatalog().filter((a) => showInternal || a.visibility !== 'internal')
}

export function agentsInDepartment(dept: DepartmentId, showInternal = false): AgentSpec[] {
  return visibleAgents(showInternal).filter((a) => a.department === dept)
}

export function activeAgentId(): string {
  return (loadSettings().last_agent_id || '').trim()
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
