export type ToolIntent =
  | { kind: 'todo_create'; title: string; listName?: string; deadlineDate?: string | null; deadlineTime?: string | null; fromShopping?: boolean }
  | { kind: 'todo_adopt_last' }
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

const TODO_WRITE = /^\s*(?:todo|to-?do|aufgabe)\b(?!n\b)(?![sS])\s*(?!anzeigen\b|liste\b)[:-]?\s*(.+)$/is
const NOTE_WRITE =
  /^\s*(?:neue\s+)?(?:notiz(?!en\b)|notiere|schreib(?:e)?\s+auf|merke\s+als\s+notiz)\s*[:-]?\s*(.+)$/is
const LIST_PREFIX =
  /^\s*(?:setz(?:e)?|pack(?:e)?|tu)\s+(?:das\s+)?(?:auf\s+die\s+liste|auf\s+die\s+todos?)[:\s]+(.+)$/is
const MUST_DO = /^\s*ich\s+muss\s+(?:noch\s+)?(?!(?:los|sagen|mal|kurz|weg|pennen|schlafen)\b)(?!.+\b(?:kaufen|holen|besorgen)\s*$)(.{4,})$/is
const TASK_TAIL =
  /^\s*(?:bitte\s+)?(.{2,40}?)\s+(abholen|anrufen|putzen|waschen)\s*[.!]?\s*$/i
const TODO_LIST =
  /^\s*(?:(?:zeig(?:e)?|liste)\s+(?:mir\s+)?(?:meine\s+)?(?:offenen\s+)?(?:todos?|aufgaben)|(?:offene\s+)?todos?\??|was\s+steht\s+(?:noch\s+)?an\??|meine\s+aufgaben|was\s+hab(?:e)?\s+ich\s+(?:noch\s+)?(?:zu\s+tun|zu\s+erledigen|offen)|was\s+muss\s+ich\s+(?:noch\s+)?(?:tun|erledigen)|was\s+ist\s+(?:noch\s+)?zu\s+tun|was\s+liegt\s+(?:noch\s+)?an)\s*\??\s*$/i
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

const WEEK_PHRASE = String.raw`(?:nächste[rn]?|kommende[rn]?)\s+woche`
const DEADLINE_DAY = String.raw`morgen|heute|übermorgen|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag`

export function parseLocalDeadline(
  text: string,
  now = new Date(),
): { date: string; time: string | null; remaining: string } | null {
  const match = new RegExp(
    String.raw`\b(?:bis|am)\s+(?:(${WEEK_PHRASE})\s+)?(${DEADLINE_DAY})(?:\s+(${WEEK_PHRASE}))?(?:\s+(?:um\s+)?(\d{1,2})(?::(\d{2}))?(?:\s*uhr)?)?`,
    'i',
  ).exec(text)
  if (!match) return null
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = match[2].toLocaleLowerCase()
  const nextWeek = Boolean(match[1] || match[3])
  if (nextWeek && day !== 'morgen' && day !== 'heute' && day !== 'übermorgen') {
    const days = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag']
    const target = days.indexOf(day)
    const toMonday = (8 - date.getDay()) % 7 || 7
    date.setDate(date.getDate() + toMonday + (target === 0 ? 6 : target - 1))
  } else if (day === 'morgen') date.setDate(date.getDate() + 1)
  else if (day === 'übermorgen') date.setDate(date.getDate() + 2)
  else if (day !== 'heute') {
    const days = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag']
    const target = days.indexOf(day)
    date.setDate(date.getDate() + ((target - date.getDay() + 7) % 7 || 7))
  }
  let time: string | null = null
  if (match[4]) {
    const hour = Number(match[4])
    const minute = match[5] ? Number(match[5]) : 0
    if (hour > 23 || minute > 59) return null
    time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  const remaining = `${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`.replace(/\s+/g, ' ').trim()
  return { date: localDate(date), time, remaining }
}

/** Datum, Uhrzeit und Füllwörter gehören nicht in den Aufgabennamen. */
export function tidyTaskTitle(text: string): string {
  return text
    .replace(/\b(?:nächste[rn]?|kommende[rn]?)\s+woche\b/gi, ' ')
    .replace(/\b(?:um\s+)?\d{1,2}(?::\d{2})?\s*uhr\b/gi, ' ')
    .replace(/^(?:noch|dann|mal|bitte|eben)\s+/i, '')
    .replace(/^(?:die|den|das|der|dem|ein|eine|einen|meiner|meine|mein|meinen)\s+/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, '')
    .trim()
}

function taskTitle(remaining: string, fallback: string): string {
  return tidyTaskTitle(remaining) || tidyTaskTitle(fallback) || fallback.replace(/\s+/g, ' ').trim() || 'Aufgabe'
}

function todoFromText(raw: string): { title: string; deadlineDate: string | null; deadlineTime: string | null } {
  const cleaned = raw.replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim()
  const deadline = parseLocalDeadline(cleaned)
  return {
    title: deadline ? taskTitle(deadline.remaining, cleaned) : cleaned,
    deadlineDate: deadline?.date ?? null,
    deadlineTime: deadline?.time ?? null,
  }
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

const TODO_LIST_NAME = String.raw`(?:to-?\s*do|aufgaben)(?:-|\s)?liste`
const CORRECTION_TO_TODO = new RegExp(
  String.raw`^\s*(?:nein|nee+|nicht|doch|lieber|stattdessen)[,:]?\s+(?:auf\s+)?(?:die\s+|der\s+|meine[rn]?\s+)?${TODO_LIST_NAME}\s*$`,
  'i',
)
const PLACE_ON_TODO = new RegExp(
  String.raw`^\s*(?:bitte\s+)?(?:(?:setz(?:e)?|pack(?:e)?|tu(?:e)?|leg(?:e)?|schreib(?:e)?|verschieb(?:e)?|schieb(?:e)?|nimm)\s+(?:mir\s+)?)?(?:bitte\s+)?(.+?)\s+(?:auf|in|zu[rm]?)\s+(?:die\s+|der\s+|das\s+|dem\s+|den\s+|meine[rn]?\s+)?${TODO_LIST_NAME}\s*$`,
  'i',
)

function placeTitle(raw: string): string {
  const title = raw
    .replace(/^(?:bitte|mal|noch|eben|das|den|die|dem|ein|eine|einen)\s+/i, '')
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (title.length < 2 || title.length > 80) return ''
  if (/^(?:nein|nee+|nicht|doch|lieber|stattdessen)$/i.test(title)) return ''
  return title.replace(/^\p{Ll}/u, (c) => c.toLocaleUpperCase('de-DE'))
}

export function parseToolIntent(text: string): ToolIntent | null {
  const placed = text.trim().replace(/[.!?]+\s*$/g, '').trim()
  if (CORRECTION_TO_TODO.test(placed)) return { kind: 'todo_adopt_last' }
  const onTodo = PLACE_ON_TODO.exec(placed)
  if (onTodo) {
    const title = placeTitle(onTodo[1])
    if (title) return { kind: 'todo_create', title, fromShopping: true }
  }

  const noteUpdate = /^\s*ändere\s+(?:die\s+)?notiz\s+(.+?)\s+(?:zu|auf)\s+(.+)$/is.exec(text)
  if (noteUpdate) return { kind: 'note_update', query: noteUpdate[1].trim(), body: noteUpdate[2].trim() }
  const noteDelete = /^\s*(?:lösch(?:e)?|streich(?:e)?)\s+(?:die\s+)?notiz(?:\s+(.+?))?\s*[.!?]*$/is.exec(text)
  if (noteDelete) return { kind: 'note_delete', query: (noteDelete[1] || '').replace(/[.!?]+$/, '').trim() }
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
      title: deadline ? taskTitle(deadline.remaining, inList[2]) : inList[2].trim(),
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
    if (deadline) return { kind: 'todo_create', title: taskTitle(deadline.remaining, deadlineTodo[1]), deadlineDate: deadline.date, deadlineTime: deadline.time }
  }

  const todoWrite = TODO_WRITE.exec(text)
  if (todoWrite) {
    const deadline = parseLocalDeadline(todoWrite[1])
    return {
      kind: 'todo_create',
      title: deadline ? taskTitle(deadline.remaining, todoWrite[1]) : todoWrite[1].trim(),
      deadlineDate: deadline?.date || null,
      deadlineTime: deadline?.time || null,
    }
  }

  const listPrefix = LIST_PREFIX.exec(text)
  if (listPrefix) return { kind: 'todo_create', ...todoFromText(listPrefix[1]) }

  const must = MUST_DO.exec(text)
  if (must) return { kind: 'todo_create', ...todoFromText(must[1]) }

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
