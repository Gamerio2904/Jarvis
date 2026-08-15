import { listPlugReply, parsePlugCommand, switchPlug, type PlugId } from './plugs'
import {
  addNote,
  addTodo,
  clearPending,
  deleteDoneTodos,
  getPending,
  listNotes,
  listTodos,
  setPending,
  setTodoStatus,
  type ToolPending,
} from './store'

export type ToolMeta = {
  tool_status?: string
  tool?: string
  action?: string
  preview?: string
  label?: string
  result?: Record<string, unknown>
  error?: string
}

const TODO_WRITE = /^\s*(?:todo|to-?do|aufgabe)(?![sS])\s*[:\-]?\s*(.+)$/is
const NOTE_WRITE = /^\s*(?:notiz(?:e)?|notiere|notiz:)\s*[:\-]?\s*(.+)$/is
const TODO_LIST = /\b(?:offene\s+)?todos?\b|\baufgaben\b/i
const TODO_CLEANUP = /\btodos?\s+aufräumen\b|\berledigte\s+todos?\s+löschen\b/i
const YES = /^\s*(ja|jo|yes|ok|okay|mach|passt)\s*[.!]?\s*$/i
const NO = /^\s*(nein|no|abbrechen|stopp|lass)\s*[.!]?\s*$/i

export async function handleTools(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta }> {
  const pending = await getPending(conversationId)
  if (pending && YES.test(text)) {
    const result = await execute(pending)
    await clearPending(conversationId)
    return {
      handled: true,
      reply: result.reply,
      tool: {
        tool_status: 'executed',
        tool: pending.tool,
        action: pending.action,
        label: 'Tool ausgeführt',
        preview: pending.preview,
      },
    }
  }
  if (pending && NO.test(text)) {
    await clearPending(conversationId)
    return {
      handled: true,
      reply: 'Okay, nicht gemacht.',
      tool: {
        tool_status: 'aborted',
        tool: pending.tool,
        action: pending.action,
        label: 'Tool abgelehnt',
      },
    }
  }

  const todoWrite = TODO_WRITE.exec(text)
  if (todoWrite) {
    const title = todoWrite[1].trim()
    const row: ToolPending = {
      conversation_id: conversationId,
      tool: 'todo',
      action: 'create',
      args: { title },
      preview: `Todo anlegen: ${title}`,
      created_at: new Date().toISOString(),
    }
    await setPending(row)
    return {
      handled: true,
      reply: `Todo „${title}“ anlegen?`,
      tool: {
        tool_status: 'pending',
        tool: 'todo',
        action: 'create',
        preview: row.preview,
        label: 'Tool bereit — Confirm?',
      },
    }
  }

  const noteWrite = NOTE_WRITE.exec(text)
  if (noteWrite) {
    const body = noteWrite[1].trim()
    const row: ToolPending = {
      conversation_id: conversationId,
      tool: 'notes',
      action: 'create',
      args: { body },
      preview: `Notiz: ${body}`,
      created_at: new Date().toISOString(),
    }
    await setPending(row)
    return {
      handled: true,
      reply: `Notiz speichern: „${body}“?`,
      tool: {
        tool_status: 'pending',
        tool: 'notes',
        action: 'create',
        preview: row.preview,
        label: 'Tool bereit — Confirm?',
      },
    }
  }

  if (TODO_CLEANUP.test(text)) {
    const row: ToolPending = {
      conversation_id: conversationId,
      tool: 'todo',
      action: 'cleanup',
      args: {},
      preview: 'Erledigte Todos löschen',
      created_at: new Date().toISOString(),
    }
    await setPending(row)
    return {
      handled: true,
      reply: 'Erledigte Todos wirklich löschen?',
      tool: {
        tool_status: 'pending',
        tool: 'todo',
        action: 'cleanup',
        preview: row.preview,
        label: 'Tool bereit — Confirm?',
      },
    }
  }

  if (/\boffene\s+todos?\b/i.test(text) || /^\s*todos?\??\s*$/i.test(text) || TODO_LIST.test(text) && /zeig|liste|offen/i.test(text)) {
    const todos = await listTodos(conversationId)
    const open = todos.filter((t) => t.status === 'open')
    if (!open.length) return { handled: true, reply: 'Keine offenen Todos in diesem Gespräch.' }
    const lines = open.map((t, i) => `${i + 1}. ${t.title}`).join('\n')
    return { handled: true, reply: `Offen:\n${lines}` }
  }

  if (/\bnotizen\b/i.test(text) && /zeig|liste/i.test(text)) {
    const notes = await listNotes(conversationId)
    if (!notes.length) return { handled: true, reply: 'Keine Notizen in diesem Gespräch.' }
    return {
      handled: true,
      reply: notes.map((n, i) => `${i + 1}. ${n.body}`).join('\n'),
    }
  }

  const plug = parsePlugCommand(text)
  if (plug?.kind === 'list') {
    return { handled: true, reply: listPlugReply() }
  }
  if (plug?.kind === 'switch') {
    const labels = plug.ids.map((id) => labelFor(id)).join(', ')
    const verb = plug.on ? 'einschalten' : 'ausschalten'
    const row: ToolPending = {
      conversation_id: conversationId,
      tool: 'plug',
      action: plug.on ? 'on' : 'off',
      args: { ids: plug.ids, on: plug.on },
      preview: `${labels} ${verb}`,
      created_at: new Date().toISOString(),
    }
    await setPending(row)
    return {
      handled: true,
      reply: `${labels} wirklich ${verb}?`,
      tool: {
        tool_status: 'pending',
        tool: 'plug',
        action: row.action,
        preview: row.preview,
        label: 'Steckdose — Confirm?',
      },
    }
  }

  return { handled: false }
}

function labelFor(id: PlugId): string {
  return id === 'pc' ? 'PC' : id === 'screen' ? 'Bildschirm' : 'LEDs'
}

async function execute(pending: ToolPending): Promise<{ reply: string }> {
  if (pending.tool === 'todo' && pending.action === 'create') {
    await addTodo(String(pending.args.title || ''), pending.conversation_id)
    return { reply: `Notiert: ${pending.args.title}` }
  }
  if (pending.tool === 'notes' && pending.action === 'create') {
    await addNote(String(pending.args.body || ''), pending.conversation_id)
    return { reply: `Notiz liegt. ${pending.args.body}` }
  }
  if (pending.tool === 'todo' && pending.action === 'cleanup') {
    const n = await deleteDoneTodos()
    return { reply: n ? `${n} erledigte Todos weg.` : 'Nichts Erledigtes zum Löschen.' }
  }
  if (pending.tool === 'todo' && pending.action === 'done') {
    await setTodoStatus(String(pending.args.id || ''), 'done')
    return { reply: 'Erledigt.' }
  }
  if (pending.tool === 'plug') {
    const ids = (pending.args.ids as PlugId[]) || []
    const on = Boolean(pending.args.on)
    const results = []
    for (const id of ids) {
      results.push(await switchPlug(id, on))
    }
    const ok = results.filter((r) => r.ok).map((r) => r.detail)
    const bad = results.filter((r) => !r.ok).map((r) => r.detail)
    if (!ok.length) return { reply: `Nicht geschaltet. ${bad.join('; ')}` }
    if (bad.length) return { reply: `${ok.join(', ')}. Daneben: ${bad.join('; ')}` }
    return { reply: ok.join(', ') + '.' }
  }
  return { reply: 'Tool unklar.' }
}
