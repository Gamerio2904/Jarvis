import type { AgentTrace } from './types.ts'
import type { PolicyPick } from '../policy.ts'

export type BrainSlotTrace = {
  slot: string
  model: string
  ms: number
  ok: boolean
  detail?: string
}

/**
 * Ein abgebrochener Zug kann noch laufende Handler haben. Deren Traces gehören
 * nicht in den neuen Zug, deshalb trägt jeder Eintrag die Zug-Nummer mit.
 */
let turn = 0
let turnTraces: AgentTrace[] = []
let brainSlots: BrainSlotTrace[] = []
let lastUserFacts = ''
let lastPolicyAsk: PolicyPick | null = null

/** Debug-Ansicht bleibt lesbar, ein Amoklauf frisst nicht den Speicher. */
const MAX_TRACES = 200

export function beginAgentTurn(): number {
  turn += 1
  turnTraces = []
  brainSlots = []
  lastUserFacts = ''
  lastPolicyAsk = null
  return turn
}

export function currentAgentTurn(): number {
  return turn
}

export function pushAgentTrace(trace: AgentTrace, forTurn = turn): void {
  if (forTurn !== turn) return
  if (turnTraces.length >= MAX_TRACES) return
  turnTraces.push(trace)
}

export function pushBrainSlot(slot: BrainSlotTrace, forTurn = turn): void {
  if (forTurn !== turn) return
  if (brainSlots.length >= MAX_TRACES) return
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
