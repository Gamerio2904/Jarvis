import { AGENT_META } from './agents/meta.ts'
import { EXECUTOR_IDS } from './agents/executor-ids.ts'
import { parseAblaufIntent } from './ablauf-parse.ts'
import { ablaufWaiting } from './ablauf-state.ts'
import { clearBotAsk, fileBotAsk, formatAsk, guestLabel, offerForResult, parseBotAskIntent, readBotAsk } from './bot-ask.ts'
import { pickRoute } from './route-pick.ts'
import { formatResearchReply, researchHasSources } from './research-parse.ts'
import { completeGemini, geminiReady } from './gemini.ts'
import { completeGroq, groqReady } from './groq.ts'
import { get, getAll, listIdeas, listMessages, loadSettings, newId, put, saveSettings } from './store.ts'
import type { ToolMeta } from './tools.ts'

export type AblaufCardState = 'vorgeschlagen' | 'geändert' | 'läuft' | 'fertig' | 'leer'

export type AblaufCard = {
  n: number
  agent: string
  task: string
  state: AblaufCardState
  result?: string
  was?: string
}

export type AblaufWave = { n: number; cards: AblaufCard[] }

export type AblaufStatus = 'schreibt' | 'warten' | 'überarbeitet' | 'läuft' | 'fragt' | 'zu' | 'fertig' | 'leer'

export type Ablauf = {
  id: string
  title: string
  work: string[]
  waves: AblaufWave[]
  gray: AblaufCard[]
  status: AblaufStatus
  idea_id?: string | null
  created_at: string
  updated_at: string
}

const KNOWN = new Set<string>(EXECUTOR_IDS)
const FILL_SYSTEM = `Du schreibst einen Ablauf auf Deutsch.
Antwort NUR als JSON-Objekt {"work":[],"waves":[{"cards":[{"agent":"","task":""}]}]}.
agent ist eine vorhandene Executor-Id. task ist ein Satz, den dieser Agent schon versteht.
Höchstens 6 Arbeitszeilen, 8 Karten, 3 Wellen.
Abhängige Schritte in eine spätere Welle.
Keine neue Id, keine App-Version, kein Dateipfad, keine erfundenen Fakten.
Enthält eine Karte bereits "und plane Sprints", keine zweite Karte agent "idea" für dieselbe Füllung.
Kein konkreter Auftrag: {"work":[],"waves":[]}.`

let skipLaterWaves = false

function nowIso(): string {
  return new Date().toISOString()
}

function pack(reply: string, action: string): { handled: true; reply: string; tool: ToolMeta } {
  return {
    handled: true,
    reply,
    tool: { tool_status: 'executed', tool: 'idea', action, label: 'Ablauf' },
  }
}

export function agentLabel(id: string): string {
  return AGENT_META[id]?.label || id
}

export async function listPlans(): Promise<Ablauf[]> {
  const rows = await getAll<Ablauf>('plans')
  return rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

export async function readPlan(id: string): Promise<Ablauf | undefined> {
  if (!id) return undefined
  return get<Ablauf>('plans', id)
}

async function savePlan(row: Ablauf): Promise<void> {
  row.updated_at = nowIso()
  await put('plans', row)
  const open = loadSettings().ablauf_id === row.id
  if (open) saveSettings({ ablauf_status: row.status })
}

function pointAt(row: Ablauf | null): void {
  if (!row) {
    saveSettings({ ablauf_id: '', ablauf_status: '' })
    return
  }
  saveSettings({
    ablauf_id: row.id,
    ablauf_status: row.status,
    tischplatte_on: row.status === 'zu' || row.status === 'fertig' ? loadSettings().tischplatte_on : true,
  })
}

export function formatAblauf(plan: Ablauf, tail?: string): string {
  const lines = ['Ablauf.']
  for (const wave of plan.waves) {
    lines.push(wave.n === 1 ? 'Gleichzeitig' : 'Danach')
    for (const card of wave.cards) lines.push(`${card.n}. ${guestLabel(card.agent)}: ${card.task}`)
  }
  for (const card of plan.gray) lines.push(`${card.agent}: ${card.task}`)
  if (tail) lines.push(tail)
  lines.push('Sag So, oder was anders sein soll.')
  return lines.join('\n')
}

export function formatRun(plan: Ablauf): string {
  const lines: string[] = []
  for (const wave of plan.waves) {
    for (const card of wave.cards) {
      lines.push(`${guestLabel(card.agent)}: ${card.result || 'Noch leer.'}`)
    }
  }
  return lines.join('\n')
}

function clip(raw: string, max: number): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, max)
}

export function draftFromModel(raw: unknown, title: string): Ablauf | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const work = Array.isArray(o.work)
    ? o.work.map((x) => clip(String(x || ''), 80)).filter((x) => x.length >= 3).slice(0, 6)
    : []
  const wavesIn = Array.isArray(o.waves) ? o.waves.slice(0, 3) : []
  const cards: Array<{ agent: string; task: string; known: boolean }> = []
  for (const wave of wavesIn) {
    if (!wave || typeof wave !== 'object') continue
    const list = (wave as { cards?: unknown }).cards
    if (!Array.isArray(list)) continue
    for (const item of list) {
      if (cards.length >= 8) break
      if (!item || typeof item !== 'object') continue
      const agent = clip(String((item as { agent?: unknown }).agent || ''), 40)
      const task = clip(String((item as { task?: unknown }).task || ''), 160)
      if (!agent || task.length < 3) continue
      cards.push({ agent, task, known: KNOWN.has(agent) })
    }
  }
  const hasPlanFill = cards.some((c) => c.known && /und\s+plane\s+sprints/i.test(c.task))
  const kept = cards.filter((c) => {
    if (!hasPlanFill || c.agent !== 'idea') return true
    return !/füll|fuell|sprintplan|kern|härten|haerten|probe/i.test(c.task)
  })
  const known = kept.filter((c) => c.known)
  if (!known.length) return null
  let n = 0
  const waves: AblaufWave[] = []
  let cursor = 0
  for (const wave of wavesIn) {
    if (waves.length >= 3) break
    if (!wave || typeof wave !== 'object') continue
    const list = (wave as { cards?: unknown }).cards
    if (!Array.isArray(list)) continue
    const row: AblaufCard[] = []
    for (const item of list) {
      if (!item || typeof item !== 'object') continue
      const agent = clip(String((item as { agent?: unknown }).agent || ''), 40)
      const task = clip(String((item as { task?: unknown }).task || ''), 160)
      const hit = kept.find((c) => c.agent === agent && c.task === task && c.known)
      if (!hit) continue
      kept.splice(kept.indexOf(hit), 1)
      n += 1
      row.push({ n, agent, task, state: 'vorgeschlagen' })
      cursor += 1
      if (cursor >= 8) break
    }
    if (row.length) waves.push({ n: waves.length + 1, cards: row })
  }
  if (!waves.length) return null
  const gray: AblaufCard[] = []
  for (const wave of wavesIn) {
    if (!wave || typeof wave !== 'object') continue
    const list = (wave as { cards?: unknown }).cards
    if (!Array.isArray(list)) continue
    for (const item of list) {
      if (!item || typeof item !== 'object') continue
      const agent = clip(String((item as { agent?: unknown }).agent || ''), 40)
      const task = clip(String((item as { task?: unknown }).task || ''), 160)
      if (!agent || task.length < 3 || KNOWN.has(agent)) continue
      if (gray.length + waves.reduce((s, w) => s + w.cards.length, 0) >= 8) break
      gray.push({ n: 0, agent, task, state: 'vorgeschlagen' })
    }
  }
  const stamp = nowIso()
  return {
    id: newId(),
    title: clip(title, 80) || 'Ablauf',
    work,
    waves,
    gray,
    status: 'warten',
    created_at: stamp,
    updated_at: stamp,
  }
}

function extractJson(text: string): unknown {
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)
  const raw = fence ? fence[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1)) as unknown
  } catch {
    return null
  }
}

async function fillFromModel(work: string): Promise<Ablauf | null> {
  if (!groqReady() && !geminiReady()) return null
  const ideas = await listIdeas('open')
  const idea = ideas[0]
  const lines = (idea?.plan?.sprints || []).map((s) => `${s.n} ${s.ziel || s.title}`).filter(Boolean)
  const messages = [
    { role: 'system', content: FILL_SYSTEM },
    {
      role: 'user',
      content: `Text: ${work}\nOffene Idee: ${idea?.title || 'keine'}\nSprintzeilen: ${lines.join('; ') || 'keine'}`,
    },
  ]
  const runs: Array<() => Promise<string>> = []
  if (groqReady()) runs.push(() => completeGroq(messages))
  if (geminiReady()) {
    runs.push(async () => (await completeGemini(messages, undefined, { thinking: false, maxOutputTokens: 700, timeoutMs: 20_000 })).text)
  }
  for (const run of runs) {
    try {
      const text = await run()
      const draft = draftFromModel(extractJson(text), work)
      if (draft) {
        draft.idea_id = idea?.id || null
        return draft
      }
    } catch {
      /* nächster Slot */
    }
  }
  return null
}

/** Ohne Modell bleibt die Zeile ein Satz, den der Agent schon versteht. Eine nackte Uhrzeit wird in den bisherigen Satz gesetzt. */
export function rewriteOffline(agent: string, previous: string, instruction: string): string | null {
  const next = clip(instruction, 160)
  if (!next) return null
  const clockOnly = /^(?:um\s+|auf\s+)?\d{1,2}[:.]\d{2}(?:\s*uhr)?$/i.test(next)
  if (clockOnly && previous) {
    const hit = /\b\d{1,2}(?:[:.]\d{2})?(?:\s*uhr)?\b/i.exec(previous)
    if (hit) {
      const clock = next.replace(/^(?:um\s+|auf\s+)/i, '').replace(/\s*uhr$/i, '')
      const swapped = previous.replace(hit[0], /\buhr\b/i.test(hit[0]) ? `${clock} Uhr` : clock)
      if (swapped !== previous) return clip(swapped, 160)
    }
  }
  if (agent === 'alarm' && !/\bwecker\b|\bweck(?:e)?\s+mich\b/i.test(next)) {
    const body = /^(?:um|auf)\b/i.test(next) ? next : `um ${next}`
    return clip(`Wecker ${body}`, 160)
  }
  return next.length >= 3 ? next : null
}

async function rewriteTask(instruction: string, agent: string, previous: string): Promise<string | null> {
  const fallback = () => rewriteOffline(agent, previous, instruction)
  if (!groqReady() && !geminiReady()) return fallback()
  const messages = [
    {
      role: 'system',
      content: 'Antworte NUR als JSON {"task":"..."}. Ein Satz auf Deutsch, den der genannte Agent schon versteht. Keine neue Id, kein Dateipfad.',
    },
    { role: 'user', content: `Karte ${agentLabel(agent)}. Bisher: ${previous}. Änderung: ${instruction}` },
  ]
  const runs: Array<() => Promise<string>> = []
  if (groqReady()) runs.push(() => completeGroq(messages))
  if (geminiReady()) {
    runs.push(async () => (await completeGemini(messages, undefined, { thinking: false, maxOutputTokens: 200, timeoutMs: 15_000 })).text)
  }
  for (const run of runs) {
    try {
      const parsed = extractJson(await run()) as { task?: unknown } | null
      const task = clip(String(parsed?.task || ''), 160)
      if (task.length >= 3) return task
    } catch {
      /* nächster Slot */
    }
  }
  return fallback()
}

function allCards(plan: Ablauf): AblaufCard[] {
  return plan.waves.flatMap((w) => w.cards)
}

function findCard(plan: Ablauf, name: string, text: string): AblaufCard | null {
  const cards = allCards(plan)
  const q = name.trim().toLowerCase()
  if (q) {
    const hit = cards.find((c) => {
      const label = agentLabel(c.agent).toLowerCase()
      return c.agent.toLowerCase() === q || label === q || (q.length > label.length && q.includes(label))
    })
    if (hit) return hit
  }
  const blob = `${name} ${text}`.toLowerCase()
  const mentioned = cards.filter((c) => blob.includes(agentLabel(c.agent).toLowerCase()) || blob.includes(c.agent.toLowerCase()))
  if (mentioned.length === 1) return mentioned[0]
  return null
}

function namesOf(plan: Ablauf): string {
  return allCards(plan).map((c) => agentLabel(c.agent)).join(', ')
}

async function openWork(conversationId: string, work: string | undefined): Promise<{ handled: true; reply: string; tool: ToolMeta }> {
  let text = (work || '').trim()
  if (!text) {
    const msgs = await listMessages(conversationId)
    const users = msgs.filter((m) => m.role === 'user')
    const prev = users.length >= 2 ? users[users.length - 2] : undefined
    text = (prev?.content || '').trim().slice(0, 2000)
  }
  if (!text) return pack('Was soll geplant werden?', 'ablauf_ask')
  const currentId = loadSettings().ablauf_id
  if (loadSettings().ablauf_status === 'läuft') return pack('Der Ablauf läuft.', 'ablauf_busy')
  const draft = await fillFromModel(text)
  if (!draft) {
    const noModel = !groqReady() && !geminiReady()
    if (!noModel && !ablaufWaiting()) saveSettings({ ablauf_status: 'leer', ablauf_id: '', tischplatte_on: true })
    return pack(
      noModel ? 'Plan nicht übernommen.' : 'Kein Ablauf. Der Text nennt keine konkrete Arbeit.',
      noModel ? 'ablauf_fail' : 'ablauf_empty',
    )
  }
  if (currentId && currentId !== draft.id) {
    const prev = await readPlan(currentId)
    if (prev && ablaufWaiting(prev.status)) {
      prev.status = 'zu'
      await savePlan(prev)
    }
  }
  draft.status = 'warten'
  await savePlan(draft)
  saveSettings({ ablauf_id: draft.id, ablauf_status: 'warten', ablauf_list_id: '', tischplatte_on: true })
  return pack(formatAblauf(draft), 'ablauf')
}

function takenAgents(plan: Ablauf): string[] {
  return allCards(plan).map((c) => c.agent)
}

async function settleCard(card: AblaufCard, conversationId: string): Promise<void> {
  const { runAgent } = await import('./agents/runner.ts')
  try {
    const result = await runAgent(card.agent, {
      conversationId,
      text: card.task,
      lastTool: '',
      lastMedium: '',
      inDrive: false,
    })
    const reply = (result.reply || '').replace(/\s+/g, ' ').trim()
    if (!result.handled || result.failed || result.aborted || !reply) {
      card.state = 'leer'
      card.result = 'Noch leer.'
    } else {
      card.state = 'fertig'
      card.result = reply.slice(0, 240)
    }
  } catch {
    card.state = 'leer'
    card.result = 'Noch leer.'
  }
}

async function runResearchGuest(task: string): Promise<{ ok: boolean; reply: string }> {
  try {
    const { fillResearchLinks } = await import('./web-search.ts')
    const filled = await fillResearchLinks(task, '')
    if (!researchHasSources(filled)) return { ok: false, reply: 'Netz hat nicht geantwortet.' }
    const reply = formatResearchReply(task, filled.sources || [], false, false).replace(/\s+/g, ' ').trim()
    return { ok: true, reply: reply.slice(0, 240) }
  } catch {
    return { ok: false, reply: 'Netz hat nicht geantwortet.' }
  }
}

async function runGuest(agent: string, task: string, conversationId: string): Promise<{ ok: boolean; reply: string }> {
  if (agent === 'research') return runResearchGuest(task)
  const card: AblaufCard = { n: 0, agent, task, state: 'vorgeschlagen' }
  await settleCard(card, conversationId)
  return { ok: card.state === 'fertig', reply: card.result || 'Noch leer.' }
}

function rememberGuest(plan: Ablauf, agent: string, task: string, ok: boolean, reply: string): void {
  const count = allCards(plan).length
  if (count >= 8) return
  const wave = plan.waves[plan.waves.length - 1]
  if (!wave || wave.cards.length >= 6) return
  const n = count + 1
  wave.cards.push({ n, agent, task, state: ok ? 'fertig' : 'leer', result: reply })
}

/** Spätere Wellen warten, sobald ein Bot einen anderen dazuholen will. */
async function runFrom(plan: Ablauf, conversationId: string, startAfter: number): Promise<void> {
  skipLaterWaves = false
  plan.status = 'läuft'
  await savePlan(plan)
  pointAt(plan)
  for (const wave of plan.waves) {
    if (wave.n <= startAfter) continue
    const pending = wave.cards.filter((c) => c.state === 'vorgeschlagen')
    if (!pending.length) continue
    for (const card of pending) card.state = 'läuft'
    await savePlan(plan)
    await Promise.all(pending.map((card) => settleCard(card, conversationId)))
    await savePlan(plan)
    if (skipLaterWaves) break
    const taken = takenAgents(plan)
    for (const card of pending) {
      const offer = offerForResult({
        from: card.agent,
        task: card.task,
        reply: card.result || '',
        empty: card.state === 'leer',
        taken,
        routed: pickRoute(card.task),
      })
      if (!offer) continue
      const ask = fileBotAsk({
        from: card.agent,
        agent: offer.agent,
        task: offer.task,
        why: offer.why,
        ablaufId: plan.id,
        afterWave: wave.n,
      })
      if (!ask) continue
      plan.status = 'fragt'
      await savePlan(plan)
      pointAt(plan)
      return
    }
  }
  if (readBotAsk()?.ablauf_id === plan.id) return
  plan.status = skipLaterWaves ? 'zu' : 'fertig'
  await savePlan(plan)
  saveSettings({
    ablauf_id: plan.id,
    ablauf_status: plan.status,
    ablauf_list_id: plan.status === 'fertig' ? plan.id : '',
  })
}

async function finishAsk(conversationId: string, accepted: boolean): Promise<{ handled: true; reply: string; tool: ToolMeta }> {
  const ask = readBotAsk()
  if (!ask) return pack('Es ist keine Bitte offen.', 'bot_ask_none')
  clearBotAsk()
  const plan = ask.ablauf_id ? await readPlan(ask.ablauf_id) : undefined
  let line = `${guestLabel(ask.agent)} bleibt draußen.`
  if (accepted) {
    const guest = await runGuest(ask.agent, ask.task, conversationId)
    line = `${guestLabel(ask.agent)}: ${guest.reply}`
    if (plan) rememberGuest(plan, ask.agent, ask.task, guest.ok, guest.reply)
  }
  if (plan && plan.status === 'fragt') {
    await runFrom(plan, conversationId, ask.after_wave)
  } else if (plan) {
    await savePlan(plan)
  }
  const done = plan ? (await readPlan(plan.id)) || plan : null
  const again = readBotAsk()
  const reply = done ? `${formatRun(done)}\n${again ? formatAsk(again) : line}` : line
  return pack(reply, accepted ? 'bot_ask_yes' : 'bot_ask_no')
}

export function requestAblaufStop(): void {
  skipLaterWaves = true
}

export async function handleAblauf(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta }> {
  const asked = parseBotAskIntent(text)
  if (asked) return finishAsk(conversationId, asked.kind === 'accept')

  const intent = parseAblaufIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'open') return openWork(conversationId, intent.work)

  const current = await readPlan(loadSettings().ablauf_id)
  if (intent.kind === 'close') {
    if (!current || current.status === 'zu' || current.status === 'fertig') {
      if (loadSettings().ablauf_status === 'leer') {
        saveSettings({ ablauf_status: '', ablauf_id: '' })
        return pack('Ablauf zu.', 'ablauf_close')
      }
      return pack('Es ist kein Ablauf offen.', 'ablauf_none')
    }
    if (current.status === 'läuft') {
      requestAblaufStop()
      return pack('Ablauf zu.', 'ablauf_close')
    }
    clearBotAsk()
    current.status = 'zu'
    await savePlan(current)
    pointAt(current)
    return pack('Ablauf zu.', 'ablauf_close')
  }

  if (!current || !ablaufWaiting(current.status)) return pack('Es ist kein Ablauf offen.', 'ablauf_none')

  if (intent.kind === 'accept') {
    await runFrom(current, conversationId, 0)
    const done = (await readPlan(current.id)) || current
    const ask = readBotAsk()
    const reply = ask && ask.ablauf_id === done.id ? `${formatRun(done)}\n${formatAsk(ask)}` : formatRun(done)
    return pack(reply, ask ? 'bot_ask' : 'ablauf_run')
  }

  const card = findCard(current, intent.name, intent.text)
  if (!card) return pack(`Die Zeile gibt es nicht. ${namesOf(current)}`, 'ablauf_miss')
  const nextTask = await rewriteTask(intent.text, card.agent, card.task)
  if (!nextTask) return pack('Plan nicht übernommen.', 'ablauf_fail')
  card.was = card.task
  card.task = nextTask
  card.state = 'geändert'
  current.status = 'warten'
  await savePlan(current)
  pointAt(current)
  return pack(formatAblauf(current, `geändert: ${agentLabel(card.agent)}.`), 'ablauf_edit')
}
