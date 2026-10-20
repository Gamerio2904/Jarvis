import { postJson, getText } from './http-json.ts'
import { geminiModelOrder, isFatalAuth, isUnknownModel, markSkip, parseSkipMap } from './cloud-errors.ts'
import { groqChatExtras, groqReady } from './groq.ts'
import { geminiReady } from './gemini.ts'
import { quotaBlocked, noteQuotaHeaders } from './quota.ts'
import { isTurnAborted } from './turn-abort.ts'
import { requestNotifyPermission, scheduleNotify } from '../native/notify.ts'
import { notifyIdOf } from './reminders.ts'
import { createEventFromGui } from './calendar.ts'
import { expandEvents } from './calendar-occur.ts'
import { syncGlance } from './glance.ts'
import { fillResearchLinks } from './web-search.ts'
import { brainProposeWrite, brainRead } from './agents/brain-api.ts'
import { pushAgentTrace } from './agents/trace-store.ts'
import { memoryBlock } from './memory.ts'
import { workingBlock } from './working-memory.ts'
import { USER_AGENT } from './ua.ts'
import {
  addNote,
  addReminder,
  addShopping,
  addTodo,
  listEvents,
  listMemory,
  listMessages,
  listReminders,
  listTodos,
  loadSettings,
  saveSettings,
  type Reminder,
} from './store.ts'
import type { ResearchMeta, ResearchSource } from './research-parse.ts'
import type { ToolMeta } from './tools.ts'
import type { RouteCtx } from './route-types.ts'

/**
 * Der Werkzeug-Agent: das Modell wählt selbst, welche Werkzeuge es braucht,
 * ruft sie mit echten Argumenten auf, sieht die Ergebnisse und antwortet
 * danach. Er läuft, wenn kein Parser den Satz für sich beansprucht hat.
 *
 * Werkzeugnamen und Beschreibungen sind englisch, weil Modelle sie so
 * zuverlässiger befolgen; was der Nutzer liest, bleibt deutsch.
 */

type JsonSchema = {
  type: 'object' | 'string' | 'integer' | 'number' | 'boolean' | 'array'
  description?: string
  enum?: string[]
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
}

export type ToolOutcome = {
  ok: boolean
  /** Was das Modell als Ergebnis sieht. */
  data: string
  /** Agent-Kennung, unter der Folgefragen („verschieb das“) weiterlaufen. */
  agent?: string
  preview?: string
  research?: ResearchMeta
  /** Gerät oder Löschen wartet auf „ja“ und ist noch nicht ausgeführt. */
  pending?: boolean
}

export type ToolEnv = {
  conversationId: string
  text: string
  now: Date
  /** Brücke zu den bestehenden Parser-Agenten — ein deutscher Satz wie getippt. */
  runCommand?: (sentence: string) => Promise<{ ok: boolean; reply: string; agent?: string; pending?: boolean }>
  /** Erster Satz, noch während die Werkzeuge laufen. */
  onProgress?: (line: string) => void
}

export type AgentTool = {
  name: string
  description: string
  parameters: JsonSchema
  run: (args: Record<string, unknown>, env: ToolEnv) => Promise<ToolOutcome>
}

const MAX_STEPS = 5
const MAX_TOOL_DATA = 3500

function str(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim() : ''
}

function int(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\s*-?\d+\s*$/.test(v) ? Number(v) : NaN
  return Number.isFinite(n) ? Math.round(n) : null
}

const pad = (n: number) => String(n).padStart(2, '0')

export function localIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** `YYYY-MM-DDTHH:MM` in Gerätezeit. Ein `Z` oder Offset wird respektiert. */
export function parseLocalDateTime(raw: unknown): Date | null {
  const t = str(raw)
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(t)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const h = m[4] == null ? 9 : Number(m[4])
  const mi = m[5] == null ? 0 : Number(m[5])
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null
  const date = m[6] ? new Date(t.replace(' ', 'T')) : new Date(y, mo - 1, d, h, mi)
  if (Number.isNaN(date.getTime())) return null
  if (!m[6] && (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d)) return null
  return date
}

export function parseLocalDate(raw: unknown): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(raw))
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d.getMonth() === Number(m[2]) - 1 ? d : null
}

export function whenLabel(d: Date, now = new Date()): string {
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diff = Math.round((dayD - day0) / 86_400_000)
  const clock = `${d.getHours()}:${pad(d.getMinutes())} Uhr`
  if (diff === 0) return `heute ${clock}`
  if (diff === 1) return `morgen ${clock}`
  if (diff === 2) return `übermorgen ${clock}`
  const wd = d.toLocaleDateString('de-DE', { weekday: 'long' })
  return `${wd}, ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear() !== now.getFullYear() ? d.getFullYear() : ''} ${clock}`
}

/** Sichtbarer Text einer HTML-Seite, ohne Skripte, Stile und Navigation. */
export function htmlToText(html: string, max = MAX_TOOL_DATA): string {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() || ''
  const body = html
    .replace(/<(script|style|noscript|svg|nav|footer|header|form|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
  const text = title ? `${title}\n${body}` : body
  return text.length > max ? `${text.slice(0, max)} …` : text
}

async function scheduleReminderRow(row: Reminder, title: string, at: Date, kind: 'once' | 'alarm' | 'timer' | 'recur'): Promise<boolean> {
  try {
    const perm = await requestNotifyPermission()
    const scheduled = await scheduleNotify({
      id: notifyIdOf(row),
      title: kind === 'alarm' ? 'Wecker' : kind === 'timer' ? 'Timer' : 'Ultron',
      body: title,
      at,
      alarm: true,
      recur: row.recur || undefined,
      tone: loadSettings().alarm_tone_uri,
    })
    try {
      await syncGlance()
    } catch {
      /* Glance ist Zierde */
    }
    return perm && scheduled.ok
  } catch {
    return false
  }
}

function fail(data: string): ToolOutcome {
  return { ok: false, data: `ERROR: ${data}` }
}

const RECUR = ['none', 'daily', 'weekly'] as const

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: 'create_reminder',
    description:
      'Create a reminder that notifies the user at a specific local date and time. Use for "erinnere mich", "nicht vergessen", "denk dran" and any time the user mentions something they must not forget at a point in time. If the user gives only a day without time, pick 09:00. If only a relative time ("in 2 Stunden"), compute it from the current time.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'What to remind about, short German phrase.' },
        datetime: { type: 'string', description: 'Local time as YYYY-MM-DDTHH:MM.' },
        repeat: { type: 'string', enum: [...RECUR], description: 'Repeat rule. Default none.' },
      },
      required: ['title', 'datetime'],
    },
    run: async (a, env) => {
      const title = str(a.title).slice(0, 120)
      const due = parseLocalDateTime(a.datetime)
      if (!title) return fail('title is empty')
      if (!due) return fail('datetime must be YYYY-MM-DDTHH:MM')
      if (due.getTime() < env.now.getTime() - 60_000) return fail(`datetime ${localIso(due)} is in the past`)
      const recur = a.repeat === 'daily' || a.repeat === 'weekly' ? a.repeat : null
      const row = await addReminder({
        title,
        due_at: due.toISOString(),
        conversationId: env.conversationId,
        kind: recur ? 'recur' : 'once',
        recur,
        weekday: recur === 'weekly' ? due.getDay() : null,
      })
      const rings = await scheduleReminderRow(row, title, due, recur ? 'recur' : 'once')
      return {
        ok: true,
        agent: 'reminder',
        preview: `${title} · ${whenLabel(due, env.now)}`,
        data: `Reminder saved: "${title}" at ${localIso(due)}${recur ? ` (${recur})` : ''}. Notification ${rings ? 'scheduled' : 'NOT allowed by the system, tell the user to allow notifications'}.`,
      }
    },
  },
  {
    name: 'create_calendar_event',
    description:
      'Add an appointment to the user\'s calendar (Termin, Treffen, Arzt, Geburtstagsfeier, Meeting). Use when something happens at a date, even if the user does not say "Kalender".',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short German title.' },
        start: { type: 'string', description: 'Local start as YYYY-MM-DDTHH:MM, or YYYY-MM-DD for all-day.' },
        end: { type: 'string', description: 'Optional local end as YYYY-MM-DDTHH:MM.' },
        place: { type: 'string', description: 'Optional place.' },
        remind_minutes_before: { type: 'integer', description: 'Optional reminder offset in minutes.' },
      },
      required: ['title', 'start'],
    },
    run: async (a, env) => {
      const title = str(a.title).slice(0, 120)
      const rawStart = str(a.start)
      const allDay = /^\d{4}-\d{2}-\d{2}$/.test(rawStart)
      const start = allDay ? parseLocalDate(rawStart) : parseLocalDateTime(rawStart)
      if (!title) return fail('title is empty')
      if (!start) return fail('start must be YYYY-MM-DDTHH:MM or YYYY-MM-DD')
      const end = a.end ? parseLocalDateTime(a.end) : null
      if (end && end.getTime() <= start.getTime()) return fail('end is before start')
      const before = int(a.remind_minutes_before)
      const row = await createEventFromGui({
        title,
        start,
        end: end || undefined,
        all_day: allDay || undefined,
        place: str(a.place) || undefined,
        remind_offsets_min: before != null && before >= 0 && before <= 10_080 ? [before] : undefined,
      })
      const label = allDay ? `${start.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'numeric' })} ganztägig` : whenLabel(start, env.now)
      return {
        ok: true,
        agent: 'calendar',
        preview: `${row.title} · ${label}`,
        data: `Event saved: "${row.title}" ${allDay ? `all day ${rawStart}` : `at ${localIso(start)}`}${row.place ? ` in ${row.place}` : ''}.`,
      }
    },
  },
  {
    name: 'list_agenda',
    description:
      'Read calendar events, open reminders, alarms, timers and todos with deadlines in a date range. Use for "was steht an", "habe ich morgen Zeit", "wann ist mein nächster Termin".',
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'First day YYYY-MM-DD. Default today.' },
        to: { type: 'string', description: 'Last day YYYY-MM-DD (inclusive). Default from + 7 days.' },
      },
    },
    run: async (a, env) => {
      const today = new Date(env.now.getFullYear(), env.now.getMonth(), env.now.getDate())
      const from = parseLocalDate(a.from) || today
      const last = parseLocalDate(a.to) || new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7)
      const until = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)
      if (until.getTime() - from.getTime() > 400 * 86_400_000) return fail('range too long, max 400 days')
      const events = expandEvents(await listEvents(), from, until)
        .filter((e) => {
          const t = new Date(e.start_at).getTime()
          return t >= from.getTime() && t < until.getTime()
        })
        .slice(0, 40)
        .map((e) => `- event: ${e.title} @ ${e.all_day ? `${e.start_at.slice(0, 10)} all day` : localIso(new Date(e.start_at))}${e.place ? ` (${e.place})` : ''}`)
      const reminders = (await listReminders())
        .filter((r) => r.status === 'open')
        .filter((r) => {
          const t = new Date(r.due_at).getTime()
          return t >= from.getTime() && t < until.getTime()
        })
        .slice(0, 30)
        .map((r) => `- ${r.kind === 'alarm' ? 'alarm' : r.kind === 'timer' ? 'timer' : 'reminder'}: ${r.title} @ ${localIso(new Date(r.due_at))}${r.recur ? ` (${r.recur})` : ''}`)
      const todos = (await listTodos())
        .filter((t) => t.status !== 'done' && t.deadline_date)
        .filter((t) => {
          const d = parseLocalDate(t.deadline_date)
          return d && d.getTime() >= from.getTime() && d.getTime() < until.getTime()
        })
        .slice(0, 20)
        .map((t) => `- todo due: ${t.title} @ ${t.deadline_date}${t.deadline_time ? ` ${t.deadline_time}` : ''}`)
      const rows = [...events, ...reminders, ...todos]
      const range = `${localIso(from).slice(0, 10)} to ${localIso(last).slice(0, 10)}`
      return {
        ok: true,
        agent: 'calendar',
        data: rows.length ? `Agenda ${range}:\n${rows.join('\n')}` : `Nothing scheduled ${range}.`,
      }
    },
  },
  {
    name: 'set_timer',
    description: 'Start a countdown timer.',
    parameters: {
      type: 'object',
      properties: {
        minutes: { type: 'integer', description: 'Duration in whole minutes, 1 to 1440.' },
        label: { type: 'string', description: 'Optional label, e.g. "Nudeln".' },
      },
      required: ['minutes'],
    },
    run: async (a, env) => {
      const minutes = int(a.minutes)
      if (minutes == null || minutes < 1 || minutes > 1440) return fail('minutes must be 1..1440')
      const title = str(a.label).slice(0, 60) || 'Timer'
      const due = new Date(env.now.getTime() + minutes * 60_000)
      const row = await addReminder({ title, due_at: due.toISOString(), conversationId: env.conversationId, kind: 'timer' })
      await scheduleReminderRow(row, title, due, 'timer')
      return {
        ok: true,
        agent: 'timer',
        preview: `${title} · ${minutes} min`,
        data: `Timer "${title}" running for ${minutes} minutes, rings at ${localIso(due)}.`,
      }
    },
  },
  {
    name: 'set_alarm',
    description: 'Set a wake-up alarm (Wecker) at a local date and time.',
    parameters: {
      type: 'object',
      properties: {
        datetime: { type: 'string', description: 'Local time as YYYY-MM-DDTHH:MM.' },
        label: { type: 'string', description: 'Optional label.' },
        repeat: { type: 'string', enum: [...RECUR], description: 'Repeat rule. Default none.' },
      },
      required: ['datetime'],
    },
    run: async (a, env) => {
      const due = parseLocalDateTime(a.datetime)
      if (!due) return fail('datetime must be YYYY-MM-DDTHH:MM')
      if (due.getTime() < env.now.getTime() - 60_000) return fail(`datetime ${localIso(due)} is in the past`)
      const recur = a.repeat === 'daily' || a.repeat === 'weekly' ? a.repeat : null
      const title = str(a.label).slice(0, 60) || 'Wecker'
      const row = await addReminder({
        title,
        due_at: due.toISOString(),
        conversationId: env.conversationId,
        kind: 'alarm',
        recur,
        weekday: recur === 'weekly' ? due.getDay() : null,
      })
      const rings = await scheduleReminderRow(row, title, due, 'alarm')
      return {
        ok: true,
        agent: 'alarm',
        preview: `${title} · ${whenLabel(due, env.now)}`,
        data: `Alarm set for ${localIso(due)}${recur ? ` (${recur})` : ''}. Notification ${rings ? 'scheduled' : 'NOT allowed by the system'}.`,
      }
    },
  },
  {
    name: 'add_todo',
    description: 'Add a task to the user\'s todo list, optionally with a due date.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The task, short German phrase.' },
        due_date: { type: 'string', description: 'Optional YYYY-MM-DD.' },
        due_time: { type: 'string', description: 'Optional HH:MM, only together with due_date.' },
      },
      required: ['title'],
    },
    run: async (a, env) => {
      const title = str(a.title).slice(0, 160)
      if (!title) return fail('title is empty')
      const date = parseLocalDate(a.due_date) ? str(a.due_date) : null
      const time = date && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(str(a.due_time)) ? str(a.due_time) : null
      const row = await addTodo(title, env.conversationId, { deadlineDate: date, deadlineTime: time })
      return {
        ok: true,
        agent: 'todo',
        preview: `${row.title}${date ? ` · bis ${date}` : ''}`,
        data: `Todo added: "${row.title}"${date ? ` due ${date}${time ? ` ${time}` : ''}` : ''}.`,
      }
    },
  },
  {
    name: 'list_todos',
    description: 'Read the open todos.',
    parameters: { type: 'object', properties: {} },
    run: async () => {
      const open = (await listTodos()).filter((t) => t.status !== 'done').slice(0, 30)
      return {
        ok: true,
        agent: 'todo',
        data: open.length
          ? `Open todos:\n${open.map((t) => `- ${t.title}${t.deadline_date ? ` (due ${t.deadline_date})` : ''}`).join('\n')}`
          : 'No open todos.',
      }
    },
  },
  {
    name: 'add_shopping_items',
    description: 'Put one or more items on the shopping list (Einkaufsliste). Split "Milch, Eier und Brot" into three items.',
    parameters: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { type: 'string' }, description: 'Items, each a short German noun phrase.' },
      },
      required: ['items'],
    },
    run: async (a, env) => {
      const items = (Array.isArray(a.items) ? a.items : [a.items]).map(str).filter((s) => s.length >= 2 && s.length <= 60).slice(0, 20)
      if (!items.length) return fail('no items')
      for (const item of items) await addShopping(item, { conversationId: env.conversationId })
      return { ok: true, agent: 'shopping', preview: items.join(', '), data: `Added to shopping list: ${items.join(', ')}.` }
    },
  },
  {
    name: 'add_note',
    description: 'Save a free-form note (Notiz) for later.',
    parameters: {
      type: 'object',
      properties: { text: { type: 'string', description: 'The note text.' } },
      required: ['text'],
    },
    run: async (a, env) => {
      const text = str(a.text).slice(0, 2000)
      if (!text) return fail('text is empty')
      await addNote(text, env.conversationId)
      return { ok: true, agent: 'todo', preview: text.slice(0, 60), data: 'Note saved.' }
    },
  },
  {
    name: 'remember_fact',
    description:
      'Store a lasting personal fact or preference about the user in long-term memory (name, job, favourite food, family, car, habits). Only when the user states it about themselves or asks to remember it.',
    parameters: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Short German key, e.g. "lieblingsessen", "auto", "schwester".' },
        value: { type: 'string', description: 'The fact in German.' },
        category: { type: 'string', enum: ['fact', 'pref', 'work'], description: 'fact, pref (preference) or work.' },
      },
      required: ['key', 'value'],
    },
    run: async (a, env) => {
      const key = str(a.key).toLowerCase().slice(0, 40)
      const value = str(a.value).slice(0, 300)
      if (!key || !value) return fail('key and value required')
      const category = a.category === 'pref' || a.category === 'work' ? a.category : 'fact'
      const w = await brainProposeWrite(
        { key, value, category, conversationId: env.conversationId, origin: 'user', spoken: env.text },
        { agentId: 'memory' },
      )
      return w.stored
        ? { ok: true, agent: 'memory', preview: value, data: `Remembered ${key}: ${value}.` }
        : fail(`memory gate rejected it (${w.action})`)
    },
  },
  {
    name: 'recall_memory',
    description: 'Search the user\'s own stored data: memory, notes, past chats, ideas, documents. Use before saying you do not know something personal.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'What to look for, German keywords.' } },
      required: ['query'],
    },
    run: async (a) => {
      const q = str(a.query)
      if (!q) return fail('query is empty')
      const found = await brainRead(q, { agentId: 'tool-agent', cap: 8 })
      return { ok: true, agent: 'recall', data: found ? found.slice(0, MAX_TOOL_DATA) : 'Nothing stored about that.' }
    },
  },
  {
    name: 'web_search',
    description:
      'Search the internet for current or factual information (news, prices, opening hours, people, sports results, how-tos, anything you are not sure about). Returns titles, URLs and snippets.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search query, German or English.' } },
      required: ['query'],
    },
    run: async (a) => {
      const q = str(a.query).slice(0, 160)
      if (!q) return fail('query is empty')
      const research = await fillResearchLinks(q, '', undefined)
      const sources = (research.sources || []).filter((s) => s.url).slice(0, 8)
      if (!sources.length) return fail('no results')
      const lines = sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.url}\n${(s.snippet || '').slice(0, 320)}`)
      return { ok: true, agent: 'research', research, data: lines.join('\n\n').slice(0, MAX_TOOL_DATA) }
    },
  },
  {
    name: 'read_webpage',
    description: 'Open a web page and read its text. Use after web_search when the snippets are not enough.',
    parameters: {
      type: 'object',
      properties: { url: { type: 'string', description: 'Absolute http(s) URL.' } },
      required: ['url'],
    },
    run: async (a) => {
      const url = str(a.url)
      if (!/^https?:\/\/[^\s]+$/i.test(url)) return fail('url must start with http(s)://')
      try {
        const { status, text } = await getText(url, {
          Accept: 'text/html,text/plain',
          'User-Agent': `Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 ${USER_AGENT}`,
        })
        if (status < 200 || status >= 400 || !text) return fail(`HTTP ${status}`)
        const now = new Date().toISOString()
        const body = htmlToText(text)
        const source: ResearchSource = { title: body.split('\n')[0].slice(0, 90) || url, url, snippet: body.slice(0, 280), provider: 'page', retrieved_at: now }
        return { ok: true, agent: 'research', research: { used: true, query: url, sources: [source] } as ResearchMeta, data: body }
      } catch (err) {
        return fail(err instanceof Error ? err.message : 'page not reachable')
      }
    },
  },
  {
    name: 'run_ultron_command',
    description:
      'Run one of Ultron\'s built-in skills by writing the request as a short, plain German command, exactly as a user would say it. Skills: TV/Fernseher (an/aus, App, Lautstärke, YouTube), Steckdosen/Licht, Ventilator, Spotify/Musik, PC steuern, Navigation/Route/Fahrmodus, Tankstellen-Preise, Orte in der Nähe, ÖPNV/Abfahrten, Wetter, Unwetterwarnungen, Nachrichten, Bundesliga, Wechselkurse, Feiertage, Schulferien, Rezepte/Kochen, Filme/Watchliste, Briefing/Tagesüberblick, Gesetze, Flüge, Sternhimmel, Blitzer, Einstellungen/Overlays öffnen, Projektplanung, Schach, Yu-Gi-Oh-Duell. Prefer the dedicated tools above for reminders, calendar, todos, shopping, search and memory. One command per call.',
    parameters: {
      type: 'object',
      properties: { command: { type: 'string', description: 'German command, e.g. "Mach den Fernseher an" or "Wetter morgen in Köln".' } },
      required: ['command'],
    },
    run: async (a, env) => {
      const command = str(a.command).slice(0, 200)
      if (!command) return fail('command is empty')
      if (!env.runCommand) return fail('skills not available here')
      const out = await env.runCommand(command)
      if (out.pending) return { ok: true, pending: true, agent: out.agent, preview: command, data: out.reply.slice(0, MAX_TOOL_DATA) }
      if (!out.ok) return fail(out.reply || 'no skill understood that command, rephrase it more simply')
      return { ok: true, agent: out.agent, preview: command, data: out.reply.slice(0, MAX_TOOL_DATA) }
    },
  },
]

export function toolByName(name: string): AgentTool | undefined {
  return AGENT_TOOLS.find((t) => t.name === name)
}

const TOOL_LABELS: Record<string, string> = {
  create_reminder: 'Erinnerung',
  create_calendar_event: 'Termin',
  list_agenda: 'Kalender',
  set_timer: 'Timer',
  set_alarm: 'Wecker',
  add_todo: 'Todo',
  list_todos: 'Todos',
  add_shopping_items: 'Einkauf',
  add_note: 'Notiz',
  remember_fact: 'Gedächtnis',
  recall_memory: 'Erinnern',
  web_search: 'Suche',
  read_webpage: 'Webseite',
  run_ultron_command: 'Skill',
}

export function toolLabel(name: string): string {
  return TOOL_LABELS[name] || name
}

/* ---------- Prompt ---------- */

export function nowLine(now: Date): string {
  const tz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin'
    } catch {
      return 'Europe/Berlin'
    }
  })()
  const wd = now.toLocaleDateString('de-DE', { weekday: 'long' })
  return `Current local time: ${wd}, ${localIso(now)} (${tz}).`
}

export function agentSystemPrompt(env: { now: Date; memory?: string; working?: string; place?: string; lastStep?: string }): string {
  return [
    'You are Ultron, the personal assistant on the user\'s phone. You speak German and address the user with "Sie".',
    'Understand what the user wants from context, even if it is phrased casually, indirectly or with typos, and act on it with the tools.',
    'Rules:',
    '- If a tool can do or check what the user wants, call it. Do not ask for permission for normal tasks; just do them and report.',
    '- Several tools may be needed: e.g. search first, then create the event with what you found. Call independent tools in parallel.',
    '- Resolve relative dates ("morgen", "nächsten Freitag", "in 3 Stunden", "übermorgen früh") from the current local time below. "früh/morgens" = 08:00, "mittags" = 12:00, "nachmittags" = 15:00, "abends" = 19:00, "nachts" = 22:00 unless said otherwise.',
    '- Ask one short question only if a required detail is truly missing and cannot be inferred (never ask for a time when a sensible default exists).',
    '- Never claim an action that no tool confirmed. If a tool returns ERROR, say plainly what did not work.',
    '- For facts that can change or that you are unsure about, use web_search and answer from the results; mention the source name briefly.',
    '- Do not use tools for pure chit-chat, opinions, jokes or general knowledge you are sure about. Then answer directly without tools.',
    '- Final answer: German, 1-3 calm complete sentences, no Markdown, no lists unless the user asked for a list, no "Gerne".',
    nowLine(env.now),
    env.place ? `Last known place: ${env.place}.` : '',
    env.lastStep ? `Previous action in this chat: ${env.lastStep}. Words like "das", "verschieb es", "nochmal" may refer to it.` : '',
    env.memory || '',
    env.working || '',
  ]
    .filter(Boolean)
    .join('\n')
}

/* ---------- Provider-Schleifen ---------- */

type ToolCall = { id: string; name: string; args: Record<string, unknown> }
type StepResult = { calls: ToolCall[]; text: string } | null

export type ToolAgentResult = {
  reply: string
  usedTools: Array<{ name: string; ok: boolean; preview?: string; pending?: boolean }>
  lastAgent: string
  research?: ResearchMeta
  via: 'groq' | 'gemini'
}

let progressSink: ((line: string) => void) | null = null

/** Der Chat setzt das für die Dauer eines Zuges, damit der erste Satz sofort erscheint. */
export function setToolProgress(sink: ((line: string) => void) | null): void {
  progressSink = sink
}

export function toolProgressLine(name: string): string {
  if (name === 'web_search' || name === 'read_webpage') return 'Ich schaue nach.'
  if (name === 'recall_memory') return 'Ich erinnere mich.'
  if (name === 'list_agenda' || name === 'list_todos') return 'Ich schaue nach.'
  if (name === 'run_ultron_command') return 'Einen Moment.'
  return 'Ich kümmere mich darum.'
}

type HistoryMsg = { role: 'user' | 'assistant'; content: string }

function parseArgs(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>
  if (typeof raw !== 'string' || !raw.trim()) return {}
  try {
    const v = JSON.parse(raw) as unknown
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/** Groq (OpenAI-kompatibel): Modelle, die eigene Werkzeuge zuverlässig aufrufen. */
// Parallel-fähige Modelle zuerst. gpt-oss-20b und gpt-oss-120b können keine parallelen Werkzeugaufrufe.
const GROQ_TOOL_MODELS = ['llama-3.3-70b-versatile', 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b']

export function groqToolModels(skipRaw: string): string[] {
  const skip = parseSkipMap(skipRaw)
  return [...GROQ_TOOL_MODELS.filter((m) => !skip[m]), ...GROQ_TOOL_MODELS.filter((m) => skip[m])]
}

function groqTools() {
  return AGENT_TOOLS.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }))
}

function makeGroqStepper(system: string, history: HistoryMsg[], user: string) {
  const key = loadSettings().groq_api_key.trim()
  const messages: Array<Record<string, unknown>> = [
    { role: 'system', content: system },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: user },
  ]
  let models = groqToolModels(loadSettings().groq_skip_until)
  const step = async (final: boolean): Promise<StepResult> => {
    while (models.length) {
      if (isTurnAborted()) return null
      const model = models[0]
      try {
        const { status, json, headers } = await postJson(
          'https://api.groq.com/openai/v1/chat/completions',
          { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          {
            model,
            messages,
            tools: groqTools(),
            tool_choice: final ? 'none' : 'auto',
            temperature: 0.2,
            max_tokens: 900,
            ...groqChatExtras(model),
          },
          15_000,
        )
        noteQuotaHeaders('groq', headers)
        const body = json as { choices?: Array<{ message?: Record<string, unknown> }>; error?: { message?: string; code?: string } }
        const errMsg = body.error?.message || ''
        if (isFatalAuth(status, errMsg, String(body.error?.code || ''))) return null
        if (isUnknownModel(status, errMsg, String(body.error?.code || ''))) {
          saveSettings({ groq_skip_until: markSkip(loadSettings().groq_skip_until, model) })
          models = models.slice(1)
          continue
        }
        if (status === 429) {
          models = models.slice(1)
          continue
        }
        if (status < 200 || status >= 300) {
          models = models.slice(1)
          continue
        }
        const msg = body.choices?.[0]?.message || {}
        const rawCalls = Array.isArray(msg.tool_calls) ? (msg.tool_calls as Array<Record<string, unknown>>) : []
        const calls: ToolCall[] = rawCalls.map((c, i) => {
          const fn = (c.function || {}) as { name?: string; arguments?: unknown }
          return { id: String(c.id || `call_${i}`), name: String(fn.name || ''), args: parseArgs(fn.arguments) }
        })
        messages.push({
          role: 'assistant',
          content: typeof msg.content === 'string' ? msg.content : '',
          ...(rawCalls.length ? { tool_calls: rawCalls } : {}),
        })
        return { calls, text: typeof msg.content === 'string' ? msg.content.trim() : '' }
      } catch {
        if (isTurnAborted()) return null
        models = models.slice(1)
      }
    }
    return null
  }
  const answer = (call: ToolCall, data: string) => {
    messages.push({ role: 'tool', tool_call_id: call.id, content: data })
  }
  return { step, answer }
}

/** Gemini will OpenAPI-Typen in Großbuchstaben. */
export function toGeminiSchema(s: JsonSchema): Record<string, unknown> {
  const out: Record<string, unknown> = { type: s.type.toUpperCase() }
  if (s.description) out.description = s.description
  if (s.enum) out.enum = s.enum
  if (s.items) out.items = toGeminiSchema(s.items)
  if (s.properties) {
    const props = Object.entries(s.properties)
    if (props.length) {
      out.properties = Object.fromEntries(props.map(([k, v]) => [k, toGeminiSchema(v)]))
      if (s.required?.length) out.required = s.required
    }
  }
  return out
}

function makeGeminiStepper(system: string, history: HistoryMsg[], user: string) {
  const key = loadSettings().gemini_api_key.trim()
  const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [
    ...history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: user }] },
  ]
  const declarations = AGENT_TOOLS.map((t) => {
    const params = toGeminiSchema(t.parameters)
    return params.properties
      ? { name: t.name, description: t.description, parameters: params }
      : { name: t.name, description: t.description }
  })
  let models = geminiModelOrder(loadSettings().gemini_skip_until)
  let pending: Array<Record<string, unknown>> = []
  const step = async (final: boolean): Promise<StepResult> => {
    if (pending.length) {
      contents.push({ role: 'user', parts: pending })
      pending = []
    }
    while (models.length) {
      if (isTurnAborted()) return null
      const model = models[0]
      try {
        const { status, json } = await postJson(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          {
            systemInstruction: { parts: [{ text: system }] },
            contents,
            tools: [{ functionDeclarations: declarations }],
            toolConfig: { functionCallingConfig: { mode: final ? 'NONE' : 'AUTO' } },
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 900,
              ...(model.includes('2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            },
          },
          18_000,
        )
        const body = json as {
          candidates?: Array<{ content?: { role?: string; parts?: Array<Record<string, unknown>> } }>
          error?: { message?: string; status?: string }
        }
        const errMsg = body.error?.message || ''
        if (isFatalAuth(status, errMsg, body.error?.status || '')) return null
        if (isUnknownModel(status, errMsg, body.error?.status || '')) {
          saveSettings({ gemini_skip_until: markSkip(loadSettings().gemini_skip_until, model) })
          models = models.slice(1)
          continue
        }
        if (status === 429) {
          models = models.slice(1)
          continue
        }
        if (status < 200 || status >= 300) {
          models = models.slice(1)
          continue
        }
        const parts = body.candidates?.[0]?.content?.parts || []
        contents.push({ role: 'model', parts })
        const calls: ToolCall[] = []
        let text = ''
        parts.forEach((p, i) => {
          const fc = p.functionCall as { name?: string; args?: unknown; id?: string } | undefined
          if (fc?.name) calls.push({ id: fc.id || `${fc.name}_${i}`, name: fc.name, args: parseArgs(fc.args) })
          else if (typeof p.text === 'string' && !p.thought) text += p.text
        })
        return { calls, text: text.trim() }
      } catch {
        if (isTurnAborted()) return null
        models = models.slice(1)
      }
    }
    return null
  }
  const answer = (call: ToolCall, data: string) => {
    pending.push({ functionResponse: { name: call.name, ...(call.id && !call.id.startsWith(`${call.name}_`) ? { id: call.id } : {}), response: { result: data } } })
  }
  return { step, answer }
}

export function toolAgentReady(): boolean {
  const s = loadSettings()
  if (!s.tool_agent) return false
  return (groqReady() && !quotaBlocked('groq')) || (geminiReady() && !quotaBlocked('gemini'))
}

function providerOrder(): Array<'groq' | 'gemini'> {
  const s = loadSettings()
  const groq = groqReady() && !quotaBlocked('groq')
  const gemini = geminiReady() && !quotaBlocked('gemini')
  const order: Array<'groq' | 'gemini'> = s.brain_primary === 'gemini' ? ['gemini', 'groq'] : ['groq', 'gemini']
  return order.filter((p) => (p === 'groq' ? groq : gemini))
}

/**
 * Ein Zug mit freier Werkzeugwahl. `null` heißt: das Modell wollte kein
 * Werkzeug — dann antwortet der normale, gestreamte Chat-Weg mit Persona,
 * Gedächtnis und Recherche-Logik.
 */
export async function runToolAgent(env: ToolEnv, history: HistoryMsg[] = []): Promise<ToolAgentResult | null> {
  if (!toolAgentReady()) return null
  const s = loadSettings()
  const mem = await listMemory().catch(() => [])
  const system = agentSystemPrompt({
    now: env.now,
    memory: memoryBlock(mem, env.text, []),
    working: workingBlock(),
    place: s.last_place || '',
    lastStep: s.last_step_tool ? `${s.last_step_tool}${s.last_step_title ? ` (${s.last_step_title})` : ''}` : '',
  })
  for (const provider of providerOrder()) {
    const t0 = performance.now()
    const stepper = provider === 'groq' ? makeGroqStepper(system, history, env.text) : makeGeminiStepper(system, history, env.text)
    const used: ToolAgentResult['usedTools'] = []
    let lastAgent = ''
    let research: ResearchMeta | undefined
    let reply = ''
    let failedProvider = false
    let announced = false
    for (let stepNo = 0; stepNo <= MAX_STEPS; stepNo++) {
      const out = await stepper.step(stepNo === MAX_STEPS)
      if (isTurnAborted()) return null
      if (!out) {
        failedProvider = true
        break
      }
      const calls = out.calls.filter((c) => c.name)
      if (!calls.length) {
        reply = out.text
        break
      }
      if (!announced) {
        announced = true
        const line = toolProgressLine(calls[0].name)
        progressSink?.(line)
        env.onProgress?.(line)
      }
      const results = await Promise.all(
        calls.map(async (call) => {
          const tool = toolByName(call.name)
          const c0 = performance.now()
          let res: ToolOutcome
          try {
            res = tool ? await tool.run(call.args, env) : fail(`unknown tool ${call.name}`)
          } catch (err) {
            res = fail(err instanceof Error ? err.message : 'tool crashed')
          }
          pushAgentTrace({
            agentId: 'tool-agent',
            phase: 'execute',
            ms: Math.round(performance.now() - c0),
            ok: res.ok,
            detail: `${call.name} ${JSON.stringify(call.args).slice(0, 120)}`,
          })
          return { call, res }
        }),
      )
      for (const { call, res } of results) {
        stepper.answer(call, res.data.slice(0, MAX_TOOL_DATA))
        used.push({ name: call.name, ok: res.ok, preview: res.preview, pending: res.pending })
        if (res.ok && res.agent) lastAgent = res.agent
        if (res.research?.sources?.length) {
          research = research
            ? { ...research, sources: [...(research.sources || []), ...res.research.sources] }
            : res.research
        }
      }
    }
    pushAgentTrace({
      agentId: 'tool-agent',
      phase: 'plan',
      ms: Math.round(performance.now() - t0),
      ok: !failedProvider,
      detail: `${provider}: ${used.map((u) => u.name).join(', ') || 'kein Werkzeug'}`,
    })
    if (failedProvider && !used.length) continue
    if (!used.length) return null
    if (used.some((u) => u.pending)) {
      const ask = used.find((u) => u.pending)?.preview
      const confirm = ask ? `Verstanden als „${ask}". Soll ich?` : 'Soll ich das ausführen?'
      reply = reply && !/soll ich/i.test(reply) ? `${reply} ${confirm}` : reply || confirm
    } else if (!reply) {
      const okOnes = used.filter((u) => u.ok)
      reply = okOnes.length
        ? `Erledigt: ${okOnes.map((u) => u.preview || toolLabel(u.name)).join('; ')}.`
        : 'Das hat nicht geklappt. Ich habe nichts geändert.'
    }
    return { reply, usedTools: used, lastAgent, research, via: provider }
  }
  return null
}

export function toolMetaFor(result: ToolAgentResult): ToolMeta {
  const ok = result.usedTools.filter((u) => u.ok)
  const waiting = result.usedTools.some((u) => u.pending)
  const labels = [...new Set(result.usedTools.map((u) => toolLabel(u.name)))]
  return {
    tool_status: waiting ? 'pending' : ok.length ? 'executed' : 'error',
    tool: result.lastAgent || 'tool-agent',
    action: 'agent',
    label: labels.join(' · '),
    preview: ok.map((u) => u.preview).filter(Boolean).join(' · ') || undefined,
    result: { tools: result.usedTools.map((u) => u.name), via: result.via },
  }
}

/** Die letzten Chatzeilen ohne den aktuellen Satz, gekürzt. */
export async function recentHistory(conversationId: string, text: string, n = 6): Promise<HistoryMsg[]> {
  const rows = await listMessages(conversationId).catch(() => [])
  const trimmed = rows.slice(-(n + 1))
  const last = trimmed[trimmed.length - 1]
  const body = last && last.role === 'user' && last.content.trim() === text.trim() ? trimmed.slice(0, -1) : trimmed.slice(-n)
  return body
    .filter((m) => m.content && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content.slice(0, 600) }) as HistoryMsg)
}

export function toolEnvFromCtx(ctx: RouteCtx, runCommand?: ToolEnv['runCommand']): ToolEnv {
  return { conversationId: ctx.conversationId, text: ctx.text, now: new Date(), runCommand }
}
