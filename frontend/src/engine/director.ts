import { getPending, loadSettings, saveSettings } from './store.ts'
import { loadPlugs } from './plug.ts'
import { handleTools } from './tools.ts'
import { handleFuel } from './fuel.ts'
import { handlePoi } from './poi.ts'
import { handleTransit } from './transit.ts'
import { handleWeather } from './weather.ts'
import { askReply, type PolicyPick } from './policy.ts'
import { decideRouteFromCtx } from './route-pick.ts'
import { fromHandler, weatherLast } from './agents/catalog.ts'
import { runAgent } from './agents/runner.ts'
import { curatorPreflight } from './agents/curator.ts'
import { beginAgentTurn, pushAgentTrace, setLastUserFacts, setPolicyAsk } from './agents/trace-store.ts'
import type { RouteHit } from './agents/types.ts'
import type { RouteCtx } from './route-types.ts'

export type DirectorTurn = {
  hit: RouteHit | null
  userFacts?: string
  policyAsk?: PolicyPick | null
}

export function makeDirectorCtx(conversationId: string, text: string): RouteCtx {
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

async function applyRetry(hit: RouteHit, conversationId: string, text: string): Promise<RouteHit> {
  if (!hit.retry) return hit
  const utterance = loadSettings().last_step_utterance || text
  if (hit.retry === 'fuel') return (await fromHandler('fuel', await handleFuel(conversationId, utterance))) || hit
  if (hit.retry === 'weather') return (await fromHandler('weather', await handleWeather(utterance))) || hit
  if (hit.retry === 'poi') return (await fromHandler('poi', await handlePoi(conversationId, utterance))) || hit
  if (hit.retry === 'transit') return (await fromHandler('transit', await handleTransit(conversationId, utterance))) || hit
  return hit
}

/** Sprint 229 — Turn: preflight → router → execute → verify → merge */
export async function runDirectorTurn(conversationId: string, text: string): Promise<DirectorTurn> {
  beginAgentTurn()
  await curatorPreflight(conversationId, text)

  const pending = await getPending(conversationId)
  if (pending) {
    const pendingHit = await handleTools(conversationId, text)
    if (pendingHit.handled && pendingHit.reply) {
      const hit = await fromHandler('todo', pendingHit)
      if (hit) {
        setLastUserFacts(hit.reply)
        return { hit, userFacts: hit.reply }
      }
    }
  }

  const ctx = makeDirectorCtx(conversationId, text)
  const t0 = performance.now()
  const { pick, candidates: raw } = decideRouteFromCtx(ctx)
  pushAgentTrace({
    agentId: 'router',
    phase: 'parse',
    ms: Math.round(performance.now() - t0),
    ok: raw.length > 0,
    detail: `${raw.length} candidates → ${pick.kind === 'run' ? pick.id : pick.kind}`,
  })

  if (pick.kind === 'none') return { hit: null }
  if (pick.kind === 'ask') {
    const s = loadSettings()
    if (s.brain_v2 && s.brain_micro_llm_clarify) {
      setPolicyAsk(pick)
      return { hit: null, userFacts: '', policyAsk: pick }
    }
    const reply = askReply(pick.a, pick.b)
    setLastUserFacts(reply)
    return { hit: { reply, lastTool: 'clarify' }, userFacts: reply }
  }

  saveSettings({ last_agent_id: pick.id })
  const result = await runAgent(pick.id, ctx)
  if (!result.handled) return { hit: null }

  let hit: RouteHit = {
    reply: result.reply || '',
    tool: result.tool,
    research: result.research,
    lastTool: result.lastTool || pick.id,
    retry: result.retry,
  }

  hit = await applyRetry(hit, conversationId, text)
  if (hit.reply) setLastUserFacts(result.userFacts || hit.reply)
  return { hit: hit.reply ? hit : null, userFacts: result.userFacts || hit.reply }
}
