import { lastLatency, subscribeLatency, type LatencyPath } from './latency.ts'
import { quotaSnapshot } from './quota.ts'
import { currentAgentTurn, getBrainSlots, getTurnTraces } from './agents/trace-store.ts'

/**
 * Die letzten Züge dieser Sitzung — Route, Agenten, Zeiten und
 * Kontingent-Stand an **einer** Stelle.
 *
 * Gemessen wurde das alles schon: `latency.ts` hält die Zeiten,
 * `trace-store.ts` die Agenten-Schritte. Was fehlte, war das Durchblättern:
 * bisher war immer nur der laufende Zug sichtbar, und „er hat vorhin Unsinn
 * geredet" ließ sich nicht zeigen.
 *
 * **Im Speicher, nicht auf der Platte.** Ein Schreibvorgang je Zug auf die
 * Platte wäre Latenz und Akku für ein Debug-Werkzeug — genau der Tausch, den
 * die Prioritätenliste verbietet. Der Preis: ein Neustart löscht die
 * Historie. Vertretbar, weil ein Fehlerbericht in derselben Sitzung entsteht;
 * für später gibt es den Export.
 */

export const MAX_HISTORY = 50

/** Kurz genug, dass 50 Züge im Speicher nicht auffallen. */
const MAX_TEXT = 200
const MAX_STEPS = 40

export type HistoryStep = {
  agent: string
  phase: string
  ms: number
  ok: boolean
  detail?: string
}

export type HistoryTurn = {
  turn: number
  at: string
  text: string
  reply: string
  path: LatencyPath
  msTotal: number
  msFirstToken: number | null
  msFirstAudio: number | null
  steps: HistoryStep[]
  brain: Array<{ slot: string; model: string; ms: number; ok: boolean }>
  /** Warum die Antwort von dort kam, wo sie herkam. */
  quota: Array<{ provider: string; remainingRequests: number | null; blocked: boolean }>
}

const turns: HistoryTurn[] = []
let openText = ''
let openReply = ''
let wired = false
const listeners = new Set<() => void>()

function cut(text: string): string {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  return t.length > MAX_TEXT ? `${t.slice(0, MAX_TEXT - 1)}…` : t
}

function emit(): void {
  for (const fn of listeners) {
    try {
      fn()
    } catch {
      /* eine kaputte Ansicht darf die Historie nicht kippen */
    }
  }
}

export function subscribeHistory(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Beginn eines Zuges. Die Äußerung wird nur gemerkt, nicht verarbeitet. */
export function openHistoryTurn(text: string): void {
  wire()
  openText = cut(text)
  openReply = ''
}

/** Die Antwort, wie sie der Nutzer sieht. Mehrere Rufe: der letzte gilt. */
export function noteHistoryReply(text: string): void {
  if (!openText) return
  openReply = cut(text)
}

/**
 * Zusammengeführt wird **nach** der Antwort, nicht im Zug: `finishLatency()`
 * ruft seine Zuhörer erst, wenn die Zeit gestoppt ist. Vorher wird nichts
 * kopiert, sortiert oder serialisiert.
 */
function seal(): void {
  const lag = lastLatency()
  if (!lag || !openText) return
  const steps = getTurnTraces()
    .slice(0, MAX_STEPS)
    .map((t) => ({ agent: t.agentId, phase: t.phase, ms: t.ms, ok: t.ok, detail: t.detail }))
  turns.push({
    turn: currentAgentTurn(),
    at: lag.at,
    text: openText,
    reply: openReply,
    path: lag.path,
    msTotal: lag.msTotal,
    msFirstToken: lag.msFirstToken,
    msFirstAudio: lag.msFirstAudio,
    steps,
    brain: getBrainSlots()
      .slice(0, MAX_STEPS)
      .map((b) => ({ slot: b.slot, model: b.model, ms: b.ms, ok: b.ok })),
    quota: quotaSnapshot().map((q) => ({
      provider: q.provider,
      remainingRequests: q.remainingRequests,
      blocked: q.blockedUntil > Date.now(),
    })),
  })
  if (turns.length > MAX_HISTORY) turns.shift()
  openText = ''
  openReply = ''
  emit()
}

function wire(): void {
  if (wired) return
  wired = true
  subscribeLatency(seal)
}

export function historyTurns(): HistoryTurn[] {
  return [...turns]
}

/** Von hinten gesucht: läuft ein Zug ohne `beginAgentTurn`, wiederholt sich die Nummer. */
export function historyTurn(turn: number): HistoryTurn | null {
  for (let i = turns.length - 1; i >= 0; i -= 1) {
    if (turns[i].turn === turn) return turns[i]
  }
  return null
}

export function resetHistory(): void {
  turns.length = 0
  openText = ''
  openReply = ''
  emit()
}

/** Vom Nutzer ausgelöst, nicht laufend geschrieben. */
export function historyExport(): string {
  return `${JSON.stringify({ kind: 'jarvis-history', at: new Date().toISOString(), turns }, null, 2)}\n`
}

/** Eine Zeile je Zug für die Liste in der Oberfläche. */
export function historyLine(t: HistoryTurn): string {
  const when = new Date(t.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const agents = t.steps.filter((s) => s.agent !== 'router').map((s) => s.agent)
  const who = agents.length ? [...new Set(agents)].join(', ') : t.path
  return `${when} · ${who} · ${t.msTotal} ms`
}
