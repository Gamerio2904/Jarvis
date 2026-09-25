import { markUsedAgent } from './agent-session.ts'
import { clearPending, getPending, loadSettings, saveSettings, setPending, type ToolPending } from './store.ts'
import { loadPlugs } from './plug.ts'
import { handleTools } from './tools.ts'
import { handleFuel } from './fuel.ts'
import { handlePoi } from './poi.ts'
import { handleTransit } from './transit.ts'
import { handleWeather } from './weather.ts'
import { askReply, TOOL_LABEL, type PolicyPick } from './policy.ts'
import { decideTurn } from './route-pick.ts'
import { agentById, fromHandler, weatherLast } from './agents/catalog.ts'
import { runAgent } from './agents/runner.ts'
import { curatorPreflight } from './agents/curator.ts'
import { beginAgentTurn, pushAgentTrace, setLastUserFacts, setPolicyAsk } from './agents/trace-store.ts'
import { confirmedUtterance, contractOf, looksCommandish } from './tool-contract.ts'
import { proposeReady, proposeTool } from './tool-propose.ts'
import { APP_FLAG_TOOL, parseAppIntent } from './app.ts'
import { handleCalendar } from './calendar.ts'
import { handleRmScene } from './rm-scene.ts'
import { handleExpert } from './expert.ts'
import { lastFailedTool, noteFail } from './working-memory.ts'
import { needsRecover, runRecover, writeHasNoRecover } from './recover.ts'
import { unknownReplyForCtx } from './command-neighbors.ts'
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
    last_failed_tool: lastFailedTool(),
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
 * Agenten und Faktenagenten (Tanke, Wetter, POI, Sport) sagen ab: sonst
 * erfindet das Modell Preise und Tabellen. Write/Device ohne `factual`
 * (TV, Kalender) sagen „nichts geändert“.
 */
export function failureReply(id: string, result: AgentResult): string {
  if (!result.failed && result.tool?.tool_status !== 'error') return ''
  const agent = agentById(id)
  if (!agent) return ''
  const label = TOOL_LABEL[id] || agent.label || id
  if (agent.factual || agent.sideEffect === 'read') {
    if (result.failReason === 'breaker') {
      return `${label} ist gerade nicht erreichbar. Ich rate nicht.`
    }
    return result.failReason === 'timeout'
      ? `${label} hat nicht geantwortet. Ich rate nicht.`
      : `${label} hat keine Daten geliefert. Ich rate nicht.`
  }
  if (result.failReason === 'breaker') {
    return `${label} ist gerade nicht erreichbar. Ich habe nichts geändert — in einer Minute nochmal.`
  }
  return result.failReason === 'timeout'
    ? `${label} hat nicht geantwortet. Ich habe nichts geändert — bitte nochmal.`
    : `${label} hat nicht funktioniert. Ich habe nichts geändert — bitte nochmal.`
}

export const PROPOSAL_TOOL = 'proposal'

const YES = /^\s*(ja|jo|yes|ok|okay|mach|mach\s+das|passt|gerne|bitte)\s*[.!]?\s*$/i
const NO = /^\s*(nein|no|nee|abbrechen|stopp|lass|lass\s+es)\s*[.!]?\s*$/i

/**
 * Vierte Schranke: was ein Gerät anfasst oder Daten ändert, wartet auf ein
 * „ja". Der wartende Satz ist die **übersetzte** Fassung, nicht die Absicht
 * des Modells — bestätigt wird genau das, was danach ausgeführt wird.
 */
async function answerProposal(
  conversationId: string,
  pending: ToolPending,
  text: string,
): Promise<DirectorTurn | null> {
  const utterance = String(pending.args?.utterance || '')
  if (NO.test(text)) {
    await clearPending(conversationId)
    const reply = 'Okay, nicht gemacht.'
    setLastUserFacts(reply)
    return { hit: { reply, lastTool: pending.action || PROPOSAL_TOOL }, userFacts: reply }
  }
  if (!YES.test(text) || !utterance) return null
  const intent = parseAppIntent(utterance)
  if (intent?.kind === 'ui' && intent.action.id === 'settings.set') {
    await setPending({
      conversation_id: conversationId,
      tool: APP_FLAG_TOOL,
      action: 'app',
      args: { flag: intent.action.flag, on: intent.action.on, utterance },
      preview: utterance,
      created_at: new Date().toISOString(),
    })
  } else {
    await clearPending(conversationId)
  }
  const decision = decideTurn(makeDirectorCtx(conversationId, utterance))
  if (decision.pick.kind !== 'run' || decision.pick.id !== pending.action) return null
  return runPicked(decision.pick.id, decision.ctx, conversationId, utterance)
}

async function answerFlag(
  conversationId: string,
  pending: ToolPending,
  text: string,
): Promise<DirectorTurn | null> {
  if (NO.test(text)) {
    await clearPending(conversationId)
    const reply = 'Okay, nicht gemacht.'
    setLastUserFacts(reply)
    return { hit: { reply, lastTool: pending.action || 'app' }, userFacts: reply }
  }
  if (!YES.test(text)) return null
  const utterance = String(pending.args?.utterance || '')
  if (!utterance) return null
  return runPicked('app', makeDirectorCtx(conversationId, utterance), conversationId, utterance)
}

/**
 * Der Vorschlagsweg. Er läuft **nur**, wenn kein Parser zuständig war und der
 * Satz nach einer Anweisung aus einer Werkzeug-Domäne aussieht. Smalltalk und
 * Wissensfragen gehen weiter direkt und gestreamt ans Modell.
 *
 * Ausgeführt wird nie der Vorschlag, sondern der deutsche Satz, in den er
 * übersetzt wurde — geprüft von derselben Routing-Kette wie eine getippte
 * Äußerung. Bestätigt kein Parser den übersetzten Satz, passiert nichts.
 */
async function rescueByProposal(conversationId: string, ctx: RouteCtx): Promise<DirectorTurn | null> {
  if (!looksCommandish(ctx.text) || !proposeReady()) return null
  const t0 = performance.now()
  const proposal = await proposeTool(ctx.text)
  let decision: (ReturnType<typeof decideTurn>) | null = null
  const utterance = proposal
    ? confirmedUtterance(proposal, (text) => {
        decision = decideTurn({ ...ctx, text })
        return decision.pick.kind === 'run' ? decision.pick.id : null
      })
    : null
  const contract = proposal ? contractOf(proposal.tool) : null
  pushAgentTrace({
    agentId: 'propose',
    phase: 'parse',
    ms: Math.round(performance.now() - t0),
    ok: Boolean(utterance),
    detail: utterance ? `${proposal?.tool} → „${utterance}"` : `verworfen: ${proposal?.tool ?? 'kein Vorschlag'}`,
  })
  if (!proposal || !utterance || !contract || !decision) return null

  /**
   * Alles, was etwas ändert oder ein Gerät anfasst, wartet auf ein „ja". Die
   * Regel kommt aus dem Katalog, nicht aus dem Vertrag — so kann sie beim
   * nächsten Werkzeug nicht vergessen werden.
   */
  if (agentById(contract.agent)?.sideEffect !== 'read') {
    await setPending({
      conversation_id: conversationId,
      tool: PROPOSAL_TOOL,
      action: contract.agent,
      args: { utterance },
      preview: utterance,
      created_at: new Date().toISOString(),
    })
    const reply = `Verstanden als „${utterance}". Soll ich?`
    setLastUserFacts(reply)
    return { hit: { reply, lastTool: PROPOSAL_TOOL }, userFacts: reply }
  }

  return runPicked(contract.agent, (decision as ReturnType<typeof decideTurn>).ctx, conversationId, utterance)
}

/**
 * Ein Zug: preflight → router → execute → merge.
 *
 * Einen eigenen Verify-Schritt hat der Director **nicht**, und das ist eine
 * Entscheidung, keine Lücke. Geprüft wird dort, wo es etwas zu prüfen gibt:
 * die Module mit echter Wirkung packen ihre Antwort durch `packVerified` und
 * senden von dort die Phase `verify`. Ein generischer Schritt müsste nach
 * jeder Aktion ein zweites Mal nachsehen — das kostet Zeit und Kontingent und
 * wüsste nichts, was das Modul nicht schon weiß.
 */
export async function runDirectorTurn(conversationId: string, text: string): Promise<DirectorTurn> {
  beginAgentTurn()
  await curatorPreflight(conversationId, text)

  const pending = await getPending(conversationId)
  if (pending?.tool === PROPOSAL_TOOL) {
    const answered = await answerProposal(conversationId, pending, text)
    if (answered) return answered
    await clearPending(conversationId)
  } else if (pending?.tool === APP_FLAG_TOOL) {
    const answered = await answerFlag(conversationId, pending, text)
    if (answered) return answered
    await clearPending(conversationId)
  } else if (pending?.tool === 'calendar' && pending.action === 'remind_offsets') {
    const answered = await handleCalendar(conversationId, text)
    if (answered.handled && answered.reply) {
      const hit = await fromHandler('calendar', answered)
      if (hit) {
        setLastUserFacts(hit.reply)
        return { hit, userFacts: hit.reply }
      }
    }
  } else if (pending?.tool === 'hud' && pending.action === 'rm_scene') {
    const answered = await handleRmScene(conversationId, text)
    if (answered.handled && answered.reply) {
      const hit = await fromHandler('hud', answered)
      if (hit) {
        setLastUserFacts(hit.reply)
        return { hit, userFacts: hit.reply }
      }
    }
  } else if (pending?.tool === 'expert' && pending.action === 'create') {
    const answered = await handleExpert(conversationId, text)
    if (answered.handled && answered.reply) {
      const hit = await fromHandler('expert', answered)
      if (hit) {
        setLastUserFacts(hit.reply)
        return { hit, userFacts: hit.reply }
      }
    }
  } else if (pending) {
    const pendingHit = await handleTools(conversationId, text)
    if (pendingHit.handled && pendingHit.reply) {
      const hit = await fromHandler('todo', pendingHit)
      if (hit) {
        setLastUserFacts(hit.reply)
        return { hit, userFacts: hit.reply }
      }
    }
  }

  const t0 = performance.now()
  const { pick, candidates: raw, ctx } = decideTurn(makeDirectorCtx(conversationId, text))
  pushAgentTrace({
    agentId: 'router',
    phase: 'parse',
    ms: Math.round(performance.now() - t0),
    ok: raw.length > 0,
    detail: `${raw.length} candidates → ${pick.kind === 'run' ? pick.id : pick.kind}`,
  })

  if (pick.kind === 'none') {
    const rescued = await rescueByProposal(conversationId, ctx)
    if (rescued) return rescued
    if (looksCommandish(ctx.text)) {
      const reply = unknownReplyForCtx(ctx)
      setLastUserFacts(reply)
      return { hit: { reply, lastTool: 'unknown' }, userFacts: reply }
    }
    return { hit: null }
  }
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

  return runPicked(pick.id, ctx, conversationId, text)
}

/** Ausführung und Nachlauf — für den Parser-Treffer wie für den bestätigten Vorschlag. */
async function runPicked(
  id: string,
  ctx: RouteCtx,
  conversationId: string,
  text: string,
): Promise<DirectorTurn> {
  saveSettings({ last_agent_id: id })
  markUsedAgent(id)
  const result = await runAgent(id, ctx)
  /** Abgebrochen heißt: der Nutzer wollte etwas anderes. Kein Fehlertext. */
  if (result.aborted) return { hit: null }
  if (needsRecover(id, result)) {
    const recovered = await runRecover(id, ctx)
    if (recovered?.reply) {
      noteFail(id, result.failReason || 'recover')
      setLastUserFacts(recovered.reply)
      return { hit: { reply: recovered.reply, lastTool: id }, userFacts: recovered.reply }
    }
  }
  if (!result.handled || result.failed || result.tool?.tool_status === 'error') {
    const honest = failureReply(id, result) || (writeHasNoRecover(id) ? '' : 'Geht nicht. Kein Raten.')
    if (!honest) return { hit: null }
    noteFail(id, result.failReason || 'error')
    setLastUserFacts(honest)
    return { hit: { reply: honest, lastTool: id }, userFacts: honest }
  }

  let hit: RouteHit = {
    reply: result.reply || '',
    tool: result.tool,
    research: result.research,
    lastTool: result.lastTool || id,
    retry: result.retry,
    blocks: result.blocks,
  }

  hit = await applyRetry(hit, conversationId, text)
  if (hit.reply) setLastUserFacts(result.userFacts || hit.reply)
  return { hit: hit.reply ? hit : null, userFacts: result.userFacts || hit.reply }
}
