import {
  addIdea,
  addReminder,
  getPending,
  listIdeas,
  loadSettings,
  persistLastList,
  putIdea,
  readLastList,
  setPending,
  type Idea,
} from './store.ts'
import { parseIdeaIntent } from './idea-parse.ts'
import { emptyPlan, findSprint, formatPlan, nextCustomN, parsePlan, type IdeaPlan } from './idea-plan.ts'
import { completeGroq, groqReady } from './groq.ts'
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

function pickIdea(rows: Idea[], query?: string, index?: number): Idea | undefined {
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

async function fillPlanWithModel(idea: Idea): Promise<IdeaPlan | null> {
  if (!groqReady()) return null
  const skeleton = emptyPlan(idea.id)
  try {
    const text = await completeGroq([
      { role: 'system', content: FILL_SYSTEM },
      {
        role: 'user',
        content: `Idee: ${idea.title}\n${idea.body || ''}\nVorlage: ${JSON.stringify(skeleton)}`,
      },
    ])
    return parsePlan(extractJson(text), idea.id)
  } catch {
    return null
  }
}

export async function handleIdea(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta }> {
  const intent = parseIdeaIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'create') {
    const row = await addIdea(intent.title, intent.body, conversationId)
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
