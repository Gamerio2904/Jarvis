/**
 * Smoke: brain slot planner + primary model pick (Sprint 236–237).
 */
import assert from 'node:assert/strict'
import { planBrainSlots, primaryChatModel } from '../src/engine/brain-tasks.ts'
import { frontIndex, yawForIndex } from '../src/engine/core-brains.ts'

assert.equal(
  primaryChatModel({
    brain_v2: true,
    brain_primary: 'groq',
    gemini_enabled: true,
    gemini_api_key: 'g',
    groq_api_key: 'x',
  }),
  'groq',
)

assert.equal(
  primaryChatModel({
    brain_v2: true,
    brain_primary: 'groq',
    gemini_enabled: true,
    gemini_api_key: 'g',
    groq_api_key: '',
  }),
  'gemini',
)

assert.equal(
  primaryChatModel({
    brain_v2: true,
    brain_primary: 'local',
    gemini_enabled: true,
    gemini_api_key: 'g',
    groq_api_key: 'x',
  }),
  'local',
)

assert.equal(
  primaryChatModel({
    brain_v2: true,
    brain_primary: 'groq',
    gemini_enabled: false,
    gemini_api_key: '',
    groq_api_key: 'x',
  }),
  'groq',
)

assert.equal(
  primaryChatModel({
    brain_v2: false,
    brain_primary: 'groq',
    gemini_enabled: true,
    gemini_api_key: 'g',
    groq_api_key: 'x',
  }),
  'gemini',
)

const clarifySlots = planBrainSlots(
  {
    needsLlm: false,
    vision: false,
    deepResearch: false,
    liveLookup: false,
    policyAsk: { kind: 'ask', a: 'Wetter', b: 'Timer' },
    userFacts: '',
    acceptedResearch: false,
  },
  {
    brain_v2: true,
    brain_micro_llm_clarify: true,
    brain_micro_llm_merge: false,
    brain_gemini_roles_vision: true,
    brain_gemini_roles_grounding: true,
  },
)
assert.deepEqual(clarifySlots, ['micro-clarify'])

const mergeSlots = planBrainSlots(
  {
    needsLlm: false,
    vision: false,
    deepResearch: false,
    liveLookup: false,
    policyAsk: null,
    userFacts: '18 Grad in Berlin.',
    acceptedResearch: false,
  },
  {
    brain_v2: true,
    brain_micro_llm_clarify: false,
    brain_micro_llm_merge: true,
    brain_gemini_roles_vision: true,
    brain_gemini_roles_grounding: true,
  },
)
assert.deepEqual(mergeSlots, ['micro-merge'])

const researchSlots = planBrainSlots(
  {
    needsLlm: true,
    vision: false,
    deepResearch: false,
    liveLookup: true,
    policyAsk: null,
    userFacts: '',
    acceptedResearch: false,
  },
  {
    brain_v2: true,
    brain_micro_llm_clarify: false,
    brain_micro_llm_merge: false,
    brain_gemini_roles_vision: true,
    brain_gemini_roles_grounding: true,
  },
)
assert.deepEqual(researchSlots, ['research-lite'])

assert.equal(frontIndex(0, 3), 0)
assert.equal(frontIndex((-2 * Math.PI) / 3, 3), 1)
assert.equal(frontIndex(yawForIndex(2, 3, 0.4), 3), 2)

console.log('test:brain-orchestrator ok')
