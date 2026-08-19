export type ToolIntent =
  | { kind: 'todo_create'; title: string }
  | { kind: 'note_create'; body: string }
  | { kind: 'todo_list' }
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

export function parseToolIntent(text: string): ToolIntent | null {
  const todoWrite = TODO_WRITE.exec(text)
  if (todoWrite) return { kind: 'todo_create', title: todoWrite[1].trim() }

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
  if (TODO_LIST.test(text) || /^(?:offene\s+)?todos?\??$/i.test(text.trim())) return { kind: 'todo_list' }
  if (/\bnotizen\b/i.test(text) && /zeig|liste/i.test(text)) return { kind: 'note_list' }
  return null
}
