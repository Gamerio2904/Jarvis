export type ToolIntent =
  | { kind: 'todo_create'; title: string; listName?: string; deadlineDate?: string | null; deadlineTime?: string | null }
  | { kind: 'todo_list_create'; name: string }
  | { kind: 'todo_list_open'; name: string }
  | { kind: 'todo_due'; through: string; label: string }
  | { kind: 'todo_update'; query: string; title?: string; deadlineDate?: string | null; deadlineTime?: string | null }
  | { kind: 'note_create'; body: string }
  | { kind: 'note_update'; query: string; body: string }
  | { kind: 'note_delete'; query: string }
  | { kind: 'todo_list'; listName?: string }
  | { kind: 'note_list' }
  | { kind: 'todo_cleanup' }
  | { kind: 'todo_done_first' }
  | { kind: 'todo_delete'; query: string }
  | { kind: 'todo_delete_last' }

const TODO_WRITE = /^\s*(?:todo|to-?do|aufgabe)(?![sS])\s*[:-]?\s*(.+)$/is
const NOTE_WRITE =
  /^\s*(?:notiz(?:e)?|notiere|notiz:|schreib(?:e)?\s+auf|merke\s+als\s+notiz)\s*[:-]?\s*(.+)$/is
const LIST_PREFIX =
  /^\s*(?:setz(?:e)?|pack(?:e)?|tu)\s+(?:das\s+)?(?:auf\s+die\s+liste|auf\s+die\s+todos?)[:\s]+(.+)$/is
const MUST_DO = /^\s*ich\s+muss\s+(?:noch\s+)?(.+)$/is
const TASK_TAIL =
  /^\s*(?:bitte\s+)?(.{2,40}?)\s+(abholen|anrufen|putzen|waschen)\s*[.!]?\s*$/i
const TODO_LIST =
  /^\s*(?:(?:zeig(?:e)?|liste)\s+(?:mir\s+)?(?:meine\s+)?(?:offenen\s+)?(?:todos?|aufgaben)|(?:offene\s+)?todos?\??|was\s+steht\s+an\??|meine\s+aufgaben)\s*$/i
const TODO_CLEANUP = /\btodos?\s+aufräumen\b|\berledigte\s+todos?\s+löschen\b/i
const DONE_FIRST =
  /^\s*(?:erledige\s+(?:das\s+)?(?:erste|1\.?)(?:\s+todo)?|erstes\s+(?:todo\s+)?(?:erledigen|abhaken)|haken\s+beim\s+ersten)\s*[.!]?\s*$/i
const TODO_DELETE =
  /^\s*(?:lösch(?:e)?|streich(?:e)?)\s+(?:das\s+)?(?:todo|aufgabe)\s+(.+)$/is
const TODO_DELETE_LAST =
  /^\s*(?:lösch(?:e)?|streich(?:e)?)\s+(?:das\s+)?letzte\s+(?:todo|aufgabe)\s*$/i

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function parseLocalDeadline(text: string): { date: string; time: string | null; remaining: string } | null {
  const match = /\b(?:bis|am)\s+(morgen|heute|übermorgen|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)(?:\s+(?:um\s+)?(\d{1,2})(?::(\d{2})|(?:\s*Uhr)?))?/i.exec(text)
  if (!match) return null
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = match[1].toLocaleLowerCase()
  if (day === 'morgen') date.setDate(date.getDate() + 1)
  else if (day === 'übermorgen') date.setDate(date.getDate() + 2)
  else if (day !== 'heute') {
    const days = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag']
    const target = days.indexOf(day)
    date.setDate(date.getDate() + ((target - date.getDay() + 7) % 7 || 7))
  }
  let time: string | null = null
  if (match[2]) {
    const hour = Number(match[2])
    const minute = match[3] ? Number(match[3]) : 0
    if (hour > 23 || minute > 59) return null
    time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  const remaining = `${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`.replace(/\s+/g, ' ').trim()
  return { date: localDate(date), time, remaining }
}

function dayThrough(text: string): { through: string; label: string } | null {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (/\bbis\s+morgen\b/i.test(text)) {
    end.setDate(end.getDate() + 1)
    return { through: localDate(end), label: 'bis morgen' }
  }
  if (/\bdiese\s+woche\b/i.test(text)) {
    end.setDate(end.getDate() + (7 - end.getDay()))
    return { through: localDate(end), label: 'diese Woche' }
  }
  return null
}

export function parseToolIntent(text: string): ToolIntent | null {
  const noteUpdate = /^\s*ändere\s+(?:die\s+)?notiz\s+(.+?)\s+(?:zu|auf)\s+(.+)$/is.exec(text)
  if (noteUpdate) return { kind: 'note_update', query: noteUpdate[1].trim(), body: noteUpdate[2].trim() }
  const noteDelete = /^\s*(?:lösch(?:e)?|streich(?:e)?)\s+(?:die\s+)?notiz\s+(.+)$/is.exec(text)
  if (noteDelete) return { kind: 'note_delete', query: noteDelete[1].replace(/[.!?]+$/, '').trim() }
  if (/^\s*(?:öffne|zeige)\s+(?:meine\s+)?notizen\s*[.!?]*$/i.test(text)) {
    return { kind: 'note_list' }
  }

  const createList = /^\s*(?:erstelle|erstell|lege|leg)\s+(?:eine\s+)?(?:todo-?liste|to-?do-?liste|aufgabenliste)\s+(.+?)\s*[.!?]*$/i.exec(text)
  if (createList) return { kind: 'todo_list_create', name: createList[1].trim() }
  const openList = /^\s*(?:öffne|zeige)\s+(?:die\s+)?liste\s+(.+?)\s*[.!?]*$/i.exec(text)
  if (openList) return { kind: 'todo_list_open', name: openList[1].trim() }
  const due = dayThrough(text)
  if (due && /\b(?:was|welche|zeig|zeige|fällig|erledigen|todo|aufgabe)\b/i.test(text)) {
    return { kind: 'todo_due', ...due }
  }

  const inList = /^\s*(?:füge|füg|packe|pack)\s+(?:in|auf)\s+(.+?)\s+(?:hinzu|ein)\s*:\s*(.+)$/is.exec(text)
  if (inList) {
    const deadline = parseLocalDeadline(inList[2])
    return {
      kind: 'todo_create',
      listName: inList[1].trim(),
      title: deadline?.remaining || inList[2].trim(),
      deadlineDate: deadline?.date || null,
      deadlineTime: deadline?.time || null,
    }
  }
  const updateTodo = /^\s*(?:ändere|ändere|setz(?:e)?)\s+(?:das\s+)?todo\s+(.+?)\s+(?:auf|zu)\s+(.+)$/is.exec(text)
  if (updateTodo) {
    const deadline = parseLocalDeadline(updateTodo[2])
    return {
      kind: 'todo_update',
      query: updateTodo[1].trim(),
      ...(deadline
        ? { deadlineDate: deadline.date, deadlineTime: deadline.time }
        : { title: updateTodo[2].trim() }),
    }
  }
  const deadlineTodo = /^\s*(?:setz(?:e)?\s+)?(?:eine\s+)?deadline\s*:\s*(.+)$/is.exec(text)
  if (deadlineTodo) {
    const deadline = parseLocalDeadline(deadlineTodo[1])
    if (deadline) return { kind: 'todo_create', title: deadline.remaining, deadlineDate: deadline.date, deadlineTime: deadline.time }
  }

  const todoWrite = TODO_WRITE.exec(text)
  if (todoWrite) {
    const deadline = parseLocalDeadline(todoWrite[1])
    return {
      kind: 'todo_create',
      title: deadline?.remaining || todoWrite[1].trim(),
      deadlineDate: deadline?.date || null,
      deadlineTime: deadline?.time || null,
    }
  }

  const listPrefix = LIST_PREFIX.exec(text)
  if (listPrefix) return { kind: 'todo_create', title: listPrefix[1].trim() }

  const must = MUST_DO.exec(text)
  if (must) return { kind: 'todo_create', title: must[1].trim().replace(/[.!?]+$/, '') }

  const tail = TASK_TAIL.exec(text)
  if (tail && !/[?]/.test(text) && text.trim().length <= 60 && !/anrufen/i.test(tail[2])) {
    return { kind: 'todo_create', title: `${tail[1].trim()} ${tail[2].toLowerCase()}` }
  }

  const noteWrite = NOTE_WRITE.exec(text)
  if (noteWrite) return { kind: 'note_create', body: noteWrite[1].trim() }
  if (TODO_DELETE_LAST.test(text)) return { kind: 'todo_delete_last' }
  const todoDel = TODO_DELETE.exec(text)
  if (todoDel) return { kind: 'todo_delete', query: todoDel[1].replace(/[.!?]+$/, '').trim() }
  if (DONE_FIRST.test(text)) return { kind: 'todo_done_first' }
  if (TODO_CLEANUP.test(text)) return { kind: 'todo_cleanup' }
  const listMatch = /^\s*(?:zeig|zeige|liste)\s+(?:mir\s+)?(?:die\s+)?todos?\s+(?:in|auf)\s+(.+?)\s*[.!?]*$/i.exec(text)
  if (listMatch) return { kind: 'todo_list', listName: listMatch[1].trim() }
  if (TODO_LIST.test(text) || /^(?:offene\s+)?todos?\??$/i.test(text.trim())) return { kind: 'todo_list' }
  if (/\bnotizen\b/i.test(text) && /zeig|liste|öffne/i.test(text)) return { kind: 'note_list' }
  return null
}
