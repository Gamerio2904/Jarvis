import { getPending, loadSettings, saveSettings } from './store.ts'
import { loadPlugs } from './plug.ts'
import { handleTools } from './tools.ts'
import { handleFuel } from './fuel.ts'
import { handlePoi } from './poi.ts'
import { handleTransit } from './transit.ts'
import { handleWeather } from './weather.ts'
import { askReply, TOOL_LABEL, type PolicyPick } from './policy.ts'
import { decideRouteFromCtx } from './route-pick.ts'
import { agentById, fromHandler, weatherLast } from './agents/catalog.ts'
import { runAgent } from './agents/runner.ts'
import { curatorPreflight } from './agents/curator.ts'
import { beginAgentTurn, pushAgentTrace, setLastUserFacts, setPolicyAsk } from './agents/trace-store.ts'
import type { AgentResult, RouteHit } from './agents/types.ts'
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

/**
 * Ein gescheiterter Schreib- oder Geräte-Agent darf nicht ans Modell
 * durchfallen — das könnte einen Erfolg behaupten, den es nie gab. Lesende
 * Agenten dürfen weiterfallen: dort gibt es nichts zu behaupten.
 */
function failureReply(id: string, result: AgentResult): string {
  if (!result.failed) return ''
  const agent = agentById(id)
  if (!agent || agent.sideEffect === 'read') return ''
  const label = TOOL_LABEL[id] || agent.label || id
  return result.failReason === 'timeout'
    ? `${label} hat nicht geantwortet. Ich habe nichts geändert — bitte nochmal.`
    : `${label} hat nicht funktioniert. Ich habe nichts geändert — bitte nochmal.`
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
  if (!result.handled) {
    const honest = failureReply(pick.id, result)
    if (!honest) return { hit: null }
    setLastUserFacts(honest)
    return { hit: { reply: honest, lastTool: pick.id }, userFacts: honest }
  }

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
