import type { BodyOrgan } from '../hud-parse.ts'
import type { ResearchMeta } from '../research-parse.ts'
import type { ToolMeta } from '../tools.ts'
import type { RouteCtx, SideEffect } from '../route-types.ts'

export type { RouteCtx, SideEffect } from '../route-types.ts'

export type AgentVisibility = 'user' | 'domain' | 'internal'
export type AgentAutonomy = 'parser' | 'assisted' | 'llm'

export type DepartmentId =
  | 'geraete'
  | 'medien'
  | 'navigation'
  | 'alltag'
  | 'information'
  | 'wissen'
  | 'werkstatt'
  | 'system'

export type RouteHit = {
  reply: string
  tool?: ToolMeta | null
  research?: ResearchMeta
  lastTool?: string
  retry?: 'fuel' | 'weather' | 'poi' | 'transit'
}

/** Single source: parse + execute + cluster metadata for one route/agent. */
export type AgentSpec = {
  id: string
  label: string
  department: DepartmentId
  organs: BodyOrgan[]
  visibility: AgentVisibility
  sideEffect: SideEffect
  autonomy: AgentAutonomy
  parse?: (ctx: RouteCtx) => number | null
  execute?: (ctx: RouteCtx) => Promise<RouteHit | null>
  promptSlice?: string
  goldPrompts?: string[]
}

export type AgentTrace = {
  agentId: string
  phase: 'parse' | 'plan' | 'execute' | 'verify' | 'curator'
  ms: number
  ok: boolean
  detail?: string
}

export type AgentResult = {
  handled: boolean
  /**
   * Der Handler ist gescheitert (Wurf oder Budget), er hat nicht bloß
   * abgelehnt. Ein Durchfallen ans Modell wäre hier gefährlich: es könnte
   * einen Erfolg behaupten, den es nie gab.
   */
  failed?: boolean
  failReason?: string
  userFacts?: string
  reply?: string
  tool?: ToolMeta
  research?: ResearchMeta
  lastTool?: string
  retry?: RouteHit['retry']
  internal?: AgentTrace[]
}
