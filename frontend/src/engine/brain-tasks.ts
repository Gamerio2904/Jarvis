import type { ResearchMeta } from './research-parse.ts'
import type { PolicyPick } from './policy.ts'

export type BrainSlot =
  | 'none'
  | 'micro-clarify'
  | 'micro-merge'
  | 'chat'
  | 'research-lite'
  | 'research-deep'
  | 'vision'
  | 'local-fallback'
  | 'shadow'

export type TurnBrainCtx = {
  needsLlm: boolean
  vision: boolean
  deepResearch: boolean
  liveLookup: boolean
  policyAsk: PolicyPick | null
  userFacts: string
  acceptedResearch: boolean
}

export function primaryChatModel(settings: {
  brain_v2: boolean
  brain_primary: string
  gemini_enabled: boolean
  gemini_api_key: string
  groq_api_key: string
}): 'groq' | 'gemini' | 'local' {
  if (!settings.brain_v2) {
    if (settings.gemini_enabled && settings.gemini_api_key.trim()) return 'gemini'
    if (settings.groq_api_key.trim()) return 'groq'
    return 'local'
  }
  if (settings.brain_primary === 'gemini' && settings.gemini_enabled && settings.gemini_api_key.trim()) {
    return 'gemini'
  }
  if (settings.brain_primary === 'local') return 'local'
  if (settings.groq_api_key.trim()) return 'groq'
  if (settings.gemini_enabled && settings.gemini_api_key.trim()) return 'gemini'
  return 'local'
}

export function geminiRole(settings: { brain_gemini_roles_vision: boolean; brain_gemini_roles_grounding: boolean }, role: 'vision' | 'grounding'): boolean {
  if (role === 'vision') return settings.brain_gemini_roles_vision
  return settings.brain_gemini_roles_grounding
}

export function planBrainSlots(
  ctx: TurnBrainCtx,
  settings: {
    brain_v2: boolean
    brain_micro_llm_clarify: boolean
    brain_micro_llm_merge: boolean
    brain_gemini_roles_vision: boolean
    brain_gemini_roles_grounding: boolean
  },
): BrainSlot[] {
  if (ctx.vision && geminiRole(settings, 'vision')) return ['vision']
  if (ctx.deepResearch && geminiRole(settings, 'grounding')) return ['research-deep']
  if (ctx.liveLookup || ctx.acceptedResearch) {
    if (geminiRole(settings, 'grounding') && ctx.deepResearch) return ['research-deep']
    return ['research-lite']
  }
  if (settings.brain_v2 && settings.brain_micro_llm_clarify && ctx.policyAsk?.kind === 'ask') {
    return ['micro-clarify']
  }
  if (settings.brain_v2 && settings.brain_micro_llm_merge && ctx.userFacts.trim()) {
    return ['micro-merge']
  }
  if (ctx.needsLlm) return ['chat']
  return ['none']
}

export type BrainSlotResult = {
  slot: BrainSlot
  model: string
  text: string
  research?: ResearchMeta
}
