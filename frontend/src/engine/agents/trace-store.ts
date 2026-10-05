import type { AgentTrace } from './types.ts'
import type { PolicyPick } from '../policy.ts'

export type BrainSlotTrace = {
  slot: string
  model: string
  ms: number
  ok: boolean
  detail?: string
}

let turnTraces: AgentTrace[] = []
let brainSlots: BrainSlotTrace[] = []
let lastUserFacts = ''
let lastPolicyAsk: PolicyPick | null = null

export function beginAgentTurn(): void {
  turnTraces = []
  brainSlots = []
  lastUserFacts = ''
  lastPolicyAsk = null
}

export function pushAgentTrace(trace: AgentTrace): void {
  turnTraces.push(trace)
}

export function pushBrainSlot(slot: BrainSlotTrace): void {
  brainSlots.push(slot)
}

export function setLastUserFacts(facts: string): void {
  lastUserFacts = facts
}

export function getTurnTraces(): AgentTrace[] {
  return turnTraces
}

export function getBrainSlots(): BrainSlotTrace[] {
  return brainSlots
}

export function getLastUserFacts(): string {
  return lastUserFacts
}

export function setPolicyAsk(pick: PolicyPick | null): void {
  lastPolicyAsk = pick
}

export function getPolicyAsk(): PolicyPick | null {
  return lastPolicyAsk
}
