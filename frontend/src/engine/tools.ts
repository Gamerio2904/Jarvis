import {
  addNote,
  addTodo,
  clearPending,
  createTodoList,
  deleteDoneTodos,
  deleteNote,
  deleteTodo,
  getPending,
  listNotes,
  listTodoLists,
  listTodos,
  persistLastList,
  setPending,
  setTodoStatus,
  updateNote,
  updateTodo,
  type Note,
  type Todo,
  type ToolPending,
} from './store.ts'
import { parseToolIntent } from './tools-parse.ts'
import type { ToolIntent } from './tools-parse.ts'

export type { ToolIntent } from './tools-parse.ts'
export { parseToolIntent } from './tools-parse.ts'

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

function exactOrContains<T extends { id: string }>(rows: T[], query: string, text: (row: T) => string): T[] {
  const q = query.trim().toLocaleLowerCase()
  if (!q) return []
  const normalized = rows.map((row) => ({ row, value: text(row).toLocaleLowerCase() }))
  const exact = normalized.filter((item) => item.value === q)
  return (exact.length ? exact : normalized.filter((item) => item.value.includes(q) || q.includes(item.value)))
    .map((item) => item.row)
}

function pendingRow(conversationId: string, tool: string, action: string, args: Record<string, unknown>, preview: string): ToolPending {
  return { conversation_id: conversationId, tool, action, args, preview, created_at: new Date().toISOString() }
}

async function noteTargets(query: string): Promise<Note[]> {
  return exactOrContains(await listNotes(), query, (note) => note.body)
}

async function todoTargets(query: string, listId?: string): Promise<Todo[]> {
  return exactOrContains((await listTodos()).filter((todo) => !listId || (todo.list_id || 'todo-list-general') === listId), query, (todo) => todo.title)
}

function emitOpen(name: 'notes' | 'todos', detail?: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(`jarvis-open-${name}`, { detail }))
}

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
      tool: { tool_status: 'aborted', tool: pending.tool, action: pending.action, label: 'Tool abgelehnt' },
    }
  }

  const intent = parseToolIntent(text)
  if (!intent) return { handled: false }
  return handleIntent(conversationId, intent)
}

async function handleIntent(conversationId: string, intent: ToolIntent): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta }> {
  if (intent.kind === 'todo_list_create') {
    const list = await createTodoList(intent.name)
    emitOpen('todos', list.id)
    return { handled: true, reply: `Todo-Liste „${list.name}“ ist bereit.` }
  }

  if (intent.kind === 'todo_list_open') {
    const lists = await listTodoLists()
    const matches = exactOrContains(lists, intent.name, (list) => list.name)
    if (matches.length !== 1) return { handled: true, reply: matches.length ? `Welche Liste meinst du: ${matches.map((list) => list.name).join(', ')}?` : `Die Todo-Liste „${intent.name}“ gibt es nicht.` }
    emitOpen('todos', matches[0].id)
    return { handled: true, reply: `Öffne die Todo-Liste „${matches[0].name}“.` }
  }

  if (intent.kind === 'todo_due') {
    const todos = (await listTodos()).filter((todo) =>
      todo.status === 'open' && Boolean(todo.deadline_date) && (todo.deadline_date || '') <= intent.through,
    )
    if (!todos.length) return { handled: true, reply: `Bis ${intent.through} ist keine offene Aufgabe mit Deadline fällig.` }
    const lists = await listTodoLists()
    const listNames = new Map(lists.map((list) => [list.id, list.name]))
    const today = new Date()
    const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const lines = todos
      .sort((a, b) => (a.deadline_date || '').localeCompare(b.deadline_date || ''))
      .map((todo, index) => {
        const date = todo.deadline_date || ''
        const overdue = date < todayText ? ' (überfällig)' : ''
        return `${index + 1}. ${todo.title} — ${listNames.get(todo.list_id || 'todo-list-general') || 'Allgemein'}, ${date}${todo.deadline_time ? ` ${todo.deadline_time}` : ''}${overdue}`
      })
    return { handled: true, reply: `Fällig ${intent.label}:\n${lines.join('\n')}` }
  }

  if (intent.kind === 'todo_create') {
    const lists = await listTodoLists()
    const matches = intent.listName ? exactOrContains(lists, intent.listName, (list) => list.name) : []
    if (intent.listName && matches.length !== 1) {
      return { handled: true, reply: matches.length ? `Welche Liste meinst du: ${matches.map((list) => list.name).join(', ')}?` : `Die Todo-Liste „${intent.listName}“ gibt es nicht.` }
    }
    const list = matches[0] || lists.find((row) => row.id === 'todo-list-general')
    if (!list) throw new Error('Die Standard-Todo-Liste Allgemein fehlt.')
    const open = (await listTodos()).filter((todo) => todo.status === 'open')
    if (open.some((todo) => (todo.list_id || 'todo-list-general') === list.id && todo.title.toLocaleLowerCase() === intent.title.toLocaleLowerCase())) {
      return { handled: true, reply: `„${intent.title}“ steht in „${list.name}“ schon offen.`, tool: { tool_status: 'duplicate', tool: 'todo', action: 'create', label: 'Todo schon offen' } }
    }
    const row = pendingRow(conversationId, 'todo', 'create', {
      title: intent.title,
      listId: list.id,
      deadlineDate: intent.deadlineDate || null,
      deadlineTime: intent.deadlineTime || null,
    }, `Todo anlegen: ${intent.title}`)
    await setPending(row)
    return {
      handled: true,
      reply: `Todo „${intent.title}“${intent.deadlineDate ? ` mit Deadline ${intent.deadlineDate}${intent.deadlineTime ? ` ${intent.deadlineTime}` : ''}` : ''} in „${list.name}“ anlegen?`,
      tool: { tool_status: 'pending', tool: 'todo', action: 'create', preview: row.preview, label: 'Tool bereit — Confirm?' },
    }
  }

  if (intent.kind === 'todo_update') {
    const hits = await todoTargets(intent.query)
    if (hits.length !== 1) return { handled: true, reply: hits.length ? `Welches Todo meinst du: ${hits.map((todo) => todo.title).join(', ')}?` : `Kein Todo zu „${intent.query}“.` }
    const todo = hits[0]
    await updateTodo(todo.id, {
      ...(intent.title ? { title: intent.title } : {}),
      ...(intent.deadlineDate !== undefined ? { deadlineDate: intent.deadlineDate, deadlineTime: intent.deadlineTime || null } : {}),
    })
    return { handled: true, reply: `Todo aktualisiert: ${intent.title || todo.title}${intent.deadlineDate ? ` — Deadline ${intent.deadlineDate}${intent.deadlineTime ? ` ${intent.deadlineTime}` : ''}` : ''}.` }
  }

  if (intent.kind === 'note_create') {
    const note = await addNote(intent.body, conversationId)
    return { handled: true, reply: `Notiz gespeichert: ${note.body}`, tool: { tool_status: 'executed', tool: 'notes', action: 'create', label: 'Notiz gespeichert', preview: note.body } }
  }

  if (intent.kind === 'note_update') {
    const hits = await noteTargets(intent.query)
    if (hits.length !== 1) return { handled: true, reply: hits.length ? `Welche Notiz meinst du: ${hits.map((note) => note.body.slice(0, 100)).join(' · ')}?` : `Keine Notiz zu „${intent.query}“.` }
    await updateNote(hits[0].id, intent.body)
    return { handled: true, reply: 'Notiz aktualisiert.' }
  }

  if (intent.kind === 'note_delete') {
    const hits = await noteTargets(intent.query)
    if (hits.length !== 1) return { handled: true, reply: hits.length ? `Welche Notiz meinst du: ${hits.map((note) => note.body.slice(0, 100)).join(' · ')}?` : `Keine Notiz zu „${intent.query}“.` }
    const note = hits[0]
    const row = pendingRow(conversationId, 'notes', 'delete', { id: note.id }, `Notiz löschen: ${note.body.slice(0, 120)}`)
    await setPending(row)
    return { handled: true, reply: `Diese Notiz löschen: „${note.body.slice(0, 120)}“? Bitte Ja oder Nein.`, tool: { tool_status: 'pending', tool: 'notes', action: 'delete', preview: row.preview, label: 'Löschen bestätigen' } }
  }

  if (intent.kind === 'note_list') {
    emitOpen('notes')
    const notes = await listNotes()
    if (!notes.length) return { handled: true, reply: 'Keine Notizen.' }
    return { handled: true, reply: notes.map((note, index) => `${index + 1}. ${note.body}`).join('\n') }
  }

  if (intent.kind === 'todo_cleanup') {
    const row = pendingRow(conversationId, 'todo', 'cleanup', {}, 'Erledigte Todos löschen')
    await setPending(row)
    return { handled: true, reply: 'Erledigte Todos wirklich löschen?', tool: { tool_status: 'pending', tool: 'todo', action: 'cleanup', preview: row.preview, label: 'Tool bereit — Confirm?' } }
  }

  if (intent.kind === 'todo_delete_last' || intent.kind === 'todo_delete') {
    const open = (await listTodos()).filter((todo) => todo.status === 'open')
    const hits = intent.kind === 'todo_delete_last'
      ? [...open].sort((a, b) => a.created_at < b.created_at ? 1 : -1).slice(0, 1)
      : await todoTargets(intent.query)
    if (!hits.length) return { handled: true, reply: intent.kind === 'todo_delete_last' ? 'Kein offenes Todo zum Löschen.' : `Kein Todo zu „${intent.query}“.` }
    if (hits.length !== 1) return { handled: true, reply: `Welches Todo meinst du: ${hits.map((todo) => todo.title).join(', ')}?` }
    const hit = hits[0]
    const row = pendingRow(conversationId, 'todo', 'delete', { id: hit.id }, `Todo löschen: ${hit.title}`)
    await setPending(row)
    return { handled: true, reply: `Todo „${hit.title}“ wirklich löschen? Bitte Ja oder Nein.`, tool: { tool_status: 'pending', tool: 'todo', action: 'delete', label: 'Löschen bestätigen', preview: row.preview } }
  }

  if (intent.kind === 'todo_done_first') {
    const open = (await listTodos()).filter((todo) => todo.status === 'open').sort((a, b) => a.created_at < b.created_at ? -1 : 1)
    if (!open.length) return { handled: true, reply: 'Kein offenes Todo.' }
    await setTodoStatus(open[0].id, 'done')
    return { handled: true, reply: `Erledigt: ${open[0].title}.`, tool: { tool_status: 'executed', tool: 'todo', action: 'done', label: 'Todo erledigt', preview: open[0].title } }
  }

  if (intent.kind === 'todo_list') {
    const lists = await listTodoLists()
    const matched = intent.listName ? exactOrContains(lists, intent.listName, (list) => list.name) : []
    if (intent.listName && matched.length !== 1) return { handled: true, reply: matched.length ? `Welche Liste meinst du: ${matched.map((list) => list.name).join(', ')}?` : `Die Todo-Liste „${intent.listName}“ gibt es nicht.` }
    const selected = matched[0]
    const open = (await listTodos()).filter((todo) => todo.status === 'open' && (!selected || (todo.list_id || 'todo-list-general') === selected.id))
    if (!open.length) return { handled: true, reply: selected ? `Keine offenen Todos in „${selected.name}“.` : 'Keine offenen Todos.' }
    const names = new Map(lists.map((list) => [list.id, list.name]))
    const sorted = open.sort((a, b) => a.created_at < b.created_at ? -1 : 1)
    const lines = sorted.map((todo, index) => `${index + 1}. ${todo.title}${selected ? '' : ` — ${names.get(todo.list_id || 'todo-list-general') || 'Allgemein'}`}`)
    persistLastList('todo', sorted.map((todo) => todo.title))
    return { handled: true, reply: `Offen:\n${lines.join('\n')}` }
  }

  return { handled: false }
}

async function execute(pending: ToolPending): Promise<{ reply: string }> {
  if (pending.tool === 'todo' && pending.action === 'create') {
    await addTodo(String(pending.args.title || ''), pending.conversation_id, {
      listId: String(pending.args.listId || 'todo-list-general'),
      deadlineDate: pending.args.deadlineDate ? String(pending.args.deadlineDate) : null,
      deadlineTime: pending.args.deadlineTime ? String(pending.args.deadlineTime) : null,
    })
    return { reply: `Notiert: ${pending.args.title}` }
  }
  if (pending.tool === 'todo' && pending.action === 'delete') {
    await deleteTodo(String(pending.args.id || ''))
    return { reply: `Todo gelöscht: ${pending.preview.replace(/^Todo löschen:\s*/, '')}.` }
  }
  if (pending.tool === 'notes' && pending.action === 'delete') {
    await deleteNote(String(pending.args.id || ''))
    return { reply: 'Notiz gelöscht.' }
  }
  if (pending.tool === 'todo' && pending.action === 'cleanup') {
    const count = await deleteDoneTodos()
    return { reply: count ? `${count} erledigte Todos weg.` : 'Nichts Erledigtes zum Löschen.' }
  }
  return { reply: 'Tool unklar.' }
}
