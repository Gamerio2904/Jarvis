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
/** „Mama anrufen wegen Geburtstag“ — Verb vorn/mitten, trotzdem ein Todo (I9). */
const INFINITIVE_TASK =
  /^\s*(.{2,40}?)\s+(anrufen|abholen|putzen|waschen|aufräumen|erledigen|besorgen|ausdrucken|unterschreiben)\s+(?:wegen|für|bevor|nachdem|bis)\s+(.{2,60})$/i
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
// Reihenfolge: längeres „übermorgen“ vor „morgen“ — sonst frisst der
// Alternations-Kurztreffer den vorderen Teil von „bis übermorgen“.
const DEADLINE_DAY = String.raw`übermorgen|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|morgen|heute`
const WEEKDAY_ONLY = String.raw`montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag`
/** I2: relative Zeitspans, Wochenende, Monatsende, Kalenderdaten, Tageszeiten. */
const IN_SPAN =
  /\bin\s+(\d{1,2}|ein(?:e[rm]?)?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)\s+(tagen?|wochen?)\b/i
const NEXT_WEEKDAY = new RegExp(String.raw`\b(?:n[aäe][a-z]{0,2}sten|kommenden)\s+(${WEEKDAY_ONLY})\b`, 'i')
const WEEKEND = /\b(?:am|bis\s+(?:zum\s+)?|zum)\s+wochenende\b/i
const MONTH_END = /\b(?:bis\s+)?(?:ende\s+(?:des\s+)?monats?|monatsende)\b/i
const DATE_MONTH =
  /\b(\d{1,2})\.?\s+(januar|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember)\b(?:\s*(\d{4}))?/i
/** „am 14.03.“ / „bis 14.3.2026“ / „am 14.“ — keine Uhrzeit dahinter („bis 10.45 uhr“). */
const DATE_WITH_MONTH = /\b(?:am|bis(?:\s+zum)?)\s+(\d{1,2})\.(?:\s?(\d{1,2})\.)?(?:\s?(\d{2,4}))?(?!\s*\d*\s*uhr)/i
const HALF_HOUR = /\b(?:um\s+)?halb\s+(\d{1,2})(?:\s*uhr)?\b/i
const CLOCK_AFTER = /\bum\s+(\d{1,2})(?::(\d{2}))?(?:\s*uhr)?\b/i
const CLOCK_BARE = /\b(\d{1,2})\s+uhr\b/i
const DAYTIME =
  /\b(früh|frueh|morgens|vormittags|mittags|nachmittags|abends|nachts)\b/i

const SPAN_WORDS: Record<string, number> = {
  ein: 1, eine: 1, einem: 1, einen: 1,
  zwei: 2, drei: 3, vier: 4, 'fünf': 5, sechs: 6, sieben: 7,
  acht: 8, neun: 9, zehn: 10, elf: 11, 'zwölf': 12,
}
/** Tageszeit → grobe Uhrzeit. „abends“ heißt 19 Uhr, „früh“ 8 Uhr. */
const DAYTIME_HOURS: Record<string, number> = {
  'früh': 8, frueh: 8, morgens: 9, vormittags: 10, mittags: 12, nachmittags: 15, abends: 19, nachts: 21,
}
const MONTH_INDEX: Record<string, number> = {
  januar: 0, februar: 1, 'märz': 2, maerz: 2, april: 3, mai: 4, juni: 5, juli: 6,
  august: 7, september: 8, oktober: 9, november: 10, dezember: 11,
}

function weekdayOffset(dayName: string, nextWeek: boolean, base: Date): number {
  const days = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag']
  const target = days.indexOf(dayName.toLocaleLowerCase())
  if (nextWeek) {
    const toMonday = (8 - base.getDay()) % 7 || 7
    return toMonday + (target === 0 ? 6 : target - 1)
  }
  return (target - base.getDay() + 7) % 7 || 7
}

/** „halb 5“ = 4:30 — als Deadline aber fast immer nachmittags gemeint,
 * deshalb bis „halb 7“ die Nachmittags-Lesart (16:30), danach die Morgens-Lesart. */
function halbTime(n: number): { hour: number; minute: number } | null {
  if (!Number.isFinite(n) || n < 1 || n > 12) return null
  let hour = n - 1
  if (n <= 7) hour += 12
  return { hour: hour % 24, minute: 30 }
}

export function parseLocalDeadline(
  text: string,
  now = new Date(),
  relaxed = false,
): { date: string; time: string | null; remaining: string } | null {
  type Core = { apply: (d: Date) => void; hour?: string; minute?: string }
  type Hit = Core & { start: number; end: number }
  const scan = (re: RegExp, pick: (m: RegExpExecArray) => Core | null): Hit | null => {
    const m = re.exec(text)
    if (!m) return null
    const core = pick(m)
    return core ? { ...core, start: m.index, end: m.index + m[0].length } : null
  }
  const weekday = (name: string, nextWeek: boolean): Core => ({
    apply: (d) => d.setDate(d.getDate() + weekdayOffset(name, nextWeek, now)),
  })
  const tail = String.raw`(?:\s+(?:um\s+)?(\d{1,2})(?::(\d{2}))?(?:\s*uhr)?)?`
  const strict = scan(
    new RegExp(String.raw`\b(?:bis|am)\s+((?:${WEEK_PHRASE})\s+)?(${DEADLINE_DAY})(?:\s+(${WEEK_PHRASE}))?${tail}`, 'i'),
    (m) => {
      const day = m[2]
      const nextWeek = Boolean(m[1] || m[3])
      const low = day.toLocaleLowerCase()
      const apply = (d: Date) => {
        if (low === 'morgen') d.setDate(d.getDate() + 1)
        else if (low === 'übermorgen') d.setDate(d.getDate() + 2)
        else if (low !== 'heute') d.setDate(d.getDate() + weekdayOffset(low, nextWeek, now))
      }
      return { apply, hour: m[4], minute: m[5] }
    },
  )
  const inSpan = scan(IN_SPAN, (m) => {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : SPAN_WORDS[m[1].toLocaleLowerCase()]
    if (!n || n > 366) return null
    const days = /wochen?/i.test(m[2]) ? n * 7 : n
    return { apply: (d) => d.setDate(d.getDate() + days) }
  })
  const dateMonth = scan(DATE_MONTH, (m) => {
    const day = Number(m[1])
    const month = MONTH_INDEX[m[2].toLocaleLowerCase()]
    const year = m[3] ? Number(m[3]) : now.getFullYear()
    if (!month && month !== 0 || day < 1 || day > 31) return null
    const target = new Date(year, month, day)
    // Vergangene Tage im selben Jahr rutschen aufs nächste Jahr.
    if (!m[3] && target.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
      target.setFullYear(year + 1)
    }
    return {
      apply: (d) => {
        d.setFullYear(target.getFullYear())
        d.setMonth(target.getMonth())
        d.setDate(target.getDate())
      },
    }
  })
  const dateWithMonth = scan(DATE_WITH_MONTH, (m) => {
    const day = Number(m[1])
    if (day < 1 || day > 31) return null
    const month = m[2] ? Number(m[2]) - 1 : now.getMonth()
    if (m[2] && (Number(m[2]) < 1 || Number(m[2]) > 12)) return null
    let year = m[3] ? Number(m[3]) : now.getFullYear()
    if (m[3] && year < 100) year += 2000
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let target = new Date(year, month, day)
    if (!m[3] && target.getTime() < base.getTime()) {
      // Ohne Jahr in der Vergangenheit → nächstes Jahr („am 14.03.“ im Oktober).
      target = new Date(year + 1, month, day)
    }
    return {
      apply: (d) => {
        d.setFullYear(target.getFullYear())
        d.setMonth(target.getMonth())
        d.setDate(target.getDate())
      },
    }
  })
  const weekend = scan(WEEKEND, () => ({
    apply: (d) => d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)),
  }))
  const monthEnd = scan(MONTH_END, () => ({
    // Erster des Monats → einen Monat weiter → Tag 0 = letzter Tag des Monats.
    apply: (d) => {
      d.setDate(1)
      d.setMonth(d.getMonth() + 1)
      d.setDate(0)
    },
  }))
  const nextWeekday = relaxed ? scan(NEXT_WEEKDAY, (m) => weekday(m[1], true)) : null
  // Achtung: \b ist in JavaScript ASCII-only — „übermorgen“ beginnt mit „ü“,
  // dort gibt es also keine Wortgrenze. Grenze deshalb über (?:^|\s) bauen;
  // der mitgeschluckte Leerraum fällt beim Zusammenschieben weg.
  const over = relaxed ? scan(/(?:^|\s)übermorgen\b/i, () => ({ apply: (d) => d.setDate(d.getDate() + 2) })) : null
  const bareDay = relaxed ? scan(/^\s*(?:morgen|heute)\b/i, (m) => {
    const low = m[0].trim().toLocaleLowerCase()
    return { apply: (d) => d.setDate(d.getDate() + (low === 'morgen' ? 1 : 0)) }
  }) : null
  const weekPhraseDay =
    relaxed
      ? scan(new RegExp(String.raw`\b(${WEEK_PHRASE})\s+(${DEADLINE_DAY})${tail}`, 'i'), (m) => ({
          ...weekday(m[2], true),
          hour: m[3],
          minute: m[4],
        }))
      : null
  const dayWeekPhrase =
    relaxed
      ? scan(new RegExp(String.raw`\b(${DEADLINE_DAY})\s+(${WEEK_PHRASE})${tail}`, 'i'), (m) => ({
          ...weekday(m[1], true),
          hour: m[3],
          minute: m[4],
        }))
      : null
  const bareWeek =
    relaxed
      ? scan(new RegExp(String.raw`\b(?:bis\s+)?(${WEEK_PHRASE})\b`, 'i'), () => ({
          apply: (d) => d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)),
        }))
      : null
  const hit =
    strict ||
    inSpan ||
    dateMonth ||
    dateWithMonth ||
    weekend ||
    monthEnd ||
    nextWeekday ||
    over ||
    weekPhraseDay ||
    dayWeekPhrase ||
    bareDay ||
    bareWeek
  if (!hit) return null
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  hit.apply(date)
  let hour: number | null = hit.hour != null ? Number(hit.hour) : null
  let minute = hit.minute ? Number(hit.minute) : 0
  let spanStart = hit.start
  let spanEnd = hit.end
  // Uhrzeit nachreichen, wenn der Tag-Match keine mitgebracht hat:
  // „um halb 5“, „um 17:30“, „9 uhr“, Tageszeiten wie „abends“.
  if (hour == null) {
    const addTime = (m: RegExpExecArray, h: number, min: number, expand: boolean) => {
      hour = h
      minute = min
      if (expand) {
        spanStart = Math.min(spanStart, m.index)
        spanEnd = Math.max(spanEnd, m.index + m[0].length)
      }
    }
    const halb = HALF_HOUR.exec(text)
    if (halb) {
      const t = halbTime(Number(halb[1]))
      if (t) addTime(halb, t.hour, t.minute, true)
    }
    if (hour == null) {
      const clock = CLOCK_AFTER.exec(text) || CLOCK_BARE.exec(text)
      const h = clock ? Number(clock[1]) : NaN
      const min = clock && clock[2] ? Number(clock[2]) : 0
      if (clock && h <= 23 && min <= 59) addTime(clock, h, min, true)
    }
    if (hour == null) {
      const daytime = DAYTIME.exec(text)
      if (daytime) {
        const h = DAYTIME_HOURS[daytime[1].toLocaleLowerCase()]
        if (h != null) addTime(daytime, h, 0, true)
      }
    }
  }
  let time: string | null = null
  if (hour != null) {
    if (hour > 23 || minute > 59) return null
    time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
  const remaining = `${text.slice(0, spanStart)} ${text.slice(spanEnd)}`.replace(/\s+/g, ' ').trim()
  return { date: localDate(date), time, remaining }
}

/** Wörter, die klein bleiben, obwohl sie kurz sind (GM soll GM bleiben).
 * Oma/Opa sind normale Wörter — „An Oma denken“ statt „An OMA denken“. */
const SMALL_WORD =
  /^(?:in|im|am|an|auf|aus|bei|bis|da|dem|den|der|des|die|das|du|er|es|für|ich|ihm|ihn|ist|ja|je|man|mein|mir|mit|nach|nicht|noch|nur|ob|oder|ohne|schon|sehr|sie|so|und|um|vom|von|vor|was|weil|wie|wo|zu|zum|zur|mal|ab|eh|als|auch|hab|hat|war|oma|opa|mama|papa|öl)$/i
/** Familienwörter werden normal geschrieben — „An Oma denken“, „Mama anrufen“. */
const PERSON_WORD = /^(oma|opa|mama|papa)$/i

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
    .map((word) => {
      if (PERSON_WORD.test(word)) return word[0].toLocaleUpperCase('de-DE') + word.slice(1).toLocaleLowerCase('de-DE')
      return word.length >= 2 && word.length <= 3 && !SMALL_WORD.test(word) && /^\p{Ll}{2,3}$/u.test(word)
        ? word.toLocaleUpperCase('de-DE')
        : word
    })
    .join(' ')
  // „Folie EIN“ — Partikel am Ende sprechen klein (Diktat schreit sie gern).
  t = t.replace(/\s(EIN|AUS|AN|AB|AUF|ZU)$/u, (_, w) => ` ${w.toLocaleLowerCase('de-DE')}`)
  return t.replace(/^\p{Ll}/u, (c) => c.toLocaleUpperCase('de-DE'))
}

/** Datum, Uhrzeit und Füllwörter gehören nicht in den Aufgabennamen. */
export function tidyTaskTitle(text: string): string {
  return text
    .replace(new RegExp(`\\b(?:${WEEK_PHRASE})\\b`, 'gi'), ' ')
    .replace(/\bin\s+\d{1,2}\s+(?:tagen?|wochen?)\b/gi, ' ')
    .replace(/\b(?:am\s+|zum\s+)?wochenende\b/gi, ' ')
    .replace(/\b(?:ende\s+(?:des\s+)?monats?|monatsende)\b/gi, ' ')
    .replace(/\b(?:früh|morgens|vormittags|mittags|nachmittags|abends|nachts)\b/gi, ' ')
    .replace(/\b(?:um\s+)?halb\s+\d{1,2}(?:\s*uhr)?\b/gi, ' ')
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
  // Erinnerungs-/Wecker-Sätze gehören ihrem Agenten — die neue „in N Tagen“-
  // Stufe darf sie nicht als Todo klauen.
  if (/^\s*(?:erinner|erinnere|denk(?:e)?\s+dran|weck(?:e)?\b|alarm|timer)\b/i.test(text)) return null
  if (/^\s*(?:was|wie|wann|welche|zeig|zeige|öffne|habe|hab|lösch|streich|änder)\b/i.test(text)) return null
  const day = parseLocalDeadline(text)
  if (!day) return null
  // Eine Frist in der Vergangenheit ist keine Aufgabe, sondern ein Datum in
  // einer Erinnerung/Erzählung („am 1.1.2001“) — der Todo-Weg bleibt außen.
  const todayIso = localDate(new Date())
  if (day.date < todayIso) return null
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
    // relaxed: „ändere das todo Milch auf morgen“ soll das Datum finden —
    // streng versteht der Parser nur bis/am + Tag.
    const deadline = parseLocalDeadline(updateTodo[2], new Date(), true)
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

  // I9: „mama anrufen wegen geburtstag“ — Verb vorn, trotzdem ein Todo mit
  // vollständigem Namen statt einem Stumm-Satz.
  const infinitive = INFINITIVE_TASK.exec(text)
  if (infinitive && !/[?]/.test(text)) {
    const title = polishTitle(`${infinitive[1]} ${infinitive[2]} ${infinitive[3]}`)
    if (title.length >= 2) return { kind: 'todo_create', title }
  }

  // I9: „notiere: PCR abholen“ bleibt eine Notiz — der Todo-Rest-Parser
  // (TASK_TAIL) darf ihn nicht mehr klauen.
  // P4: „Notiz oder Todo: Milch“ ist eine echte Frage — der Schreiber lässt
  // Alternativ-Fragmente stehen, damit die Ambiguität-Policy nachfragen kann.
  const noteWrite = NOTE_WRITE.exec(text)
  if (noteWrite) {
    const body = noteWrite[1].trim()
    if (!/^\s*oder\b/i.test(body) && !/\soder\s+(?:todos?|aufgaben?)\b/i.test(body)) {
      return { kind: 'note_create', body }
    }
  }

  const tail = TASK_TAIL.exec(text)
  if (tail && !/[?]/.test(text) && text.trim().length <= 60 && !/anrufen/i.test(tail[2])) {
    return { kind: 'todo_create', title: `${tail[1].trim()} ${tail[2].toLowerCase()}` }
  }

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
