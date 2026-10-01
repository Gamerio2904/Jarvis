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
import { commitPortfolio, currentIdeaForTable, handlePortfolio } from './portfolio.ts'
import { parsePortfolioIntent } from './portfolio-parse.ts'
import { parseIdeaIntent } from './idea-parse.ts'
import {
  emptyPlan,
  findSprint,
  formatPlan,
  nextCustomN,
  parsePlan,
  planHasBody,
  WEG_ANLEITUNG,
  type IdeaPlan,
} from './idea-plan.ts'
import { parseBoardJobs, serializeBoardJobs, stopJobs } from './board-jobs.ts'
import { completeGroq, groqReady } from './groq.ts'
import { completeGemini, geminiReady } from './gemini.ts'
import type { ToolMeta } from './tools.ts'

const FILL_SYSTEM = `Du füllst eine feste Sprint-Vorlage auf Deutsch.
Antwort NUR als JSON-Objekt { "sprints": [ ... ] }.
Genau drei Kern-Sprints: n "1" title "Kern", n "2" title "Härten", n "3" title "Probe", kind "core".
Du darfst lieferumfang-Zeilen {id, task, anleitung} ergänzen.
Custom-Sprints kind "custom" n "C1" nur mit Grund im ziel (Gerät, Sideload, Parser-Konflikt, Risiko).
Keine RICE, keine App-Version, keine englischen Kapitel, keine anderen Agenten, keine docs/sprints.
Keine Daten erfinden.`

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
  const skeleton = emptyPlan(idea.id)
  const messages = [
    { role: 'system', content: FILL_SYSTEM },
    {
      role: 'user',
      content: `Idee: ${idea.title}\n${idea.body || ''}\nVorlage: ${JSON.stringify(skeleton)}`,
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
      const plan = parsePlan(extractJson(text), idea.id)
      if (plan && planHasBody(plan)) return plan
    } catch {
      /* nächster Slot */
    }
  }
  return null
}

function fillFromClauses(plan: IdeaPlan, parts: string[], title: string) {
  plan.sprints[0].ziel = (parts.join(', ') || title).slice(0, 160)
  plan.sprints[0].lieferumfang = parts.map((task, i) => ({
    id: `S1-${i + 1}`,
    task: task.slice(0, 120),
    anleitung: WEG_ANLEITUNG,
  }))
  if (parts.length < 2) return
  plan.sprints[1].ziel = 'Die Wege gegeneinander halten.'
  plan.sprints[1].lieferumfang = [
    {
      id: 'S2-1',
      task: 'Wege vergleichen',
      anleitung: 'Jeden Weg aus dem Satz gegen die anderen halten.',
    },
  ]
  plan.sprints[2].ziel = 'Einen Weg einmal durchspielen.'
  plan.sprints[2].lieferumfang = [
    {
      id: 'S3-1',
      task: 'Einen Weg durchspielen',
      anleitung: 'Einen Weg aus dem Satz einmal prüfen.',
    },
  ]
}

function clausesOf(work: string): string[] {
  return work
    .split(/,|\s+und\s+/i)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 3)
    .slice(0, 6)
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

async function planOntoTable(intent: AblaufIntent): Promise<string> {
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
  if (intent.kind === 'open' && !intent.work) return 'Was soll geplant werden?'
  if (intent.kind === 'close') return 'Das Planfenster ist zu. Die Sprints bleiben auf der Tischplatte.'
  if (intent.kind === 'revise') return reviseProject(intent.text)
  if (intent.kind === 'open' && intent.work) return writeProject(intent.work)
  return 'Planen schreibt Sprints und PSP auf der Tischplatte.'
}

async function writeProject(work: string): Promise<string> {
  const parts = clausesOf(work)
  const title = (parts[0] || work).slice(0, 72)
  const rows = await listIdeas()
  let hit = rows.find((r) => r.title.toLowerCase() === title.toLowerCase() && r.status !== 'done')
  if (!hit) hit = await addIdea(title, work)
  const plan = emptyPlan(hit.id)
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
  const plan = hit.plan || emptyPlan(hit.id)
  const sprint = findSprint(plan, '1')
  if (!sprint) return 'Diesen Kern-Sprint gibt es nicht.'
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
    const reply = await handlePortfolio(conversationId, portfolio)
    return pack(reply, 'portfolio')
  }
  const table = parseAblaufIntent(text)
  if (table) {
    const reply = await planOntoTable(table)
    return pack(reply, 'plan_table')
  }
  const ablauf = await handleAblauf(conversationId, text)
  if (ablauf.handled) return { handled: true, reply: ablauf.reply, tool: ablauf.tool }
  const intent = parseIdeaIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'create') {
    const row = await addIdea(intent.title, intent.body, conversationId)
    const plan = emptyPlan(row.id)
    const kern = plan.sprints.find((s) => s.n === '1')
    if (kern) kern.ziel = row.title
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
    const plan = hit.plan || emptyPlan(hit.id)
    const n = String(intent.sprint || 1)
    const sprint = findSprint(plan, n)
    if (!sprint || sprint.kind !== 'core') return pack('Diesen Kern-Sprint gibt es nicht.', 'plan_fail')
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
    const plan = hit.plan || emptyPlan(hit.id)
    const n = nextCustomN(plan)
    plan.sprints.push({
      n,
      kind: 'custom',
      title: intent.title.slice(0, 80),
      ziel: intent.ziel,
      lieferumfang: [],
      wont: ['—'],
      abbruch: '—',
    })
    await putIdea({ ...hit, plan })
    persistLastList('idea', [hit.title])
    return pack(formatPlan(plan, hit.title), 'plan_custom', hit.title)
  }

  if (intent.kind === 'strike') {
    const rows = await listIdeas()
    const hit = pickIdea(rows, intent.query, intent.index)
    if (!hit) return pack('Die Idee finde ich nicht.', 'miss')
    const plan = hit.plan || emptyPlan(hit.id)
    const sprint = findSprint(plan, intent.n)
    if (!sprint) return pack('Den Sprint finde ich nicht.', 'miss')
    if (sprint.kind === 'core') {
      sprint.ziel = 'entfällt: auf Zuruf'
      sprint.lieferumfang = []
    } else {
      plan.sprints = plan.sprints.filter((s) => s !== sprint)
    }
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
