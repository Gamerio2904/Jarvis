import type { AgentTrace } from './types.ts'
import type { PolicyPick } from '../policy.ts'
import { beginTurnAbort } from '../turn-abort.ts'

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
const listeners = new Set<() => void>()

function emitTraces(): void {
  for (const fn of [...listeners]) {
    try {
      fn()
    } catch {
      /* listener */
    }
  }
}

/** Körper und Statusleiste hören hier, statt auf den nächsten Poll zu warten. */
export function subscribeAgentTraces(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function beginAgentTurn(): number {
  /** Ein neuer Zug bricht den alten wirklich ab, nicht nur das Warten darauf. */
  beginTurnAbort()
  turn += 1
  turnTraces = []
  brainSlots = []
  lastUserFacts = ''
  lastPolicyAsk = null
  emitTraces()
  return turn
}

export function currentAgentTurn(): number {
  return turn
}

export function pushAgentTrace(trace: AgentTrace, forTurn = turn): void {
  if (forTurn !== turn) return
  if (turnTraces.length >= MAX_TRACES) return
  turnTraces.push(trace)
  emitTraces()
}

export function pushBrainSlot(slot: BrainSlotTrace, forTurn = turn): void {
  if (forTurn !== turn) return
  if (brainSlots.length >= MAX_TRACES) return
  brainSlots.push(slot)
  emitTraces()
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
