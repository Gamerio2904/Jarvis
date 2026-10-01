import {
  addIdea,
  addReminder,
  getPending,
  listIdeas,
  loadSettings,
  persistLastList,
  putIdea,
  readLastList,
  saveSettings,
  setPending,
  type Idea,
} from './store.ts'
import { handleAblauf } from './ablauf.ts'
import { ablaufWaiting } from './ablauf-state.ts'
import { parseAblaufIntent, type AblaufIntent } from './ablauf-parse.ts'
import { commitPortfolio, currentIdeaForTable, handlePortfolio, listPortfolio } from './portfolio.ts'
import { artLabel } from './entwurf-muster.ts'
import { cannedPlanLine, cannedRosterLine } from './plan-desk.ts'
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
  PLAN_BEDINGUNG,
  PLAN_RAHMEN,
  WEG_ANLEITUNG,
  type IdeaPlan,
} from './idea-plan.ts'
import { parseBoardJobs, serializeBoardJobs, stopJobs } from './board-jobs.ts'
import { completeGroq, groqReady } from './groq.ts'
import { completeGemini, geminiReady } from './gemini.ts'
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

export async function fillPlanWithModel(idea: Idea): Promise<IdeaPlan | null> {
  if (!groqReady() && !geminiReady()) return null
  const skeleton = emptyPlan(idea.id, idea.body || idea.title)
  const messages = [
    { role: 'system', content: FILL_SYSTEM },
    {
      role: 'user',
      content: `Bedingung: ${skeleton.bedingung}\nRahmen: ${skeleton.rahmen.join(' | ')}\nHülle: ${JSON.stringify(blankSprint('1'))}`,
    },
  ]
  const runs: Array<() => Promise<string>> = []
  if (groqReady()) runs.push(() => completeGroq(messages, undefined, 1600))
  if (geminiReady()) {
    runs.push(async () => (await completeGemini(messages, undefined, { thinking: false, maxOutputTokens: 2000, timeoutMs: 25_000 })).text)
  }
  for (const run of runs) {
    try {
      const text = await run()
      const plan = parsePlan(extractJson(text), idea.id)
      if (plan && planHasBody(plan)) return plan
    } catch {
      /* nächster Slot */
    }
  }
  return null
}

function fillFromClauses(plan: IdeaPlan, parts: string[], title: string) {
  const body = parts.filter((part) => part.toLowerCase() !== title.toLowerCase())
  const ziel = (body.join('. ') || parts.join('. ') || title).slice(0, 220)
  const first = blankSprint('1', title.slice(0, 48), ziel)
  const tasks = parts.length ? parts : [title]
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
  const stripped = head.replace(/^(?:plane|plan)\s+(?:mir\s+)?(?:eine\s+)?app\s+/i, '').trim()
  return (stripped || head || text).slice(0, 72)
}

function clearShownPlan(): string {
  const phase = loadSettings().plan_phase
  const jobs = stopJobs(parseBoardJobs(loadSettings().board_jobs_json))
  saveSettings({
    plan_phase: '',
    plan_script_at: 0,
    plan_idea_id: '',
    board_jobs_json: serializeBoardJobs(jobs),
  })
  if (phase === 'live' || phase === 'go') return 'Der Plan ist von der Tischplatte weg.'
  return 'Es liegt kein Plan auf der Tischplatte.'
}

async function planOntoTable(intent: AblaufIntent, raw = ''): Promise<string> {
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
    ablauf_status: '',
    ablauf_id: '',
    bot_ask_json: '',
  })
  if (intent.kind === 'session') return openPlanningSession(intent.work)
  if (intent.kind === 'open' && !intent.work) return 'Was soll geplant werden?'
  if (intent.kind === 'close') return closePlanningScreen(raw)
  if (intent.kind === 'revise') return reviseProject(intent.text)
  if (intent.kind === 'open' && intent.work) return writeProject(intent.work)
  return 'Planen schreibt Sprints und PSP auf der Tischplatte.'
}

async function closePlanningScreen(raw: string): Promise<string> {
  if (/^\s*fenster\s+zu\b/i.test(raw.trim())) await closeDraftRow()
  const phase = loadSettings().plan_phase
  if (phase === 'live' || phase === 'go') {
    saveSettings({ plan_phase: '', plan_script_at: 0, tischplatte_on: true })
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
    const zeile = block.zeile && block.zeile !== 'Noch leer.' ? block.zeile : artLabel(block.art)
    plan.anforderungen.push({
      id: `O${i + 1}`,
      satz: `${artLabel(block.art)}: ${zeile}`,
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

async function ensurePlanningDocs(idea: Idea, work: string): Promise<Idea> {
  const plan = idea.plan || emptyPlan(idea.id, work || idea.body || idea.title)
  const source = (work || plan.bedingung || idea.body || idea.title).trim()
  const parts = clausesOf(source)
  if (!plan.anforderungen.length && parts.length) {
    plan.anforderungen = parts.map((satz, i) => ({
      id: `A${i + 1}`,
      satz,
      abnahme: '',
      gateway: 'offen' as const,
    }))
  }
  if (!plan.sprints.length) fillFromClauses(plan, parts.length ? parts : [idea.title], planTitle(source || idea.title))
  dropCannedRoster(plan)
  addSurface(plan, source)
  const next = { ...idea, body: idea.body || source, plan }
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
  bits.push('Sag Fertig, dann geht der Bildschirm zu.')
  return bits.join(' ')
}

async function showPlanning(idea: Idea): Promise<void> {
  saveSettings({
    plan_phase: 'live',
    plan_script_at: Date.now(),
    plan_idea_id: idea.id,
    tischplatte_on: true,
    tischplatte_view: 'psp',
  })
}

async function openPlanningSession(work: string): Promise<string> {
  const text = work.replace(/\s+/g, ' ').trim()
  let hit = text ? await namedProject(text) : await ideaOnTable()
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
    await writeProject(text)
    hit = await ideaOnTable()
  }
  if (!hit) return 'Was soll geplant werden?'
  const ready = await ensurePlanningDocs(hit, text || hit.body || hit.title)
  const saved = await commitPortfolio(ready)
  await showPlanning(ready)
  const cardName = saved.row && !saved.full ? saved.row.name : ''
  return formatSession(ready.plan || emptyPlan(ready.id), ready.title, cardName)
}

function talkWorth(text: string): boolean {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length < 8) return false
  if (/^(?:hallo|hi|hey|danke|ok(?:ay)?|ja|nein|stopp)\b/i.test(t) && t.split(/\s+/).length < 4) return false
  return true
}

export async function sparPlan(text: string): Promise<string | null> {
  if (loadSettings().plan_phase !== 'live' || !talkWorth(text)) return null
  if (parseBoardIntent(text) || parseAblaufIntent(text)) return null
  if (/^\s*lade\b/i.test(text)) return null
  const hit = await ideaOnTable()
  if (!hit) return 'Was soll geplant werden?'
  const plan = hit.plan || emptyPlan(hit.id, hit.body || hit.title)
  const line = text.replace(/\s+/g, ' ').trim().slice(0, 160)
  const known = plan.anforderungen.some((row) => row.satz.toLowerCase() === line.toLowerCase())
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

async function writeProject(work: string): Promise<string> {
  const parts = clausesOf(work)
  const title = planTitle(work)
  const rows = await listIdeas()
  let hit = rows.find((r) => r.title.toLowerCase() === title.toLowerCase() && r.status !== 'done')
  if (!hit) hit = await addIdea(title, work)
  const plan = emptyPlan(hit.id, work)
  fillFromClauses(plan, parts, title)
  await putIdea({ ...hit, body: work, plan })
  persistLastList('idea', [hit.title, ...titlesOf(await listIdeas('open')).filter((t) => t !== hit.title)])
  saveSettings({
    plan_phase: 'live',
    plan_script_at: Date.now(),
    plan_idea_id: hit.id,
    tischplatte_on: true,
    tischplatte_view: 'psp',
  })
  return `${formatPlan(plan, hit.title)}\n\nDas Skript läuft live auf der Tischplatte. Sag Go, dann ist der Export bereit. Sag: Lade den PSP runter. Oder: Lade alles zu Projekt ${hit.title}.`
}

async function reviseProject(text: string): Promise<string> {
  const line = text.replace(/\s+/g, ' ').trim()
  if (line.length < 2) return 'Die Zeile ist leer.'
  const rows = await listIdeas()
  const hit = rows.find((r) => r.status === 'open') || rows[0]
  if (!hit) return 'Noch kein Projekt auf der Tischplatte.'
  const plan = hit.plan || emptyPlan(hit.id, hit.body || '')
  const sprint = findSprint(plan, '1')
  if (!sprint) return 'Sprint 1 gibt es noch nicht.'
  const k = sprint.lieferumfang.length + 1
  sprint.lieferumfang.push({ id: `S1-${k}`, task: line.slice(0, 120), anleitung: WEG_ANLEITUNG })
  await putIdea({ ...hit, plan })
  saveSettings({ plan_phase: 'live', plan_script_at: Date.now(), plan_idea_id: hit.id, tischplatte_on: true })
  return formatPlan(plan, hit.title)
}

async function ideaOnTable(): Promise<Idea | undefined> {
  const pinned = loadSettings().plan_idea_id
  if (pinned) {
    const ideas = await listIdeas()
    const hit = ideas.find((r) => r.id === pinned && r.status !== 'done')
    if (hit) return hit
  }
  return currentIdeaForTable()
}

export async function handleIdea(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta }> {
  const portfolio = parsePortfolioIntent(text)
  if (portfolio) {
    if (portfolio.kind === 'create') return pack(await layNewProject(portfolio.work), 'portfolio')
    const reply = await handlePortfolio(conversationId, portfolio)
    return pack(reply, 'portfolio')
  }
  const table = parseAblaufIntent(text)
  if (table) {
    const reply = await planOntoTable(table, text)
    return pack(reply, 'plan_table')
  }
  const ablauf = await handleAblauf(conversationId, text)
  if (ablauf.handled) return { handled: true, reply: ablauf.reply, tool: ablauf.tool }
  const intent = parseIdeaIntent(text)
  if (!intent) {
    const talked = await sparPlan(text)
    if (talked) return pack(talked, 'plan_talk')
    return { handled: false }
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
    const filled = await fillPlanWithModel(hit)
    if (!filled) return pack('Plan nicht übernommen.', 'plan_fail', hit.title)
    await putIdea({ ...hit, plan: filled })
    persistLastList('idea', [hit.title])
    return pack(formatPlan(filled, hit.title), 'plan_fill', hit.title)
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
