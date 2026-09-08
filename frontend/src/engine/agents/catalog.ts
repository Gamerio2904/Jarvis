import { AGENT_EXECUTORS } from './execute-map.ts'
import { parseCatalog } from './parse-catalog.ts'
import type { AgentSpec } from './types.ts'

export type { AgentSpec, RouteHit, RouteCtx, SideEffect } from './types.ts'
export { fromHandler, weatherLast } from './execute-map.ts'
export { parseCatalog, routingAgents } from './parse-catalog.ts'

let _catalog: AgentSpec[] | null = null

/** Full catalog: parse metadata + execute handlers merged once. */
export function agentCatalog(): AgentSpec[] {
  if (_catalog) return _catalog
  _catalog = parseCatalog().map((agent) => ({
    ...agent,
    execute: AGENT_EXECUTORS[agent.id],
  }))
  return _catalog
}

export function executableAgents(): AgentSpec[] {
  return agentCatalog().filter((a) => a.execute)
}

export function agentById(id: string): AgentSpec | undefined {
  return agentCatalog().find((a) => a.id === id)
}
