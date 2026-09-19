import { activeAgentId, agentsInDepartment, departmentLabel, visibleAgents } from './agent-map.ts'
import type { DepartmentId } from './agents/types.ts'
import { loadSettings } from './store.ts'
import type { KnowledgePack } from './knowledge-types.ts'

export type AgentTreeNode = {
  id: string
  kind: 'brain' | 'cluster' | 'agent' | 'slice'
  label: string
  line: string
  parent: string | null
  depth: number
  live?: boolean
  prompt?: string
}

export type AgentGraph = {
  selectedDept: DepartmentId | 'brain'
  activeId: string
  busy: boolean
  nodes: AgentTreeNode[]
  empty: boolean
}

export function buildAgentGraph(
  selectedDept: DepartmentId | 'brain' = 'brain',
  busy = false,
  packs: KnowledgePack[] = [],
  selectedAgent = '',
): AgentGraph {
  const activeId = busy ? activeAgentId() : ''
  const catalog = visibleAgents()
  const nodes: AgentTreeNode[] = [
    {
      id: 'brain',
      kind: 'brain',
      label: 'Haus-Gehirn',
      line: `${catalog.length} Agenten.`,
      parent: null,
      depth: 0,
      live: Boolean(busy && activeId),
    },
  ]

  const clusters =
    selectedDept === 'brain'
      ? (['geraete', 'medien', 'navigation', 'alltag', 'information', 'wissen', 'werkstatt'] as DepartmentId[])
      : [selectedDept]

  for (const dept of clusters) {
    const agents = agentsInDepartment(dept)
    const clusterId = `cluster:${dept}`
    nodes.push({
      id: clusterId,
      kind: 'cluster',
      label: departmentLabel(dept),
      line: `${agents.length} Agenten`,
      parent: 'brain',
      depth: 1,
      live: Boolean(busy && agents.some((a) => a.id === activeId)),
    })
    for (const agent of agents) {
      nodes.push({
        id: `agent:${agent.id}`,
        kind: 'agent',
        label: agent.label,
        line: agent.promptSlice || agent.autonomy,
        parent: clusterId,
        depth: 2,
        live: Boolean(busy && agent.id === activeId),
        prompt: agent.goldPrompts?.[0] || `Was kann ${agent.label}?`,
      })
      if (agent.id === activeId || agent.id === selectedAgent) {
        for (const p of packs.filter((x) => x.user_ok).slice(0, 3)) {
          const claim = p.claims.find((c) => c.user_ok)?.text || p.summary
          nodes.push({
            id: `pack:${agent.id}:${p.topic}`,
            kind: 'slice',
            label: p.title || p.topic,
            line: (claim || p.topic).slice(0, 120),
            parent: `agent:${agent.id}`,
            depth: 3,
          })
        }
      }
      if (agent.promptSlice) {
        nodes.push({
          id: `slice:${agent.id}`,
          kind: 'slice',
          label: 'Prompt-Slice',
          line: agent.promptSlice,
          parent: `agent:${agent.id}`,
          depth: 3,
        })
      }
    }
  }

  const showInternal = loadSettings().show_agent_network
  if (showInternal) {
    for (const agent of visibleAgents(true).filter((a) => a.visibility === 'internal')) {
      nodes.push({
        id: `agent:${agent.id}`,
        kind: 'agent',
        label: agent.label,
        line: 'intern',
        parent: 'brain',
        depth: 1,
        live: Boolean(busy && agent.id === activeId),
      })
    }
  }

  return {
    selectedDept,
    activeId,
    busy,
    nodes,
    empty: nodes.length <= 1,
  }
}

export function childrenOf(graph: AgentGraph, parentId: string): AgentTreeNode[] {
  return graph.nodes.filter((n) => n.parent === parentId)
}
