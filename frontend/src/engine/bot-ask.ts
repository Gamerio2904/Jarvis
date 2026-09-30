import { EXECUTOR_IDS } from './agents/executor-ids.ts'
import { AGENT_META } from './agents/meta.ts'
import { normalizeUtterance } from './utterance.ts'
import { isAutoResearchAsk, isKnowledgeGap, researchQuery } from './research-parse.ts'
import { loadSettings, newId, saveSettings } from './store.ts'

/** Ein Bot bittet, einen anderen dazuzuholen. Ohne Ja läuft der andere nicht. */
export type BotAsk = {
  id: string
  from: string
  agent: string
  task: string
  why: string
  ablauf_id: string
  after_wave: number
}

const KNOWN = new Set<string>(EXECUTOR_IDS)

export function guestLabel(id: string): string {
  if (id === 'research') return 'Recherche'
  return AGENT_META[id]?.label || id
}

export function readBotAsk(): BotAsk | null {
  const raw = loadSettings().bot_ask_json
  if (!raw) return null
  try {
    const row = JSON.parse(raw) as BotAsk
    if (!row || row.agent !== 'research' && !KNOWN.has(row.agent)) return null
    if (!row.task || row.task.length < 3 || !row.from) return null
    return row
  } catch {
    return null
  }
}

function writeAsk(ask: BotAsk | null): void {
  saveSettings({ bot_ask_json: ask ? JSON.stringify(ask) : '' })
}

export function clearBotAsk(): void {
  writeAsk(null)
}

/** Eine Bitte zur Zeit. Unbekannte Ids und der eigene Bot zählen nicht. */
export function fileBotAsk(input: {
  from: string
  agent: string
  task: string
  why: string
  ablaufId?: string
  afterWave?: number
}): BotAsk | null {
  if (readBotAsk()) return null
  const agent = input.agent.trim()
  const task = input.task.replace(/\s+/g, ' ').trim().slice(0, 160)
  const from = input.from.trim()
  if (!from || !task || task.length < 3 || agent === from) return null
  if (agent !== 'research' && !KNOWN.has(agent)) return null
  const ask: BotAsk = {
    id: newId(),
    from,
    agent,
    task,
    why: input.why.replace(/\s+/g, ' ').trim().slice(0, 80) || guestLabel(agent),
    ablauf_id: input.ablaufId || '',
    after_wave: input.afterWave || 0,
  }
  writeAsk(ask)
  return ask
}

/**
 * Nach einem Lauf: konkreter anderer Bot, wenn der Satz den schon versteht.
 * Sonst Recherche, wenn die Zeile leer bleibt und die Frage ins Netz gehört.
 */
export function offerForResult(input: {
  from: string
  task: string
  reply: string
  empty: boolean
  taken: string[]
  routed: string | null
}): { agent: string; task: string; why: string } | null {
  const taken = new Set(input.taken)
  const gap = input.empty || isKnowledgeGap(input.reply)
  if (!gap) return null
  const routed = input.routed
  if (routed && routed !== input.from && !taken.has(routed) && (routed === 'research' || KNOWN.has(routed))) {
    if (routed === 'research') {
      const q = researchQuery(input.task).slice(0, 140)
      if (q.length < 3) return null
      return { agent: 'research', task: `Suche im Internet nach ${q}`, why: 'Internet-Recherche' }
    }
    return { agent: routed, task: input.task.slice(0, 160), why: guestLabel(routed) }
  }
  if (input.from === 'research' || taken.has('research')) return null
  if (!isAutoResearchAsk(input.task)) return null
  const q = researchQuery(input.task).slice(0, 140)
  if (q.length < 3) return null
  return { agent: 'research', task: `Suche im Internet nach ${q}`, why: 'Internet-Recherche' }
}

export function formatAsk(ask: BotAsk): string {
  return `${guestLabel(ask.from)} fragt: Darf ${guestLabel(ask.agent)} dazukommen? ${ask.task} Sag Ja oder Nein.`
}

/** Ja nur, solange eine Bitte offen ist. Ein Merk-Vorschlag behält Ja und Nein. */
export function parseBotAskIntent(text: string): { kind: 'accept' | 'decline' } | null {
  if (!readBotAsk()) return null
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  if (loadSettings().proposal_pending) {
    if (/^(?:dazuholen|hol(?:e)?\s+(?:ihn|sie|den\s+bot)\s+dazu)$/i.test(t)) return { kind: 'accept' }
    if (/^nicht\s+dazuholen$/i.test(t)) return { kind: 'decline' }
    return null
  }
  if (/^(?:ja(?:\s+bitte)?|dazuholen|hol(?:e)?\s+(?:ihn|sie|den\s+bot)\s+dazu)$/i.test(t)) return { kind: 'accept' }
  if (/^(?:nein|nicht\s+dazuholen)$/i.test(t)) return { kind: 'decline' }
  return null
}
