/** Recherche darf vorschlagen, nicht speichern. Ja → writeMemory. */

import { decideGate, writeMemory, type GateCandidate } from './memory-gate.ts'
import {
  del,
  getAll,
  listMemory,
  loadSettings,
  newId,
  put,
  saveSettings,
  type MemoryProposal,
} from './store.ts'

const PROPOSAL_TTL_MS = 24 * 60 * 60 * 1000

export async function listProposals(): Promise<MemoryProposal[]> {
  try {
    return await getAll<MemoryProposal>('memory_proposals')
  } catch {
    return []
  }
}

export async function pendingProposals(now = Date.now()): Promise<MemoryProposal[]> {
  const rows = await listProposals()
  return rows.filter((r) => r.status === 'pending' && now - Date.parse(r.created_at || '') < PROPOSAL_TTL_MS)
}

export async function proposeMemory(
  candidate: GateCandidate & { url?: string; origin?: MemoryProposal['origin'] },
): Promise<MemoryProposal | null> {
  const existing = await listMemory()
  const gate = decideGate(candidate, existing)
  if (gate.action === 'IGNORE' && !gate.target) return null
  const url = (candidate.url || '').trim()
  if (!url) return null
  if (!candidate.value.trim()) return null
  const row: MemoryProposal = {
    id: newId(),
    text: candidate.value.trim().slice(0, 240),
    key: candidate.key,
    category: candidate.category || 'research',
    origin: candidate.origin || 'research',
    url,
    status: 'pending',
    created_at: new Date().toISOString(),
  }
  await put('memory_proposals', row)
  try {
    saveSettings({ proposal_pending: true })
  } catch {
    /* */
  }
  return row
}

export async function acceptProposal(id?: string): Promise<{ ok: boolean; reply: string }> {
  const rows = await pendingProposals()
  const hit = id ? rows.find((r) => r.id === id) : rows[0]
  if (!hit) {
    try {
      saveSettings({ proposal_pending: false })
    } catch {
      /* */
    }
    return { ok: false, reply: 'Kein Vorschlag offen.' }
  }
  const written = await writeMemory({
    key: hit.key || 'research',
    value: hit.text,
    category: hit.category,
    origin: 'research',
    spoken: hit.text,
  })
  hit.status = 'accepted'
  await put('memory_proposals', hit)
  const more = (await pendingProposals()).length
  try {
    saveSettings({ proposal_pending: more > 0 })
  } catch {
    /* */
  }
  return {
    ok: written.stored,
    reply: written.stored
      ? `Gemerkt: ${hit.text}${hit.url ? ` Quelle: ${domainOf(hit.url)}.` : '.'}`
      : 'Gate hat den Vorschlag nicht übernommen.',
  }
}

export async function rejectProposal(id?: string): Promise<{ ok: boolean; reply: string }> {
  const rows = await pendingProposals()
  const hit = id ? rows.find((r) => r.id === id) : rows[0]
  if (!hit) {
    try {
      saveSettings({ proposal_pending: false })
    } catch {
      /* */
    }
    return { ok: false, reply: 'Kein Vorschlag offen.' }
  }
  hit.status = 'rejected'
  await put('memory_proposals', hit)
  const more = (await pendingProposals()).length
  try {
    saveSettings({ proposal_pending: more > 0 })
  } catch {
    /* */
  }
  return { ok: true, reply: 'Vorschlag verworfen. Nichts im Haupthirn.' }
}

export async function dropProposal(id: string): Promise<void> {
  await del('memory_proposals', id)
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function proposalLine(row: MemoryProposal): string {
  const host = domainOf(row.url || '')
  return `Vorschlag: ${row.text}${host ? ` Quelle: ${host}.` : '.'} Merken?`
}

export async function offerPendingLine(): Promise<string> {
  const rows = await pendingProposals()
  return rows[0] ? ` ${proposalLine(rows[0])}` : ''
}

export function loadProposalFlag(): boolean {
  return Boolean(loadSettings().proposal_pending)
}
