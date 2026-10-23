export type ToolIntent =
  | { kind: 'todo_create'; title: string; listName?: string; deadlineDate?: string | null; deadlineTime?: string | null; fromShopping?: boolean }
  | { kind: 'todo_adopt_last' }
  | { kind: 'tag_add_last'; tag: string }
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
  | { kind: 'library_open' }
  | { kind: 'library_list'; query?: string }
  | { kind: 'tag_add'; target: 'note' | 'todo' | 'library' | 'auto'; query: string; tag: string }
  | { kind: 'tag_show'; target: 'note' | 'todo' | 'library'; tag: string }

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

/** Auch Schreibfehler wie „nähste/nekste/näxte Woiche“ sind nächste Woche. */
const WEEK_PHRASE = String.raw`(?:n[aäe][a-z]{0,2}ste[rn]?|n[aäe]xte[rn]?|kommende[rn]?)\s+w[oö]che`
const DEADLINE_DAY = String.raw`morgen|heute|übermorgen|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag`

export function parseLocalDeadline(
  text: string,
  now = new Date(),
  relaxed = false,
): { date: string; time: string | null; remaining: string } | null {
  const tail = String.raw`(?:\s+(?:um\s+)?(\d{1,2})(?::(\d{2}))?(?:\s*uhr)?)?`
  type Core = { day: string; nextWeek: boolean; hour?: string; minute?: string }
  type Hit = Core & { start: number; end: number }
  const scan = (re: RegExp, pick: (m: RegExpExecArray) => Core): Hit | null => {
    const m = re.exec(text)
    return m ? { ...pick(m), start: m.index, end: m.index + m[0].length } : null
  }
  const strict = scan(
    new RegExp(String.raw`\b(?:bis|am)\s+((?:${WEEK_PHRASE})\s+)?(${DEADLINE_DAY})(?:\s+(${WEEK_PHRASE}))?${tail}`, 'i'),
    (m) => ({ day: m[2], nextWeek: Boolean(m[1] || m[3]), hour: m[4], minute: m[5] }),
  )
  const hit =
    strict ||
    (relaxed
      ? scan(new RegExp(String.raw`\b(${WEEK_PHRASE})\s+(${DEADLINE_DAY})${tail}`, 'i'), (m) => ({
          day: m[2],
          nextWeek: true,
          hour: m[3],
          minute: m[4],
        })) ||
        scan(new RegExp(String.raw`\b(${DEADLINE_DAY})\s+(${WEEK_PHRASE})${tail}`, 'i'), (m) => ({
          day: m[1],
          nextWeek: true,
          hour: m[3],
          minute: m[4],
        })) ||
        scan(new RegExp(String.raw`\b(?:bis\s+)?(${WEEK_PHRASE})\b`, 'i'), () => ({
          day: '',
          nextWeek: true,
        }))
      : null)
  if (!hit) return null
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayName = hit.day.toLocaleLowerCase()
  if (!hit.day) {
    // Nur „nächste Woche" ohne Wochentag: Termin am Montag der nächsten Woche.
    date.setDate(date.getDate() + ((8 - date.getDay()) % 7 || 7))
  } else if (hit.nextWeek && dayName !== 'morgen' && dayName !== 'heute' && dayName !== 'übermorgen') {
    const days = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag']
    const target = days.indexOf(dayName)
    const toMonday = (8 - date.getDay()) % 7 || 7
    date.setDate(date.getDate() + toMonday + (target === 0 ? 6 : target - 1))
  } else if (dayName === 'morgen') date.setDate(date.getDate() + 1)
  else if (dayName === 'übermorgen') date.setDate(date.getDate() + 2)
  else if (dayName !== 'heute') {
    const days = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag']
    const target = days.indexOf(dayName)
    date.setDate(date.getDate() + ((target - date.getDay() + 7) % 7 || 7))
  }
  let time: string | null = null
  if (hit.hour != null) {
    const hour = Number(hit.hour)
    const minute = hit.minute ? Number(hit.minute) : 0
    if (hour > 23 || minute > 59) return null
    time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  const remaining = `${text.slice(0, hit.start)} ${text.slice(hit.end)}`.replace(/\s+/g, ' ').trim()
  return { date: localDate(date), time, remaining }
}

/** Wörter, die klein bleiben, obwohl sie kurz sind (GM soll GM bleiben). */
const SMALL_WORD =
  /^(?:in|im|am|an|auf|aus|bei|bis|da|dem|den|der|des|die|das|du|er|es|für|ich|ihm|ihn|ist|ja|je|man|mein|mir|mit|nach|nicht|noch|nur|ob|oder|ohne|schon|sehr|sie|so|und|um|vom|von|vor|was|weil|wie|wo|zu|zum|zur|mal|ab|eh|als|auch|hab|hat|war)$/i

/**
 * Selbstständiger Aufgabenname: Füllwörter und anfassende Verben am Anfang
 * weg, Anfang groß, kurze Fachwörter (gm → GM) hoch.
 */
export function polishTitle(raw: string): string {
  let t = String(raw || '').replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim()
  const filler = /^(?:bitte|mal|noch|eben|kurz|danke|und|also|dann|jetzt|gleich)\s+/i
  const verb =
    /^(?:setz|stell|leg|pack|schreib|füg|fueg|ergänz|ergaenz|mach|trag|nimm|tu|tue|notier|kauf|hol|besorg|lösch|loesch|hinzufüg)(?:e|t|te|st)?\s+(?:mir\s+)?(?:das\s+|den\s+|die\s+|dem\s+|ein\s+|eine\s+|einen\s+)?/i
  const article = /^(?:das|den|die|dem|der|ein|eine|einen|mein|meine|meinen)\s+/i
  for (let i = 0; i < 3; i++) {
    const before = t
    t = t.replace(filler, '').replace(verb, '')
    if (t === before) break
  }
  t = t.replace(article, '').replace(/\s+/g, ' ').trim()
  if (!t) return ''
  t = t
    .split(' ')
    .map((word) =>
      word.length >= 2 && word.length <= 3 && !SMALL_WORD.test(word) && /^\p{Ll}{2,3}$/u.test(word)
        ? word.toLocaleUpperCase('de-DE')
        : word,
    )
    .join(' ')
  return t.replace(/^\p{Ll}/u, (c) => c.toLocaleUpperCase('de-DE'))
}

/** Datum, Uhrzeit und Füllwörter gehören nicht in den Aufgabennamen. */
export function tidyTaskTitle(text: string): string {
  return text
    .replace(new RegExp(`\\b(?:${WEEK_PHRASE})\\b`, 'gi'), ' ')
    .replace(/\b(?:um\s+)?\d{1,2}(?::\d{2})?\s*uhr\b/gi, ' ')
    .replace(/^(?:noch|dann|mal|bitte|eben)\s+/i, '')
    .replace(/^(?:die|den|das|der|dem|ein|eine|einen|meiner|meine|mein|meinen)\s+/i, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, '')
    .trim()
}

function taskTitle(remaining: string, fallback: string): string {
  return polishTitle(tidyTaskTitle(remaining)) || polishTitle(tidyTaskTitle(fallback)) || fallback.replace(/\s+/g, ' ').trim() || 'Aufgabe'
}

function todoFromText(raw: string): { title: string; deadlineDate: string | null; deadlineTime: string | null } {
  const cleaned = raw.replace(/[.!?]+$/g, '').replace(/\s+/g, ' ').trim()
  const deadline = parseLocalDeadline(cleaned, new Date(), true)
  return {
    title: deadline ? taskTitle(deadline.remaining, cleaned) : polishTitle(cleaned),
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
const PLACE_VERB = String.raw`setz(?:e)?|pack(?:e)?|tu(?:e)?|leg(?:e)?|schreib(?:e)?|verschieb(?:e)?|schieb(?:e)?|nimm|trag(?:e)?|eintrag(?:e)?|stell(?:e)?|mach(?:e)?`
const PLACE_ON_TODO = new RegExp(
  String.raw`^\s*(?:bitte\s+)?(?:(?:${PLACE_VERB})\s+(?:mir\s+)?)?(?:bitte\s+)?(.+?)\s+(?:auf|in|zu[rm]?)\s+(?:die\s+|der\s+|das\s+|dem\s+|den\s+|meine[rn]?\s+)?${TODO_LIST_NAME}(?:\s+(?:ein|hinzu))?\s*$`,
  'i',
)
const NOT_A_TASK =
  /\b(?:kaufen|holen|besorgen|termin|keine|frei|zeit|zahnarzt|arzt|meeting|feier|party|treffen|geburtstag|training|flug|urlaub|klausur|vorlesung)\b/i

function placeTitle(raw: string): string {
  const title = polishTitle(raw)
  if (title.length < 2 || title.length > 80) return ''
  if (/^(?:nein|nee+|nicht|doch|lieber|stattdessen)$/i.test(title)) return ''
  return title
}

/** Aufgabe mit „bis/am Freitag“, auch wenn der Tag nicht am Satzanfang steht. */
function datedTask(text: string): ToolIntent | null {
  if (/[?]/.test(text)) return null
  if (/^\s*(?:was|wie|wann|welche|zeig|zeige|öffne|habe|hab|lösch|streich|änder)\b/i.test(text)) return null
  const day = parseLocalDeadline(text)
  if (!day) return null
  const rest = day.remaining
    .replace(new RegExp(String.raw`^(?:${PLACE_VERB})\s+`, 'i'), '')
    .replace(/\s+(?:ein|hinzu)$/i, '')
  const title = taskTitle(rest, rest)
  if (title.length < 2 || title.length > 60) return null
  if (NOT_A_TASK.test(title)) return null
  if (/^(?:früh|frueh|abend|mittag|nacht|vormittag)$/i.test(title)) return null
  return {
    kind: 'todo_create',
    title,
    deadlineDate: day.date,
    deadlineTime: day.time,
  }
}

export function parseToolIntent(text: string): ToolIntent | null {
  const placed = text.trim().replace(/[.!?]+\s*$/g, '').trim()
  if (CORRECTION_TO_TODO.test(placed)) return { kind: 'todo_adopt_last' }
  const onTodo = PLACE_ON_TODO.exec(placed)
  if (onTodo) {
    const parsed = todoFromText(onTodo[1])
    const title = placeTitle(parsed.title)
    if (title) {
      return {
        kind: 'todo_create',
        title,
        fromShopping: true,
        deadlineDate: parsed.deadlineDate,
        deadlineTime: parsed.deadlineTime,
      }
    }
  }

  const libraryOpen = /^(?:öffne|zeig(?:e)?(?:\s+mir)?|mach\s+auf)\s+die\s+bibliothek\s*\??$/i.exec(placed) || /^bibliothek\s*\??$/i.exec(placed)
  if (libraryOpen) return { kind: 'library_open' }

  // Bibliothekssuche nur, wenn die Bibliothek auch gemeint ist —
  // „Suche nach Küchengeräte“ gehört der Recherche, nicht der Bibliothek.
  const librarySearch =
    /^(?:was\s+(?:ist|liegt|steht)(?:\s+denn)?\s+(?:in|in\s+der)\s+bibliothek|(?:such(?:e)?|finde)\s+(?:in\s+(?:der|unserer)\s+bibliothek)\s+(?:nach|zu|über)\s+(.+?)|was\s+ist\s+in\s+der\s+bibliothek\s+(?:zu|über|nach)\s+(.+?))\s*\??$/i.exec(placed)
  if (librarySearch) {
    const query = (librarySearch[1] || librarySearch[2] || '').trim() || undefined
    return { kind: 'library_list', query }
  }

  const tagAddLast =
    /^(?:füge|füg|ergänz(?:e)?|ergaenz(?:e)?|pack(?:e)?|add(?:e)?)\s+(?:den\s+|ein\s+)?tag\s+([#a-zäöüß0-9_-]+)\s*(?:hinzu|dazu)?\s*$/i.exec(placed) ||
    /^tag(?:ge)?\s+([#a-zäöüß0-9_-]+)\s*(?:hinzu|dazu)?\s*$/i.exec(placed)
  if (tagAddLast) return { kind: 'tag_add_last', tag: tagAddLast[1] }

  const tagAdd =
    /^(?:tag(?:ge)?|markiere)\s+(?:die\s+)?(notiz|bibliothek|bibliothekseintrag|datei|aufgabe|todo)\s+(.+?)\s+mit\s+(?:(?:dem\s+)?tag\s+)?([#a-zäöüß0-9_-]+)\s*$/i.exec(placed) ||
    /^(?:füge|füg|ergänz(?:e)?|ergaenz(?:e)?)\s+(?:den\s+)?tag\s+([#a-zäöüß0-9_-]+)\s+(?:zur|zum|der|dem)\s+(notiz|bibliothek|bibliothekseintrag|datei|aufgabe|todo)\s+(.+?)\s+(?:hinzu|dazu)\s*$/i.exec(placed) ||
    /^setz(?:e)?\s+(?:den\s+)?tag\s+([#a-zäöüß0-9_-]+)\s+auf\s+(?:die\s+)?(notiz|bibliothek|bibliothekseintrag|datei|aufgabe|todo)\s+(.+?)\s*$/i.exec(placed) ||
    // Ohne Zielwort: „tag minecraft mit amazon“ — das Ziel sucht sich der Handler.
    /^(?:tag(?:ge)?|markiere)\s+(.+?)\s+mit\s+(?:(?:dem\s+)?tag\s+)?([#a-zäöüß0-9_-]+)\s*$/i.exec(placed)
  if (tagAdd) {
    const tagTarget = (kind: string): 'note' | 'todo' | 'library' | 'auto' =>
      /^(notiz)/i.test(kind) ? 'note' : /^(bibliothek|datei)/i.test(kind) ? 'library' : /^(todo|aufgabe)/i.test(kind) ? 'todo' : 'auto'
    if (tagAdd.length === 3) {
      // Muster ohne Zielwort: „tag minecraft mit amazon“
      return { kind: 'tag_add', target: 'auto', query: String(tagAdd[1] || '').trim(), tag: tagAdd[2] }
    }
    if (/^(?:tag|markiere)/i.test(placed)) {
      return { kind: 'tag_add', target: tagTarget(tagAdd[1]), query: String(tagAdd[2] || '').trim(), tag: tagAdd[3] }
    }
    // „füge tag X zur notiz Y hinzu“ und „setze tag X auf die notiz Y“
    return { kind: 'tag_add', target: tagTarget(tagAdd[2]), query: String(tagAdd[3] || '').trim(), tag: tagAdd[1] }
  }

  const tagShow =
    /^(?:zeig(?:e)?(?:\s+mir)?|welche)\s+(?:alle\s+)?(notizen|todos?|aufgaben|bibliothek|dateien)(?:\s+mit\s+(?:dem\s+)?tag|\s+getaggt\s+mit|\s+mit)\s+([#a-zäöüß0-9_-]+)\s*\??$/i.exec(placed) ||
    /^(?:zeig(?:e)?\s+mir\s+)?(notizen|todos?|aufgaben|bibliothek|dateien)\s+mit\s+(?:dem\s+)?tag\s+([#a-zäöüß0-9_-]+)\s*\??$/i.exec(placed)
  if (tagShow) {
    const target = /^notiz/i.test(tagShow[1]) ? 'note' : /^(bibliothek|dateien)/i.test(tagShow[1]) ? 'library' : 'todo'
    return { kind: 'tag_show', target: target as 'note' | 'todo' | 'library', tag: tagShow[2] }
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
      title: deadline ? taskTitle(deadline.remaining, inList[2]) : polishTitle(inList[2]) || inList[2].trim(),
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
        : { title: polishTitle(updateTodo[2]) || updateTodo[2].trim() }),
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
      title: deadline ? taskTitle(deadline.remaining, todoWrite[1]) : polishTitle(todoWrite[1]) || todoWrite[1].trim(),
      deadlineDate: deadline?.date || null,
      deadlineTime: deadline?.time || null,
    }
  }

  const listPrefix = LIST_PREFIX.exec(text)
  if (listPrefix) return { kind: 'todo_create', ...todoFromText(listPrefix[1]) }

  if (/^\s*(?:bis|am)\s+/i.test(text)) {
    const lead = datedTask(text)
    if (lead) return lead
  }

  const must = MUST_DO.exec(text)
  if (must) return { kind: 'todo_create', ...todoFromText(must[1]) }

  const dated = datedTask(text)
  if (dated) return dated

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
