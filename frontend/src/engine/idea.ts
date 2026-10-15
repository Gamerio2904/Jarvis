import {
  addIdea,
  addReminder,
  clearPending,
  getPending,
  listIdeas,
  loadSettings,
  newId,
  persistLastList,
  putIdea,
  readLastList,
  saveSettings,
  setPending,
  type Idea,
} from './store.ts'
import { handleAblauf, startPlanCards } from './ablauf.ts'
import { ablaufWaiting } from './ablauf-state.ts'
import { parseAblaufIntent, type AblaufIntent } from './ablauf-parse.ts'
import { commitPortfolio, currentIdeaForTable, handlePortfolio, listPortfolio } from './portfolio.ts'
import { artLabel } from './entwurf-muster.ts'
import { cannedPlanLine, cannedRosterLine, sparQuestion } from './plan-desk.ts'
import { parseBoardIntent } from './board-parse.ts'
import { fallbackFromWork } from './entwurf-fill.ts'
import { parsePortfolioIntent } from './portfolio-parse.ts'
import { parseIdeaIntent } from './idea-parse.ts'
import { closeDraftRow } from './entwurf.ts'
import {
  blankSprint,
  emptyPlan,
  findSprint,
  formatPlan,
  nextSprintN,
  parsePlan,
  planHasBody,
  savePlanRevision,
  validatePlan,
  PLAN_BEDINGUNG,
  PLAN_RAHMEN,
  WEG_ANLEITUNG,
  type IdeaPlan,
} from './idea-plan.ts'
import { isTooShortPlanAnswer, parsePlanQuestion, serializePlanQuestion } from './idea-question.ts'
import { parseBoardJobs, serializeBoardJobs, stopJobs } from './board-jobs.ts'
import { completeBrainWithFallback } from './brain.ts'
import { pendingYields } from './pending-yield.ts'
import type { ToolMeta } from './tools.ts'

const FILL_SYSTEM = `${PLAN_BEDINGUNG}
Rahmen: ${PLAN_RAHMEN.join(' ')}
Antwort NUR als JSON-Objekt mit bedingung, anforderungen [{id, satz, abnahme, gateway}], entscheidungen [{id, schnitt, grund, gateway}], sprints [{n, title, ziel, anforderungen, lieferumfang:[{id, task, anleitung}], prompt, gateway, go_wenn, nogo_wenn, abbruch, haengt_an}], luecken [{id, name, satz}], gateway, go_wenn, nogo_wenn.
n ist 1, 2, 3, … ohne Lücke und ohne Obergrenze. title nennst du. Eine Hülle, kein zweites Muster.
gateway go nur mit Anforderung, go_wenn und abbruch. Sonst offen.
Jeder Sprint hat genau ein Feld prompt. Das ist eine Anleitung, die ein Mensch einem Programmier-Agenten gibt, damit der diesen einen Sprint umsetzt. Ein Absatz, höchstens 480 Zeichen. Er nennt das Ziel, die Arbeiten aus dem Lieferumfang, den Abbruch und was nicht gebaut wird. Kein Quelltext, keine Versionsnummer, keine Datei, die der Lieferumfang nicht nennt. Ohne Arbeit bleibt prompt leer.
Keine RICE, keine App-Version, keine Titel Kern, Härten oder Probe, keine erfundenen Quellen.`

function pack(
  reply: string,
  action: string,
  preview?: string,
): { handled: true; reply: string; tool: ToolMeta } {
  return {
    handled: true,
    reply,
    tool: { tool_status: 'executed', tool: 'idea', action, label: 'Idee', preview },
  }
}

function titlesOf(rows: Idea[]): string[] {
  return rows.map((r) => r.title)
}

export function pickIdea(rows: Idea[], query?: string, index?: number): Idea | undefined {
  if (index && index >= 1) {
    const listed = readLastList('idea')
    const title = listed[index - 1]
    if (title) {
      const hit = rows.find((r) => r.title === title)
      if (hit) return hit
    }
    return rows[index - 1]
  }
  const q = (query || '').trim().toLowerCase()
  if (!q) {
    const last = loadSettings().last_step_title || ''
    return rows.find((r) => r.title === last) || rows[0]
  }
  return rows.find((r) => r.title.toLowerCase() === q || r.title.toLowerCase().includes(q))
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

export async function fillPlanWithModel(idea: Idea): Promise<IdeaPlan> {
  const skeleton = emptyPlan(idea.id, idea.body || idea.title)
  const messages = [
    { role: 'system', content: FILL_SYSTEM },
    {
      role: 'user',
      content: `Bedingung: ${skeleton.bedingung}\nRahmen: ${skeleton.rahmen.join(' | ')}\nHülle: ${JSON.stringify(blankSprint('1'))}`,
    },
  ]
  const result = await completeBrainWithFallback(messages, undefined, { maxOutputTokens: 2200, timeoutMs: 25_000 })
  const raw = extractJson(result.text)
  if (!raw) throw new Error('Die Planungs-KI hat kein lesbares JSON geliefert. Der vorhandene Plan bleibt unverändert.')
  const plan = parsePlan(raw, idea.id)
  if (!plan) throw new Error('Der erzeugte Plan ist unvollständig oder widersprüchlich. Der vorhandene Plan bleibt unverändert.')
  if (!planHasBody(plan)) throw new Error('Die Planungs-KI hat keinen konkreten Sprintinhalt geliefert. Der vorhandene Plan bleibt unverändert.')
  plan.ideaId = idea.id
  plan.bedingung = idea.plan?.bedingung || idea.body || idea.title
  plan.evidence = [...(idea.plan?.evidence || []), ...(plan.evidence || [])]
  return plan
}

export function askPlanQuestion(idea: Idea, conversationId: string): string | null {
  const plan = idea.plan
  const need = plan?.anforderungen.find((row) => row.satz.trim() && !row.abnahme.trim())
  if (!plan || !need || !conversationId) return null
  const question = {
    id: newId(),
    ideaId: idea.id,
    conversationId,
    requirementId: need.id,
    question: `Woran erkennst du konkret, dass „${need.satz}“ erfüllt ist?`,
    createdAt: Date.now(),
  }
  saveSettings({ plan_question_json: serializePlanQuestion(question) })
  return question.question
}

function fillFromClauses(plan: IdeaPlan, parts: string[], title: string) {
  const body = parts.filter((part) => part.toLowerCase() !== title.toLowerCase())
  const ziel = (body.join('. ') || parts.join('. ') || title).slice(0, 220)
  const first = blankSprint('1', title.slice(0, 48), ziel)
  const tasks = parts.length ? parts : [title]
  plan.anforderungen = tasks.map((satz, i) => ({
    id: `A${i + 1}`,
    satz,
    abnahme: '',
    gateway: 'offen',
  }))
  first.anforderungen = plan.anforderungen.map((need) => need.id)
  first.lieferumfang = tasks.map((task, i) => ({
    id: `S1-${i + 1}`,
    task: task.slice(0, 160),
    anleitung: WEG_ANLEITUNG,
  }))
  plan.sprints = [first]
}

/** Komma trennt Aufträge. „ein und Ausgaben“ bleibt ein Satz. */
function clausesOf(work: string): string[] {
  return work
    .split(/[,;]/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 3 && !/^plane\s+(?:mir\s+)?(?:eine\s+)?app$/i.test(s))
    .slice(0, 6)
}

function planTitle(work: string): string {
  const text = work.replace(/\s+/g, ' ').trim()
  if (/ein-?\s*und\s+ausgaben|einnahmen\s+und\s+ausgaben/i.test(text)) return 'Ein- und Ausgaben'
  const head = (text.split(/[,;]/)[0] || text).replace(/\s+/g, ' ').trim()
  if (/\bhaushaltsbuch\b/i.test(head)) return 'Haushaltsbuch'
  const stripped = head
    .replace(/^(?:ich\s+(?:möchte|moechte|will)|lass(?:\s+uns)?|wir\s+wollen)\s+(?:bitte\s+)?(?:mal\s+)?(?:zusammen\s+)?/i, '')
    .replace(/^(?:plane|plan)\s+(?:mir\s+)?(?:bitte\s+)?(?:mal\s+)?/i, '')
    .replace(/^(?:eine\s+)?(?:neue\s+)?(?:app|anwendung)\s*(?::|(?:für|fuer))?\s*/i, '')
    .replace(/^(?:planen|entwickeln|bauen|entwerfen)\s*/i, '')
    .trim()
  return (stripped || head || text).slice(0, 72)
}

function genericAppTitle(title: string): boolean {
  return /^(?:eine neue app|neue app|eine app|app)$/i.test(title.trim())
}

function thinClause(part: string): boolean {
  const stripped = part
    .replace(/^(?:ich\s+(?:möchte|moechte|will)|lass(?:\s+uns)?|wir\s+wollen)\s+(?:bitte\s+)?(?:mal\s+)?(?:zusammen\s+)?/i, '')
    .replace(/^(?:plane|plan)\s+(?:mir\s+)?(?:bitte\s+)?(?:mal\s+)?/i, '')
    .replace(/^(?:eine\s+)?(?:neue\s+)?(?:app|anwendung)\s*(?::|(?:für|fuer))?\s*/i, '')
    .replace(/^(?:planen|entwickeln|bauen|entwerfen)\s*/i, '')
    .trim()
  return stripped.length < 3 || /^(?:eine neue app|neue app|eine app|app|anwendung)$/i.test(stripped)
}

function thinWork(work: string): boolean {
  const parts = clausesOf(work)
  return !parts.length || parts.every((part) => thinClause(part))
}

function sameLine(value: string): string {
  return value.replace(/[.?!,;:]+$/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function planIsTitleClone(plan: IdeaPlan, title: string): boolean {
  if (!thinClause(title) && !thinWork(title)) return false
  const lines = [
    ...plan.anforderungen.filter((row) => !row.id.startsWith('O')).map((row) => row.satz),
    ...plan.sprints.flatMap((sprint) => [sprint.title, sprint.ziel, ...sprint.lieferumfang.map((task) => task.task)]),
  ]
  return lines.every((line) => !line.trim() || thinClause(line) || sameLine(line) === sameLine(title))
}

function armSpar(plan: IdeaPlan, title: string, fresh: boolean): void {
  if (!planIsTitleClone(plan, title)) {
    saveSettings({ plan_spar_step: '' })
    return
  }
  const current = loadSettings().plan_spar_step
  saveSettings({ plan_spar_step: fresh || !current ? 'goal' : current })
}

function ownsPlan(conversationId: string): boolean {
  const owner = loadSettings().plan_conversation_id
  return !owner || owner === conversationId
}

function clearShownPlan(): string {
  const phase = loadSettings().plan_phase
  const jobs = stopJobs(parseBoardJobs(loadSettings().board_jobs_json))
  saveSettings({
    plan_phase: '',
    plan_conversation_id: '',
    plan_script_at: 0,
    plan_idea_id: '',
    plan_spar_step: '',
    workbench_open: false,
    board_jobs_json: serializeBoardJobs(jobs),
  })
  if (phase === 'live' || phase === 'go') return 'Der Plan ist von der Tischplatte weg.'
  return 'Es liegt kein Plan auf der Tischplatte.'
}

async function planOntoTable(intent: AblaufIntent, raw = '', conversationId = ''): Promise<string> {
  if (intent.kind === 'screen') return revealPlanningScreen()
  if (intent.kind === 'clear') return clearShownPlan()
  if (intent.kind === 'accept') {
    const phase = loadSettings().plan_phase
    const waiting = ablaufWaiting()
    const live = phase === 'live' && !waiting
    const already = phase === 'go' && !waiting
    const hit = live || already ? await ideaOnTable() : undefined
    if ((live || already) && hit) {
      const saved = await commitPortfolio(hit)
      saveSettings({
        tischplatte_on: true,
        ablauf_status: '',
        ablauf_id: '',
        bot_ask_json: '',
        plan_phase: 'go',
        portfolio_focus: '',
        portfolio_file: '',
      })
      if (saved.full) return 'Das Portfolio ist voll.'
      if (saved.folder === 'fail') return 'Im Haus gespeichert. Der Ordner fehlt.'
      if (saved.revived && saved.row) return `${saved.row.name} liegt wieder im Portfolio.`
      if (saved.created && saved.row) return `Fest. ${saved.row.name} liegt im Portfolio.`
      if (saved.row) return `${saved.row.name} liegt schon im Portfolio.`
    }
    saveSettings({
      tischplatte_on: true,
      ablauf_status: '',
      ablauf_id: '',
      bot_ask_json: '',
      ...(live || already ? { plan_phase: 'go' } : {}),
    })
    if (live) return 'Umgesetzt. Das Skript ist fest. Export ist bereit. Sag: Lade den PSP runter.'
    if (already) return 'Das Skript ist fest. Export ist bereit. Sag: Lade den PSP runter.'
    return 'Die Sprints liegen auf der Tischplatte. Sag: Lade den PSP runter.'
  }
  saveSettings({
    tischplatte_on: true,
    tischplatte_view: 'psp',
    workbench_open: true,
    ablauf_status: '',
    ablauf_id: '',
    bot_ask_json: '',
  })
  if (intent.kind === 'session') return openPlanningSession(intent.work, conversationId)
  if (intent.kind === 'open' && !intent.work) return 'Was soll geplant werden?'
  if (intent.kind === 'close') return closePlanningScreen(raw)
  if (intent.kind === 'revise') return reviseProject(intent.text)
  if (intent.kind === 'open' && intent.work) return writeProject(intent.work, conversationId)
  return 'Planen schreibt Sprints und PSP auf der Tischplatte.'
}

async function revealPlanningScreen(): Promise<string> {
  let hit = await ideaOnTable()
  if (!hit && !loadSettings().plan_idea_id) {
    const ideas = await listIdeas()
    hit = ideas.find((row) => row.status !== 'done') || ideas[0]
  }
  if (hit) {
    await showPlanning(hit)
    return 'Der Planungsbildschirm ist offen.'
  }
  saveSettings({
    plan_phase: 'live',
    plan_conversation_id: loadSettings().plan_conversation_id,
    plan_script_at: Date.now(),
    tischplatte_on: true,
    tischplatte_view: 'psp',
    workbench_open: true,
  })
  return 'Der Planungsbildschirm ist offen.'
}

async function closePlanningScreen(raw: string): Promise<string> {
  if (/^\s*fenster\s+zu\b/i.test(raw.trim())) await closeDraftRow()
  const settings = loadSettings()
  const phase = settings.plan_phase
  if (phase === 'go') {
    saveSettings({ tischplatte_on: true, workbench_open: false, plan_spar_step: '' })
    return 'Der Planungsbildschirm ist zu. Das Skript bleibt fest.'
  }
  if (phase === 'live' || settings.workbench_open) {
    saveSettings({ plan_phase: '', plan_conversation_id: '', plan_script_at: 0, plan_spar_step: '', tischplatte_on: true, workbench_open: false })
    return 'Der Planungsbildschirm ist zu. Der Plan bleibt.'
  }
  return 'Das Planfenster ist zu. Die Sprints bleiben auf der Tischplatte.'
}

async function namedProject(name: string): Promise<Idea | undefined> {
  const q = name.trim().toLowerCase()
  if (!q || q.includes(',') || /\sund\s/i.test(q)) return undefined
  const ideas = await listIdeas()
  const exact = ideas.find((row) => row.status !== 'done' && row.title.toLowerCase() === q)
  if (exact) return exact
  const rows = await listPortfolio()
  const card = rows.find((row) => !row.archived && (row.name.toLowerCase() === q || row.title.toLowerCase() === q))
  if (!card) return undefined
  return ideas.find((row) => row.id === card.idea_id && row.status !== 'done')
}

function addSurface(plan: IdeaPlan, source: string, refresh = false): void {
  const fill = fallbackFromWork(source)
  const blocks = fill?.variants[0]?.blocks || []
  if (!blocks.length) return
  if (!refresh && plan.anforderungen.some((row) => row.id.startsWith('O'))) return
  plan.anforderungen = plan.anforderungen.filter((row) => !row.id.startsWith('O'))
  blocks.forEach((block, i) => {
    const label = artLabel(block.art)
    const raw = block.zeile && block.zeile !== 'Noch leer.' ? block.zeile.trim() : ''
    const zeile = raw && raw.toLowerCase() !== label.toLowerCase() ? raw : ''
    plan.anforderungen.push({
      id: `O${i + 1}`,
      satz: zeile ? `${label}: ${zeile}` : label,
      abnahme: '',
      gateway: 'offen',
    })
  })
}

function dropCannedRoster(plan: IdeaPlan): void {
  plan.entscheidungen = plan.entscheidungen.filter((cut) => {
    const line = `${cut.schnitt}: ${cut.grund}`
    return !cannedRosterLine(cut.grund) && !cannedRosterLine(line)
  })
  plan.sprints = plan.sprints.filter((sprint) => !cannedPlanLine(sprint.ziel || '') && !cannedPlanLine(sprint.title || ''))
}

function keepOriginalIntake(plan: IdeaPlan, idea: Idea, original: string): void {
  const text = (plan.bedingung || original).replace(/\s+/g, ' ').trim()
  if (!text) return
  plan.bedingung = text
  plan.evidence = plan.evidence || []
  const id = `intake-${idea.id}`
  if (!plan.evidence.some((row) => row.id === id)) {
    plan.evidence.push({ id, kind: 'local', title: 'Ursprünglicher Projektwunsch', text })
  }
}

async function ensurePlanningDocs(idea: Idea, work: string): Promise<Idea> {
  const plan = idea.plan || emptyPlan(idea.id, work || idea.body || idea.title)
  const source = (work || plan.bedingung || idea.body || idea.title).trim()
  keepOriginalIntake(plan, idea, idea.body || source || idea.title)
  const parts = clausesOf(source)
  const sameLine = (value: string) => value.replace(/[.?!,;:]+$/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
  const fresh = parts.filter((satz) => sameLine(satz) !== sameLine(idea.title))
  if (!plan.anforderungen.length && fresh.length) {
    plan.anforderungen = fresh.map((satz, i) => ({
      id: `A${i + 1}`,
      satz,
      abnahme: '',
      gateway: 'offen' as const,
    }))
  } else {
    for (const satz of fresh) {
      if (plan.anforderungen.some((row) => sameLine(row.satz) === sameLine(satz))) continue
      const n = plan.anforderungen.filter((row) => row.id.startsWith('A')).length + 1
      plan.anforderungen.push({ id: `A${n}`, satz, abnahme: '', gateway: 'offen' })
    }
  }
  const thin = thinWork(source)
  if (!plan.sprints.length && !thin) fillFromClauses(plan, parts.length ? parts : [idea.title], planTitle(source || idea.title))
  if (thin && planIsTitleClone(plan, idea.title)) {
    plan.anforderungen = plan.anforderungen.filter((row) => row.id.startsWith('O') && !thinClause(row.satz))
    plan.sprints = []
  }
  dropCannedRoster(plan)
  if (!thin) addSurface(plan, source)
  const nextBody = source.trim().length > idea.title.trim().length ? source.trim() : idea.body || source
  const next = { ...idea, body: nextBody, plan }
  await putIdea(next)
  return next
}

function formatSession(plan: IdeaPlan, title: string, cardName = ''): string {
  const said = new Set<string>()
  const mark = (value: string) => {
    const key = value.replace(/\s+/g, ' ').trim().toLowerCase()
    if (!key || said.has(key)) return false
    said.add(key)
    return true
  }
  mark(title)
  const bits = [`Planungsbildschirm ist offen. ${title}.`]
  const needs = plan.anforderungen.filter((row) => !row.id.startsWith('O') && !cannedPlanLine(row.satz))
  const fresh = needs.filter((row) => mark(row.satz))
  if (fresh.length === 1) bits.push(`Auftrag: ${fresh[0].satz}.`)
  else if (fresh.length) bits.push(`Auftrag: ${fresh.map((row) => row.satz).join('. ')}.`)
  const sprint = plan.sprints.find((row) => {
    const line = (row.ziel || row.title || '').replace(/\s+/g, ' ').trim()
    return line && !cannedPlanLine(line) && mark(line)
  })
  if (sprint) bits.push(`Sprint: ${sprint.ziel || sprint.title}.`)
  const face = plan.anforderungen.filter((row) => row.id.startsWith('O') && mark(row.satz))
  if (face.length) bits.push(`Oberfläche: ${face.map((row) => row.satz).join(', ')}.`)
  if (cardName) bits.push(`Die Karte ${cardName} liegt im Portfolio.`)
  const step = loadSettings().plan_spar_step
  bits.push(step ? sparQuestion(step) : 'Sag Fertig, dann geht der Bildschirm zu.')
  return bits.join(' ')
}

async function showPlanning(idea: Idea, conversationId = ''): Promise<void> {
  saveSettings({
    plan_phase: 'live',
    plan_conversation_id: conversationId || loadSettings().plan_conversation_id,
    plan_script_at: Date.now(),
    plan_idea_id: idea.id,
    tischplatte_on: true,
    tischplatte_view: 'psp',
    workbench_open: true,
  })
}

async function openPlanningSession(work: string, conversationId = ''): Promise<string> {
  const text = work.replace(/\s+/g, ' ').trim()
  let hit = text ? (genericAppTitle(text) ? undefined : await namedProject(text)) : await ideaOnTable()
  if (!text && !hit) {
    const cards = (await listPortfolio()).filter((row) => !row.archived)
    if (cards.length > 1) return `Welches: ${cards.map((row) => row.name).join(', ')}.`
    if (cards.length === 1) {
      const ideas = await listIdeas()
      hit = ideas.find((row) => row.id === cards[0].idea_id && row.status !== 'done')
    }
  }
  if (!hit && !text) return 'Was soll geplant werden?'
  if (!hit && text) {
    await writeProject(text, conversationId)
    hit = await ideaOnTable()
  }
  if (!hit) return 'Was soll geplant werden?'
  const ready = await ensurePlanningDocs(hit, text || hit.body || hit.title)
  const saved = await commitPortfolio(ready)
  await showPlanning(ready, conversationId)
  armSpar(ready.plan || emptyPlan(ready.id), text || ready.title, !loadSettings().plan_spar_step)
  const cardName = saved.row && !saved.full ? saved.row.name : ''
  return formatSession(ready.plan || emptyPlan(ready.id), ready.title, cardName)
}

function talkWorth(text: string): boolean {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length < 8) return false
  if (/^(?:hallo|hi|hey|danke|ok(?:ay)?|ja|nein|stopp)\b/i.test(t) && t.split(/\s+/).length < 4) return false
  if (/^(?:abbrechen|abbruch|stopp|danke(?:\s+schön|\s+schoen)?|das war'?s|das wars)\b/i.test(t)) return false
  if (/\?\s*$/.test(t)) return false
  if (/^(?:was|wie|warum|wieso|wer|wo|wann|welche)\b/i.test(t) && !/\b(?:soll|muss|müssen|muessen|brauchen|will|möchte|moechte|bitte)\b/i.test(t)) return false
  return true
}

function deviceTalk(text: string): boolean {
  return /\b(?:tablet\s*modus|tabel\s*modus|talet\s*modus|tabletmodus|tabelmodus|taletmodus|tabletmodu|handy\s+koppeln|verbinde(?:\s+dich)?(?:\s+mit)?\s+(?:dem\s+|das\s+)?handy|server\s+(?:an|aus)|starte(?:\s+bitte)?(?:\s+mal)?\s+den\s+server|fernseher|yu-?gi-?oh|zeit\s+für\s+ein\s+duell)\b/i.test(text)
}

async function advanceSpar(hit: Idea, plan: IdeaPlan, line: string, step: string): Promise<string> {
  let next = step
  let reply = ''
  let current = hit
  if (step === 'goal') {
    plan.anforderungen = plan.anforderungen.filter((row) => row.id.startsWith('O'))
    plan.anforderungen.unshift({ id: 'A1', satz: line, abnahme: '', gateway: 'offen' })
    if (thinClause(current.title) || thinWork(current.title)) {
      current = { ...current, title: line.replace(/[.!?]+$/g, '').slice(0, 48) }
    }
    if (!plan.bedingung || thinWork(plan.bedingung)) plan.bedingung = line
    next = 'audience'
    reply = `Ziel festgehalten: ${line}. ${sparQuestion('audience')}`
  } else if (step === 'audience') {
    plan.entscheidungen = plan.entscheidungen.filter((cut) => cut.schnitt !== 'Zielgruppe')
    plan.entscheidungen.push({ id: 'E1', schnitt: 'Zielgruppe', grund: line, gateway: 'offen' })
    next = 'slice'
    reply = `Zielgruppe: ${line}. ${sparQuestion('slice')}`
  } else if (step === 'slice' || (step === 'build' && /n(?:ä|ae)chster\s+sprint|neuer\s+sprint/i.test(line))) {
    const rest = step === 'build'
      ? line.replace(/n(?:ä|ae)chster\s+sprint|neuer\s+sprint/ig, '').replace(/^[\s,:.\-]+/, '').trim()
      : line
    if (step === 'build' && rest.length < 3) {
      saveSettings({ plan_spar_step: 'slice' })
      await showPlanning(current)
      return sparQuestion('slice')
    }
    const slice = rest || line
    const n = plan.sprints.length ? nextSprintN(plan) : '1'
    const sprint = blankSprint(n, slice.slice(0, 48), slice.slice(0, 160))
    const need = plan.anforderungen.find((row) => row.id.startsWith('A'))
    sprint.anforderungen = need ? [need.id] : []
    sprint.lieferumfang = [{ id: `S${n}-1`, task: slice.slice(0, 120), anleitung: WEG_ANLEITUNG }]
    plan.sprints.push(sprint)
    next = 'done'
    reply = `Sprint ${n}: ${slice}. ${sparQuestion('done')}`
  } else if (step === 'done') {
    const sprint = plan.sprints[plan.sprints.length - 1]
    if (sprint) {
      sprint.go_wenn = line.slice(0, 180)
      const need = plan.anforderungen.find((row) => sprint.anforderungen.includes(row.id))
        || plan.anforderungen.find((row) => row.id.startsWith('A'))
      if (need) need.abnahme = line.slice(0, 180)
    }
    next = 'build'
    reply = `Sprint ${sprint?.n || '1'} ist nutzbar. Fertig, wenn: ${line}. ${sparQuestion('build')}`
  } else {
    const sprint = plan.sprints[plan.sprints.length - 1] || blankSprint('1', line.slice(0, 48), line.slice(0, 160))
    if (!plan.sprints.length) plan.sprints = [sprint]
    if (!sprint.lieferumfang.some((row) => sameLine(row.task) === sameLine(line))) {
      sprint.lieferumfang.push({
        id: `S${sprint.n}-${sprint.lieferumfang.length + 1}`,
        task: line.slice(0, 120),
        anleitung: WEG_ANLEITUNG,
      })
    }
    reply = `Im Sprint ${sprint.n}: ${line}. ${sparQuestion('build')}`
  }
  dropCannedRoster(plan)
  await putIdea({ ...current, plan })
  await showPlanning({ ...current, plan })
  saveSettings({ plan_spar_step: next, plan_idea_id: current.id })
  return reply
}

export async function sparPlan(text: string, conversationId = ''): Promise<string | null> {
  if (loadSettings().plan_phase !== 'live' || !talkWorth(text)) return null
  if (conversationId && !ownsPlan(conversationId)) return null
  if (parseBoardIntent(text) || parseAblaufIntent(text) || deviceTalk(text)) return null
  if (/^\s*lade\b/i.test(text)) return null
  const hit = await ideaOnTable()
  if (!hit) return 'Was soll geplant werden?'
  const plan = hit.plan || emptyPlan(hit.id, hit.body || hit.title)
  const line = text.replace(/\s+/g, ' ').trim().slice(0, 160)
  const step = loadSettings().plan_spar_step
  if (step) return advanceSpar(hit, plan, line, step)
  const same = (value: string) => value.replace(/[.?!,;:]+$/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
  const known = plan.anforderungen.some((row) => same(row.satz) === same(line))
  if (!known) {
    const n = plan.anforderungen.filter((row) => row.id.startsWith('A')).length + 1
    plan.anforderungen.push({ id: `A${n}`, satz: line, abnahme: '', gateway: 'offen' })
  }
  const sprint = plan.sprints[0] || blankSprint('1', hit.title.slice(0, 48), line.slice(0, 160))
  if (!plan.sprints.length) plan.sprints = [sprint]
  if (!sprint.lieferumfang.some((row) => row.task.toLowerCase() === line.toLowerCase())) {
    sprint.lieferumfang.push({
      id: `S1-${sprint.lieferumfang.length + 1}`,
      task: line.slice(0, 120),
      anleitung: WEG_ANLEITUNG,
    })
  }
  dropCannedRoster(plan)
  addSurface(plan, `${plan.bedingung} ${line}`, true)
  await putIdea({ ...hit, plan })
  await showPlanning({ ...hit, plan })
  const face = plan.anforderungen.filter((row) => row.id.startsWith('O'))
  const tail = face.length ? ` Oberfläche: ${face.map((row) => row.satz).join(', ')}.` : ''
  return `Steht im Plan: ${line}.${tail} Der Planungsbildschirm bleibt offen.`
}

async function layNewProject(work: string): Promise<string> {
  const text = work.replace(/\s+/g, ' ').trim()
  if (text.length < 3) return 'Was soll geplant werden?'
  return openPlanningSession(text)
}

async function writeProject(work: string, conversationId = ''): Promise<string> {
  const parts = clausesOf(work)
  const title = planTitle(work)
  const rows = await listIdeas()
  let hit = genericAppTitle(title) ? undefined : rows.find((r) => r.title.toLowerCase() === title.toLowerCase() && r.status !== 'done')
  if (hit?.plan && !planIsTitleClone(hit.plan, hit.title)) {
    await showPlanning(hit)
    saveSettings({ plan_spar_step: '' })
    return `Das vorhandene Projekt „${hit.title}“ ist geöffnet. Der gespeicherte Plan und der ursprüngliche Wunsch wurden nicht überschrieben.`
  }
  if (!hit) hit = await addIdea(title, work)
  const plan = hit.plan && planIsTitleClone(hit.plan, hit.title) ? hit.plan : emptyPlan(hit.id, work)
  if (planIsTitleClone(plan, title)) {
    plan.anforderungen = []
    plan.sprints = []
  }
  keepOriginalIntake(plan, hit, work)
  if (!thinWork(work)) fillFromClauses(plan, parts, title)
  await putIdea({ ...hit, body: work, plan })
  persistLastList('idea', [hit.title, ...titlesOf(await listIdeas('open')).filter((t) => t !== hit.title)])
  saveSettings({
    plan_phase: 'live',
    plan_conversation_id: conversationId || loadSettings().plan_conversation_id,
    plan_script_at: Date.now(),
    plan_idea_id: hit.id,
    tischplatte_on: true,
    tischplatte_view: 'psp',
    workbench_open: true,
  })
  armSpar(plan, hit.title, true)
  if (loadSettings().plan_spar_step) return formatSession(plan, hit.title)
  return `${formatPlan(plan, hit.title)}\n\nDas Skript läuft live auf der Tischplatte. Sag Go, dann ist der Export bereit. Sag: Lade den PSP runter. Oder: Lade alles zu Projekt ${hit.title}.`
}

async function reviseProject(text: string): Promise<string> {
  const line = text.replace(/\s+/g, ' ').trim()
  if (line.length < 2) return 'Die Zeile ist leer.'
  const hit = await ideaOnTable()
  if (!hit) return 'Noch kein Projekt auf der Tischplatte.'
  const plan = hit.plan || emptyPlan(hit.id, hit.body || '')
  const sprint = findSprint(plan, '1')
  if (!sprint) return 'Sprint 1 gibt es noch nicht.'
  const k = sprint.lieferumfang.length + 1
  sprint.lieferumfang.push({ id: `S1-${k}`, task: line.slice(0, 120), anleitung: WEG_ANLEITUNG })
  await putIdea({ ...hit, plan })
  saveSettings({
    plan_phase: 'live',
    plan_conversation_id: loadSettings().plan_conversation_id,
    plan_script_at: Date.now(),
    plan_idea_id: hit.id,
    tischplatte_on: true,
    workbench_open: true,
  })
  return formatPlan(plan, hit.title)
}

async function ideaOnTable(): Promise<Idea | undefined> {
  const pinned = loadSettings().plan_idea_id
  if (pinned) {
    const ideas = await listIdeas()
    return ideas.find((r) => r.id === pinned && r.status !== 'done')
  }
  return currentIdeaForTable()
}

let ideaChain: Promise<void> = Promise.resolve()

async function handleIdeaBody(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta }> {
  const question = parsePlanQuestion(loadSettings().plan_question_json)
  if (
    question &&
    question.conversationId === conversationId &&
    !parsePortfolioIntent(text) &&
    !parseBoardIntent(text) &&
    !parseAblaufIntent(text) &&
    !parseIdeaIntent(text)
  ) {
    if (/^\s*(?:nein|abbrechen|stopp)\s*[.!?]*$/i.test(text)) {
      saveSettings({ plan_question_json: '' })
      return pack('Die Rückfrage ist abgebrochen. Am Plan wurde nichts geändert.', 'plan_question_cancel')
    }
    if (isTooShortPlanAnswer(text)) {
      return pack(`${question.question} Bitte beschreibe ein konkretes, prüfbares Ergebnis.`, 'plan_question_clarify')
    }
    const rows = await listIdeas()
    const hit = rows.find((row) => row.id === question.ideaId && row.status !== 'done')
    const need = hit?.plan?.anforderungen.find((row) => row.id === question.requirementId)
    if (!hit?.plan || !need) {
      saveSettings({ plan_question_json: '' })
      return pack('Das zugehörige Projekt oder die Anforderung ist nicht mehr vorhanden. Es wurde nichts geändert.', 'plan_question_stale')
    }
    const prior = savePlanRevision(hit.plan, 'Vor Rückfrage-Antwort', newId())
    need.abnahme = text.replace(/\s+/g, ' ').trim().slice(0, 400)
    need.gateway = 'offen'
    const plan = {
      ...hit.plan,
      revisions: prior.revisions,
      evidence: [
        ...(hit.plan.evidence || []),
        { id: newId(), kind: 'local' as const, title: 'Antwort auf Rückfrage', text: need.abnahme, requirementId: need.id },
      ],
    }
    await putIdea({ ...hit, plan })
    saveSettings({ plan_question_json: '' })
    return pack(`Danke. Ich habe die prüfbare Abnahme für „${need.satz}“ im Projekt ${hit.title} ergänzt. Go bleibt offen, bis der Plan geprüft wurde.`, 'plan_question_answer')
  }

  const portfolio = parsePortfolioIntent(text)
  if (portfolio) {
    if (portfolio.kind === 'create') return pack(await layNewProject(portfolio.work), 'portfolio')
    const reply = await handlePortfolio(conversationId, portfolio)
    return pack(reply, 'portfolio')
  }
  const table = parseAblaufIntent(text)
  const tableHere =
    !table ||
    ownsPlan(conversationId) ||
    table.kind === 'open' ||
    table.kind === 'session' ||
    table.kind === 'screen' ||
    table.kind === 'close'
  if (table && tableHere) {
    if (table.kind === 'open' && table.work) {
      const written = await writeProject(table.work, conversationId)
      const cards = await startPlanCards(conversationId, table.work)
      return pack(cards ? `${written}\n\n${cards}` : written, 'plan_table')
    }
    const reply = await planOntoTable(table, text, conversationId)
    return pack(reply, 'plan_table')
  }
  const ablauf = await handleAblauf(conversationId, text)
  if (ablauf.handled) return { handled: true, reply: ablauf.reply, tool: ablauf.tool }
  const intent = parseIdeaIntent(text)
  if (!intent) {
    const talked = await sparPlan(text, conversationId)
    if (talked) return pack(talked, 'plan_talk')
    return { handled: false }
  }

  if (intent.kind === 'delete_unsupported') {
    return pack(
      'Eine geprüfte Funktion zum Löschen aller Projektdateien gibt es nicht. Es wurde nichts gelöscht.',
      'delete_unsupported',
    )
  }

  if (intent.kind === 'table_lookup') {
    const rows = await listIdeas()
    const query = intent.query.toLowerCase()
    const hit = rows.find((row) => `${row.title} ${row.body} ${JSON.stringify(row.plan || {})}`.toLowerCase().includes(query))
    return pack(
      hit
        ? `„${intent.query}“ steht im gespeicherten Inhalt des Projekts „${hit.title}“. Die aktuelle Bildschirmdarstellung kann ich nicht live auslesen.`
        : `Im gespeicherten Inhalt der Projekte finde ich „${intent.query}“ nicht. Die aktuelle Bildschirmdarstellung kann ich nicht live auslesen.`,
      'table_lookup',
      hit?.title,
    )
  }

  if (intent.kind === 'blank') {
    saveSettings({
      plan_phase: 'live',
      plan_conversation_id: conversationId,
      plan_script_at: Date.now(),
      plan_idea_id: '',
      tischplatte_on: true,
      tischplatte_view: 'psp',
      workbench_open: true,
    })
    return pack('Die leere Planung ist geöffnet. Welche App möchten Sie planen?', 'blank')
  }

  if (intent.kind === 'create') {
    const row = await addIdea(intent.title, intent.body, conversationId)
    const plan = emptyPlan(row.id, row.body || row.title)
    await putIdea({ ...row, plan })
    persistLastList('idea', titlesOf(await listIdeas('open')))
    return pack(`Idee liegt: ${row.title}.`, 'create', row.title)
  }

  if (intent.kind === 'list') {
    const rows = intent.all ? (await listIdeas()).filter((r) => r.status !== 'done') : await listIdeas('open')
    persistLastList('idea', titlesOf(rows))
    if (!rows.length) return pack(intent.all ? 'Keine Ideen.' : 'Keine offenen Ideen.', 'list')
    const lines = rows.map((r, i) => `${i + 1}. ${r.title}${r.status === 'parked' ? ' (geparkt)' : ''}`)
    return pack(lines.join('\n'), 'list')
  }

  if (intent.kind === 'park' || intent.kind === 'done') {
    const rows = await listIdeas()
    const hit = pickIdea(
      rows.filter((r) => r.status !== 'done'),
      intent.query,
      intent.index,
    )
    if (!hit) return pack('Die Idee finde ich nicht.', 'miss')
    const status = intent.kind === 'park' ? 'parked' : 'done'
    await putIdea({ ...hit, status })
    persistLastList('idea', titlesOf(await listIdeas('open')))
    return pack(
      intent.kind === 'park' ? `Idee geparkt: ${hit.title}.` : `Idee erledigt: ${hit.title}.`,
      intent.kind,
      hit.title,
    )
  }

  if (intent.kind === 'show_plan') {
    const rows = await listIdeas()
    const hit = pickIdea(rows, intent.query, intent.index)
    if (!hit) return pack('Die Idee finde ich nicht.', 'miss')
    persistLastList('idea', [hit.title, ...titlesOf(await listIdeas('open')).filter((t) => t !== hit.title)])
    const plan = hit.plan || emptyPlan(hit.id)
    return pack(formatPlan(plan, hit.title), 'plan', hit.title)
  }

  if (intent.kind === 'fill_plan') {
    const rows = await listIdeas()
    const hit = pickIdea(rows, intent.query, intent.index)
    if (!hit) return pack('Die Idee finde ich nicht.', 'miss')
    let filled: IdeaPlan
    try {
      filled = await fillPlanWithModel(hit)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return pack(message, 'plan_fail', hit.title)
    }
    await setPending({
      conversation_id: conversationId,
      tool: 'idea',
      action: 'plan_confirm',
      args: { ideaId: hit.id, plan: filled },
      preview: hit.title,
      created_at: new Date().toISOString(),
    })
    return pack(
      `${formatPlan(filled, hit.title)}\n\nDas ist ein Vorschlag und noch nicht gespeichert. Antworte genau „bestätigen“ zum Übernehmen oder „verwerfen“ zum Ablehnen.`,
      'plan_proposal',
      hit.title,
    )
  }

  if (intent.kind === 'add_line') {
    const rows = await listIdeas()
    const hit = pickIdea(rows, intent.query, intent.index)
    if (!hit) return pack('Die Idee finde ich nicht.', 'miss')
    const plan = hit.plan || emptyPlan(hit.id, hit.body || '')
    const n = String(intent.sprint || 1)
    const sprint = findSprint(plan, n)
    if (!sprint) return pack('Den Sprint finde ich nicht.', 'plan_fail')
    const k = sprint.lieferumfang.length + 1
    sprint.lieferumfang.push({ id: `S${n}-${k}`, task: intent.line, anleitung: intent.line })
    await putIdea({ ...hit, plan })
    persistLastList('idea', [hit.title])
    return pack(formatPlan(plan, hit.title), 'plan_line', hit.title)
  }

  if (intent.kind === 'custom') {
    const rows = await listIdeas()
    const hit = pickIdea(rows, intent.query, intent.index)
    if (!hit) return pack('Die Idee finde ich nicht.', 'miss')
    const plan = hit.plan || emptyPlan(hit.id, hit.body || '')
    const n = nextSprintN(plan)
    const sprint = blankSprint(n, intent.title.slice(0, 80), intent.ziel)
    plan.sprints.push(sprint)
    await putIdea({ ...hit, plan })
    persistLastList('idea', [hit.title])
    return pack(formatPlan(plan, hit.title), 'plan_custom', hit.title)
  }

  if (intent.kind === 'strike') {
    const rows = await listIdeas()
    const hit = pickIdea(rows, intent.query, intent.index)
    if (!hit) return pack('Die Idee finde ich nicht.', 'miss')
    const plan = hit.plan || emptyPlan(hit.id, hit.body || '')
    const sprint = findSprint(plan, intent.n)
    if (!sprint) return pack('Den Sprint finde ich nicht.', 'miss')
    sprint.gateway = 'nogo'
    sprint.nogo_wenn = 'auf Zuruf'
    sprint.abbruch = 'auf Zuruf'
    await putIdea({ ...hit, plan })
    persistLastList('idea', [hit.title])
    return pack(formatPlan(plan, hit.title), 'plan_strike', hit.title)
  }

  if (intent.kind === 'remind') {
    if (!intent.due) return pack('Wann?', 'ask_when')
    const rows = await listIdeas()
    const hit = pickIdea(rows, intent.query, intent.index)
    const label = hit ? `Idee: ${hit.title}` : intent.target.startsWith('sprint') ? `Sprint ${intent.target.slice(7)}` : 'Idee'
    await addReminder({
      title: label,
      due_at: intent.due.toISOString(),
      conversationId,
      kind: 'once',
    })
    persistLastList('idea', hit ? [hit.title] : readLastList('idea'))
    return pack(`${label}, ${intent.whenLabel}.`, 'remind', label)
  }

  if (intent.kind === 'todo_sprint') {
    const pending = await getPending(conversationId)
    if (pending?.tool === 'todo') {
      return { handled: false }
    }

    const rows = await listIdeas()
    const hit = pickIdea(rows)
    if (!hit?.plan) return pack('Kein Plan, den ich zum Todo machen kann.', 'miss')
    const sprint = findSprint(hit.plan, String(intent.n))
    if (!sprint) return pack('Den Sprint finde ich nicht.', 'miss')
    const title = `Sprint ${sprint.n}: ${sprint.title} (${hit.title})`
    await setPending({
      conversation_id: conversationId,
      tool: 'todo',
      action: 'create',
      args: { title },
      preview: `Todo anlegen: ${title}`,
      created_at: new Date().toISOString(),
    })
    return pack(`Sprint ${sprint.n} als Todo anlegen — ja?`, 'confirm', title)
  }

  return { handled: false }
}

/** Model-generated plans are persisted only after an explicit confirmation. */
export async function handlePendingPlanProposal(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta } | null> {
  const pending = await getPending(conversationId)
  if (pending?.tool !== 'idea' || pending.action !== 'plan_confirm') return null
  const age = Date.now() - Date.parse(pending.created_at)
  if (!Number.isFinite(age) || age < 0 || age > 15 * 60_000) {
    await clearPending(conversationId)
    return null
  }
  if (/^\s*(?:verwerfen|ablehnen|nein|abbrechen|stopp)\s*[.!?]*$/i.test(text)) {
    await clearPending(conversationId)
    return pack('Der Planvorschlag wurde verworfen. Der gespeicherte Plan blieb unverändert.', 'plan_proposal_decline')
  }
  if (!/^\s*(?:bestätigen|übernehmen|ja)\s*[.!?]*$/i.test(text)) {
    const isNewPlanCommand =
      parsePortfolioIntent(text) ||
      parseBoardIntent(text) ||
      parseAblaufIntent(text) ||
      parseIdeaIntent(text)
    if (isNewPlanCommand || pendingYields(text, 'idea')) {
      await clearPending(conversationId)
      return null
    }
    return pack('Der Vorschlag ist noch nicht gespeichert. Antworte genau „bestätigen“ zum Übernehmen oder „verwerfen“ zum Ablehnen.', 'plan_proposal_confirm')
  }

  const ideaId = typeof pending.args.ideaId === 'string' ? pending.args.ideaId : ''
  const rows = await listIdeas()
  const hit = rows.find((row) => row.id === ideaId && row.status !== 'done')
  const proposal = parsePlan(pending.args.plan, ideaId)
  const validation = proposal ? validatePlan(proposal) : { ok: false, errors: ['Planvorschlag fehlt oder ist beschädigt.'] }
  if (!hit || !proposal || !validation.ok || !planHasBody(proposal)) {
    await clearPending(conversationId)
    return pack('Der Planvorschlag ist ungültig oder das Projekt fehlt. Es wurde nichts geändert.', 'plan_proposal_invalid')
  }

  const revisions = hit.plan
    ? savePlanRevision(hit.plan, 'Vor bestätigtem Planvorschlag', newId()).revisions
    : []
  proposal.ideaId = hit.id
  proposal.bedingung = hit.plan?.bedingung || hit.body || hit.title
  proposal.revisions = revisions
  await putIdea({ ...hit, plan: proposal })
  await clearPending(conversationId)
  persistLastList('idea', [hit.title])
  const questionText = askPlanQuestion({ ...hit, plan: proposal }, conversationId)
  return pack(
    `Planvorschlag übernommen.${questionText ? `\n\nRückfrage: ${questionText}` : ''}`,
    'plan_proposal_accept',
    hit.title,
  )
}

export function handleIdea(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta }> {
  const run = ideaChain.then(() => handleIdeaBody(conversationId, text))
  ideaChain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}
