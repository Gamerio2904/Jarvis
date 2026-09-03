/** Research-Pending: WAITING → ja bitte sucht die gemerkte Frage. TTL, Cancel, kein Re-Run nach Erfolg. */

export const RESEARCH_PENDING_TTL_MS = 10 * 60 * 1000

export type ResearchPendingStatus = 'waiting' | 'running' | 'success' | 'failed' | 'cancelled' | 'expired'

export type ResearchPending = {
  utterance: string
  query: string
  at: number
  status: ResearchPendingStatus
}

const CONFIRM = /^(ja(?:\s+bitte)?|jo|yes|ok|okay|mach(?:\s+es|\s+mal)?|bitte|passt|mach(?:st)?\s+(?:du\s+)?(?:das|es)\s+an)\s*[.!?]?$/i
const RESEARCH_YES = /^(?:ja\s+bitte(?:\s+(?:suchen|recherchieren))?|bitte\s+suchen|such(?:e)?(?:\s+bitte)?)\s*[.!?]?$/i
const DECLINE = /^(nein|no|abbrechen|stopp|lass(?:\s+es)?|nicht\s+suchen)\s*[.!?]?$/i

export function isResearchConfirm(text: string): boolean {
  const raw = text.trim()
  return CONFIRM.test(raw) || RESEARCH_YES.test(raw)
}

export function isResearchDecline(text: string): boolean {
  return DECLINE.test(text.trim())
}

export function offerResearchPending(utterance: string, query: string, now = Date.now()): ResearchPending {
  const u = utterance.trim().slice(0, 240)
  const q = (query || u).trim().slice(0, 160)
  return { utterance: u, query: q || u, at: now, status: 'waiting' }
}

export function parseResearchPending(raw?: string | null): ResearchPending | null {
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as ResearchPending
    if (!p?.utterance || typeof p.at !== 'number') return null
    if (!p.query) p.query = p.utterance
    return p
  } catch {
    return null
  }
}

export function serializeResearchPending(p: ResearchPending | null): string {
  return p ? JSON.stringify(p) : ''
}

export function isResearchPendingWaiting(p: ResearchPending | null, now = Date.now()): p is ResearchPending {
  if (!p || p.status !== 'waiting') return false
  if (now - p.at > RESEARCH_PENDING_TTL_MS) return false
  return Boolean(p.utterance.trim())
}

export function expireResearchPending(p: ResearchPending | null, now = Date.now()): ResearchPending | null {
  if (!p) return null
  if (p.status === 'waiting' && now - p.at > RESEARCH_PENDING_TTL_MS) {
    return { ...p, status: 'expired' }
  }
  return p
}

export function acceptResearchPending(
  spoken: string,
  pending: ResearchPending | null,
  now = Date.now(),
): { utterance: string; query: string } | null {
  if (!isResearchConfirm(spoken)) return null
  const live = expireResearchPending(pending, now)
  if (!live || live.status !== 'waiting') return null
  const utterance = live.utterance.trim()
  if (!utterance || isResearchConfirm(utterance) || isResearchDecline(utterance)) return null
  return { utterance, query: (live.query || utterance).trim() }
}

export function declineResearchPending(spoken: string, pending: ResearchPending | null, now = Date.now()): boolean {
  if (!isResearchDecline(spoken)) return false
  return isResearchPendingWaiting(pending, now)
}

export function markResearchPending(
  pending: ResearchPending | null,
  status: ResearchPendingStatus,
  now = Date.now(),
): ResearchPending | null {
  if (!pending) return null
  return { ...pending, status, at: status === 'waiting' ? pending.at : now }
}

export function researchSourcesOk(sourceCount: number): { ok: boolean; error?: string } {
  if (sourceCount > 0) return { ok: true }
  return { ok: false, error: 'Keine Quellen.' }
}
