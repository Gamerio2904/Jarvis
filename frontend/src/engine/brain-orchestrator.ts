import { completeGroq } from './groq.ts'
import { completeGemini, geminiReady, streamGemini } from './gemini.ts'
import { completeBrain, brainKind } from './brain.ts'
import { askReply, type PolicyPick } from './policy.ts'
import { fillResearchLinks } from './web-search.ts'
import { researchHasSources, type ResearchMeta } from './research-parse.ts'
import { loadSettings } from './store.ts'
import { pushBrainSlot } from './agents/trace-store.ts'
import {
  planBrainSlots,
  primaryChatModel,
  type BrainSlot,
  type BrainSlotResult,
  type TurnBrainCtx,
} from './brain-tasks.ts'

export type BrainOrchestratorInput = {
  messages: Array<{ role: string; content: string }>
  turn: TurnBrainCtx
  onToken?: (piece: string, full: string) => void
  voice?: boolean
  wantSearch?: boolean
}

export type BrainOrchestratorOutput = {
  text: string
  research?: ResearchMeta
  via: string
  slots: BrainSlot[]
}

function sBrain() {
  const s = loadSettings()
  return {
    brain_v2: s.brain_v2,
    brain_primary: s.brain_primary,
    brain_micro_llm_clarify: s.brain_micro_llm_clarify,
    brain_micro_llm_merge: s.brain_micro_llm_merge,
    brain_gemini_roles_vision: s.brain_gemini_roles_vision,
    brain_gemini_roles_grounding: s.brain_gemini_roles_grounding,
    brain_shadow_mode: s.brain_shadow_mode,
    gemini_enabled: s.gemini_enabled,
    gemini_api_key: s.gemini_api_key,
    groq_api_key: s.groq_api_key,
  }
}

async function runSlot(
  slot: BrainSlot,
  input: BrainOrchestratorInput,
  policyAsk: PolicyPick | null,
): Promise<BrainSlotResult> {
  const t0 = performance.now()
  const settings = sBrain()
  const model = primaryChatModel(settings)

  try {
    if (slot === 'none') {
      return { slot, model: 'none', text: '' }
    }
    if (slot === 'micro-clarify' && policyAsk?.kind === 'ask') {
      const prompt = [
        { role: 'system', content: 'Formuliere eine kurze Rückfrage auf Deutsch. Ein Satz.' },
        {
          role: 'user',
          content: `Meinst du ${policyAsk.a} oder ${policyAsk.b}?`,
        },
      ]
      const text = await Promise.race([
        completeGroq(prompt),
        new Promise<string>((_, rej) => setTimeout(() => rej(new Error('timeout')), 600)),
      ]).catch(() => askReply(policyAsk.a, policyAsk.b))
      pushBrainSlot({ slot, model: 'groq', ms: Math.round(performance.now() - t0), ok: true })
      return { slot, model: 'groq', text }
    }
    if (slot === 'micro-merge' && input.turn.userFacts.trim()) {
      const prompt = [
        { role: 'system', content: 'Formuliere 1–2 Sätze Jarvis-Stimme. Nur Fakten aus dem Block.' },
        { role: 'user', content: input.turn.userFacts },
      ]
      const text = await completeGroq(prompt)
      pushBrainSlot({ slot, model: 'groq', ms: Math.round(performance.now() - t0), ok: Boolean(text) })
      return { slot, model: 'groq', text: text || input.turn.userFacts }
    }
    if (slot === 'research-lite') {
      const q = input.messages[input.messages.length - 1]?.content || ''
      let research = await fillResearchLinks(q, '', undefined)
      const digest = (research.sources || [])
        .slice(0, 4)
        .map((x) => `${x.title}: ${x.snippet || x.url}`)
        .join('\n')
      const prompt = [
        { role: 'system', content: 'Fasse Quellen in 1–3 Sätzen zusammen. Keine erfundenen Zahlen.' },
        { role: 'user', content: `${q}\n\n${digest}` },
      ]
      const text = await completeGroq(prompt)
      if (!researchHasSources(research) && geminiReady() && settings.brain_gemini_roles_grounding) {
        const g = await completeGemini(prompt, undefined, { search: true, maxOutputTokens: 420 })
        research = g.research || research
        pushBrainSlot({ slot: 'research-deep', model: 'gemini', ms: Math.round(performance.now() - t0), ok: true })
        return { slot: 'research-deep', model: 'gemini', text: g.text, research }
      }
      pushBrainSlot({ slot, model: 'groq', ms: Math.round(performance.now() - t0), ok: Boolean(text) })
      return { slot, model: 'groq', text, research }
    }
    if (slot === 'research-deep') {
      const g = await completeGemini(input.messages, input.onToken, {
        search: true,
        maxOutputTokens: input.voice ? 240 : 900,
      })
      pushBrainSlot({ slot, model: 'gemini', ms: Math.round(performance.now() - t0), ok: Boolean(g.text) })
      return { slot, model: 'gemini', text: g.text, research: g.research }
    }
    if (slot === 'chat') {
      if (model === 'gemini' && geminiReady()) {
        const g = input.onToken
          ? await streamGemini(input.messages, input.onToken, {
              search: Boolean(input.wantSearch),
              maxOutputTokens: input.voice ? 240 : 420,
            }).then((r) => r)
          : await completeGemini(input.messages, input.onToken, {
              search: Boolean(input.wantSearch),
              maxOutputTokens: 420,
            })
        pushBrainSlot({ slot, model: 'gemini', ms: Math.round(performance.now() - t0), ok: Boolean(g.text) })
        return { slot, model: 'gemini', text: g.text, research: g.research }
      }
      if (model === 'groq') {
        const text = await completeGroq(input.messages, input.onToken)
        pushBrainSlot({ slot, model: 'groq', ms: Math.round(performance.now() - t0), ok: Boolean(text) })
        return { slot, model: 'groq', text }
      }
      const r = await completeBrain(input.messages, input.onToken, { voice: input.voice })
      pushBrainSlot({ slot, model: r.via, ms: Math.round(performance.now() - t0), ok: Boolean(r.text) })
      return { slot, model: r.via, text: r.text, research: r.research as ResearchMeta | undefined }
    }
    return { slot, model: 'none', text: '' }
  } catch (err) {
    pushBrainSlot({
      slot,
      model,
      ms: Math.round(performance.now() - t0),
      ok: false,
      detail: err instanceof Error ? err.message : 'fail',
    })
    throw err
  }
}

export async function runBrainOrchestrator(input: BrainOrchestratorInput): Promise<BrainOrchestratorOutput> {
  const settings = sBrain()
  if (!settings.brain_v2) {
    const kind = brainKind()
    if (kind === 'gemini') {
      const g = input.onToken
        ? await streamGemini(input.messages, input.onToken, { search: Boolean(input.wantSearch) }).then((r) => r)
        : await completeGemini(input.messages, input.onToken, { search: Boolean(input.wantSearch) })
      return { text: g.text, research: g.research, via: 'gemini', slots: ['chat'] }
    }
    const r = await completeBrain(input.messages, input.onToken, { search: input.wantSearch, voice: input.voice })
    return { text: r.text, research: r.research as ResearchMeta | undefined, via: r.via, slots: ['chat'] }
  }

  const slots = planBrainSlots(input.turn, settings)
  const primary = slots[0] || 'chat'

  if (settings.brain_shadow_mode) {
    const legacyPromise = completeBrain(input.messages, input.onToken, {
      search: input.wantSearch,
      voice: input.voice,
    })
    const v2Promise = runSlot(primary, input, input.turn.policyAsk).catch(() => null)
    const [legacy, v2] = await Promise.all([legacyPromise, v2Promise])
    if (v2) {
      pushBrainSlot({
        slot: 'shadow',
        model: v2.model,
        ms: 0,
        ok: Boolean(v2.text),
        detail: `baseline=${legacy.via}`,
      })
    }
    return {
      text: legacy.text,
      research: legacy.research as ResearchMeta | undefined,
      via: legacy.via,
      slots: [...slots, 'shadow'],
    }
  }

  const result = await runSlot(primary, input, input.turn.policyAsk)
  return {
    text: result.text,
    research: result.research,
    via: result.model,
    slots,
  }
}

export { planBrainSlots, primaryChatModel }
