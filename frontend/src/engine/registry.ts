import { getPending, loadSettings } from './store'
import { loadPlugs } from './plug'
import { handleFuel } from './fuel'
import { handlePoi } from './poi'
import { handleTransit } from './transit'
import { handleTools } from './tools'
import { handleWeather } from './weather'
import { askReply, pickPolicy } from './policy'
import { propose } from './route-pick'
import type { RouteCtx } from './route-types'
import { agentById, executableAgents, fromHandler, weatherLast } from './agents/catalog.ts'

export type { RouteCtx, SideEffect } from './route-types'
export type { RouteHit } from './agents/types.ts'

/** @deprecated use AgentSpec from agents/catalog — kept for callers expecting Capability shape */
export type Capability = {
  id: string
  label: string
  sideEffect: import('./route-types').SideEffect
  parse: (ctx: RouteCtx) => number | null
  execute: (ctx: RouteCtx) => Promise<import('./agents/types.ts').RouteHit | null>
}

export function capabilities(): Capability[] {
  return executableAgents().map((a) => ({
    id: a.id,
    label: a.label,
    sideEffect: a.sideEffect,
    parse: a.parse!,
    execute: a.execute!,
  }))
}

export function makeCtx(conversationId: string, text: string): RouteCtx {
  const s = loadSettings()
  return {
    conversationId,
    text,
    lastTool: (s.last_step_tool || '').trim(),
    lastMedium: (s.last_medium || '').trim(),
    inDrive: Boolean(s.drive_mode),
    weatherLast: weatherLast(),
    plugNames: loadPlugs().map((p) => p.name),
    lastPlace: s.last_place || '',
  }
}

export { pickRoute, pickRouteFromCtx, propose } from './route-pick'

export async function routeRegistry(conversationId: string, text: string) {
  const pending = await getPending(conversationId)
  if (pending) {
    const pendingHit = await handleTools(conversationId, text)
    if (pendingHit.handled && pendingHit.reply) return fromHandler('todo', pendingHit)
  }
  const ctx = makeCtx(conversationId, text)
  const pick = pickPolicy(propose(ctx))
  if (pick.kind === 'none') return null
  if (pick.kind === 'ask') {
    return { reply: askReply(pick.a, pick.b), lastTool: 'clarify' }
  }
  const agent = agentById(pick.id)
  if (!agent?.execute) return null
  const hit = await agent.execute(ctx)
  if (!hit) return null
  if (hit.retry) {
    const utterance = loadSettings().last_step_utterance || text
    if (hit.retry === 'fuel') return fromHandler('fuel', await handleFuel(conversationId, utterance))
    if (hit.retry === 'weather') return fromHandler('weather', await handleWeather(utterance))
    if (hit.retry === 'poi') return fromHandler('poi', await handlePoi(conversationId, utterance))
    if (hit.retry === 'transit') return fromHandler('transit', await handleTransit(conversationId, utterance))
  }
  return hit
}
