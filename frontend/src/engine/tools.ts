import {
  addNote,
  addTodo,
  clearPending,
  deleteDoneTodos,
  deleteTodo,
  getPending,
  listNotes,
  listTodos,
  setPending,
  setTodoStatus,
  type ToolPending,
} from './store'
import { parseToolIntent } from './tools-parse'

export type { ToolIntent } from './tools-parse'
export { parseToolIntent } from './tools-parse'

export type ToolMeta = {
  tool_status?: string
  tool?: string
  action?: string
  preview?: string
  label?: string
  result?: Record<string, unknown>
  error?: string
}

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

  const intent = parseToolIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'todo_create') {
    const title = intent.title
    const open = (await listTodos()).filter((t) => t.status === 'open')
    const dup = open.find((t) => t.title.toLowerCase() === title.toLowerCase())
    if (dup) {
      return {
        handled: true,
        reply: `„${title}“ steht schon offen.`,
        tool: { tool_status: 'duplicate', tool: 'todo', action: 'create', label: 'Todo schon offen' },
      }
    }
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

  if (intent.kind === 'note_create') {
    const body = intent.body
    await addNote(body, conversationId)
    return {
      handled: true,
      reply: `Notiz liegt: ${body}`,
      tool: {
        tool_status: 'executed',
        tool: 'notes',
        action: 'create',
        label: 'Tool ausgeführt',
        preview: body,
      },
    }
  }

  if (intent.kind === 'todo_cleanup') {
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

  if (intent.kind === 'todo_delete_last' || intent.kind === 'todo_delete') {
    const open = (await listTodos()).filter((t) => t.status === 'open')
    const hit =
      intent.kind === 'todo_delete_last'
        ? [...open].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
        : open.find(
            (t) =>
              t.title.toLowerCase().includes(intent.query.toLowerCase()) ||
              intent.query.toLowerCase().includes(t.title.toLowerCase()),
          )
    if (!hit) {
      return {
        handled: true,
        reply:
          intent.kind === 'todo_delete_last'
            ? 'Kein offenes Todo zum Löschen.'
            : `Kein Todo zu „${intent.query}“.`,
      }
    }
    await deleteTodo(hit.id)
    return {
      handled: true,
      reply: `Todo weg: ${hit.title}.`,
      tool: { tool_status: 'executed', tool: 'todo', action: 'delete', label: 'Todo weg', preview: hit.title },
    }
  }

  if (intent.kind === 'todo_done_first') {
    const open = (await listTodos())
      .filter((t) => t.status === 'open')
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    if (!open.length) return { handled: true, reply: 'Kein offenes Todo.' }
    const first = open[0]
    await setTodoStatus(first.id, 'done')
    return {
      handled: true,
      reply: `Erledigt: ${first.title}.`,
      tool: {
        tool_status: 'executed',
        tool: 'todo',
        action: 'done',
        label: 'Tool ausgeführt',
        preview: first.title,
      },
    }
  }

  if (intent.kind === 'todo_list') {
    const todos = await listTodos()
    const open = todos.filter((t) => t.status === 'open')
    if (!open.length) return { handled: true, reply: 'Keine offenen Todos.' }
    const lines = open
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
      .map((t, i) => `${i + 1}. ${t.title}`)
      .join('\n')
    return { handled: true, reply: `Offen:\n${lines}` }
  }

  if (intent.kind === 'note_list') {
    const notes = await listNotes()
    if (!notes.length) return { handled: true, reply: 'Keine Notizen.' }
    return {
      handled: true,
      reply: notes.map((n, i) => `${i + 1}. ${n.body}`).join('\n'),
    }
  }

  return { handled: false }
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
  return { reply: 'Tool unklar.' }
}
