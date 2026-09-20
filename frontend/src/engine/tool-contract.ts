/**
 * Der Werkzeug-Vertrag: was das Modell **vorschlagen** darf.
 *
 * Ausführen darf es nichts. Ein Vorschlag wird in einen deutschen Satz
 * übersetzt, den die Parser von heute verstehen — und erst dieser Satz geht
 * durch dieselbe Routing-Kette wie eine getippte Äußerung. Damit ist der
 * Vollzug weiterhin deterministisch: das Modell kann die Formulierung
 * verschieben, nie die Ausführung erzwingen.
 *
 * Namen, Feldnamen und Beschreibungen sind **englisch**. Sie erreichen den
 * Nutzer nie und werden auf Englisch zuverlässiger befolgt
 * ([`69-modell-grundlagen.md`](../../../docs/69-modell-grundlagen.md) §2.2).
 * Alles, was gesprochen oder angezeigt wird, bleibt deutsch.
 */

import { flagFromTitle, flagUtterance } from './ui-action.ts'

/** Ein flacher Beutel, weil `strict` alle Felder verlangt. Fehlt eins: `null`. */
export type ToolArgs = {
  minutes: string | null
  time: string | null
  date: string | null
  title: string | null
  state: string | null
}

export const ARG_NAMES = ['minutes', 'time', 'date', 'title', 'state'] as const

export type ToolContract = {
  /** Englischer Name, den das Modell nennt. */
  name: string
  /**
   * Agent, der den übersetzten Satz bestätigen muss. Sonst kein Vollzug.
   *
   * Ob der Nutzer zusätzlich bestätigen muss, steht **nicht** hier: es folgt
   * aus dem `sideEffect` des Agenten im Katalog. Ein Feld, das man beim
   * nächsten Werkzeug vergessen kann, wäre genau die Lücke, die dieser Sprint
   * nicht haben darf.
   */
  agent: string
  description: string
  uses: Array<keyof ToolArgs>
  /** Der deutsche Satz, den die Parser sehen. `null` = Argumente taugen nicht. */
  render: (args: ToolArgs) => string | null
}

const CONTROL = /[\u0000-\u001f\u007f]/g

/**
 * Freitext aus einer Modellantwort. Er landet in einer Erinnerung oder auf
 * einer Liste, also darf er kein Steuerzeichen und keine Romanlänge haben.
 * Ein zweiter Befehl darin ist ungefährlich: der übersetzte Satz geht ohne
 * `splitIntents` an genau **einen** Agenten.
 */
export function cleanTitle(raw: string | null): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim().replace(/^["'„»]+|["'"«]+$/g, '')
  if (t.length < 2 || t.length > 70) return null
  return t
}

function minutesOf(raw: string | null): number | null {
  if (typeof raw !== 'string' || !/^\d{1,3}$/.test(raw.trim())) return null
  const n = Number(raw.trim())
  return n >= 1 && n <= 600 ? n : null
}

/** `HH:MM` in 24 Stunden. Alles andere ist kein Zeitpunkt. */
function clockOf(raw: string | null): { h: number; m: number } | null {
  if (typeof raw !== 'string') return null
  const hit = /^\s*([01]?\d|2[0-3]):([0-5]\d)\s*$/.exec(raw)
  if (!hit) return null
  return { h: Number(hit[1]), m: Number(hit[2]) }
}

function clockText(c: { h: number; m: number }): string {
  return `${c.h}:${String(c.m).padStart(2, '0')} Uhr`
}

/**
 * `today` oder `tomorrow`. Ein Datum weiter draußen kann der Erinnerungs-
 * Parser nicht — deshalb steht es auch nicht im Vertrag. Ein Werkzeug, das
 * mehr verspricht, als der Parser einlöst, endet in „ich habe es notiert"
 * ohne Notiz.
 */
function nearDayOf(raw: string | null): string | null {
  if (raw == null || raw === '') return ''
  if (typeof raw !== 'string') return null
  const t = raw.trim().toLowerCase()
  if (t === 'today' || t === 'heute') return ''
  if (t === 'tomorrow' || t === 'morgen') return 'morgen'
  return null
}

/** `today`, `tomorrow` oder `YYYY-MM-DD` — der Kalender nimmt auch Daten. */
function dayOf(raw: string | null): string | null {
  const near = nearDayOf(raw)
  if (near != null) return near === '' ? 'heute' : near
  const hit = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(raw).trim())
  if (!hit) return null
  const month = Number(hit[2])
  const day = Number(hit[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return `am ${day}.${month}.`
}

export const TOOL_CONTRACTS: ToolContract[] = [
  {
    name: 'set_timer',
    agent: 'timer',
    description: 'Start a countdown timer that rings after a number of minutes.',
    uses: ['minutes'],
    render: (a) => {
      const m = minutesOf(a.minutes)
      return m == null ? null : `stell einen Timer für ${m} Minuten`
    },
  },
  {
    name: 'set_alarm',
    agent: 'alarm',
    description: 'Set an alarm clock for a time of day, given as HH:MM.',
    uses: ['time'],
    render: (a) => {
      const c = clockOf(a.time)
      return c == null ? null : `stell den Wecker auf ${clockText(c)}`
    },
  },
  {
    name: 'create_reminder',
    agent: 'reminder',
    description:
      'Remind the user of something today or tomorrow. Needs a short subject and a time as HH:MM. For a date further out use create_calendar_event.',
    uses: ['title', 'time', 'date'],
    render: (a) => {
      const c = clockOf(a.time)
      const title = cleanTitle(a.title)
      const day = nearDayOf(a.date)
      if (c == null || !title || day == null) return null
      return `erinnere mich ${day ? `${day} ` : ''}um ${clockText(c)} an ${title}`.replace(/\s+/g, ' ')
    },
  },
  {
    name: 'create_calendar_event',
    agent: 'calendar',
    description: 'Put an appointment in the calendar. Needs a short title, a date and a time as HH:MM.',
    uses: ['title', 'date', 'time'],
    render: (a) => {
      const c = clockOf(a.time)
      const title = cleanTitle(a.title)
      const day = dayOf(a.date)
      if (c == null || !title || !day) return null
      return `termin ${day} um ${clockText(c)} ${title}`
    },
  },
  {
    name: 'add_shopping_item',
    agent: 'shopping',
    description: 'Put one item on the shopping list.',
    uses: ['title'],
    render: (a) => {
      const title = cleanTitle(a.title)
      return title ? `setz ${title} auf die Liste` : null
    },
  },
  {
    name: 'switch_tv',
    agent: 'tv',
    description: 'Turn the television on or off. State is either "on" or "off".',
    uses: ['state'],
    render: (a) => {
      const s = (a.state || '').trim().toLowerCase()
      if (s !== 'on' && s !== 'off') return null
      return `mach den Fernseher ${s === 'on' ? 'an' : 'aus'}`
    },
  },
  {
    name: 'open_watchlist',
    agent: 'watchlist',
    description: 'Open the watchlist overlay. No arguments.',
    uses: [],
    render: () => 'Öffne Watchliste',
  },
  {
    name: 'open_favorites',
    agent: 'watchlist',
    description: 'Open the favorites tab of the film overlay. No arguments.',
    uses: [],
    render: () => 'Öffne Lieblinge',
  },
  {
    name: 'open_settings',
    agent: 'app',
    description: 'Open Jarvis settings. No arguments.',
    uses: [],
    render: () => 'Öffne Einstellungen',
  },
  {
    name: 'close_overlay',
    agent: 'app',
    description: 'Close the top overlay sheet. No arguments.',
    uses: [],
    render: () => 'Overlay zu',
  },
  {
    name: 'set_jarvis_flag',
    agent: 'app',
    description:
      'Toggle an allowlisted Jarvis setting. Title is Research, Gemini, Werkzeug-Vorschlag, Lage-Akzent, Fahrt-Stimme, Kugel-Lite or Fernseher. State is on or off.',
    uses: ['title', 'state'],
    render: (a) => {
      const flag = flagFromTitle(a.title)
      const s = (a.state || '').trim().toLowerCase()
      if (!flag || (s !== 'on' && s !== 'off')) return null
      return flagUtterance(flag, s === 'on')
    },
  },
]

export const TOOL_NAMES = TOOL_CONTRACTS.map((t) => t.name)

export function contractOf(name: string): ToolContract | null {
  return TOOL_CONTRACTS.find((t) => t.name === name) ?? null
}

/**
 * Das Schema, das der Decoder erzwingt. `strict` verlangt: alle Felder
 * `required`, keine offenen Maps, kein `oneOf` an der Wurzel. Optionale
 * Argumente sind deshalb `nullable`, nicht `optional`.
 */
export function toolJsonSchema(): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['tool', 'args'],
    properties: {
      tool: {
        type: 'string',
        enum: [...TOOL_NAMES, 'none'],
        description: 'The tool that fits the request, or "none" if no tool fits.',
      },
      args: {
        type: 'object',
        additionalProperties: false,
        required: [...ARG_NAMES],
        properties: {
          minutes: { type: ['string', 'null'], description: 'Whole minutes, 1 to 600.' },
          time: { type: ['string', 'null'], description: 'Time of day as HH:MM, 24 hour.' },
          date: { type: ['string', 'null'], description: '"today", "tomorrow" or YYYY-MM-DD.' },
          title: { type: ['string', 'null'], description: 'Short subject, at most 70 characters.' },
          state: { type: ['string', 'null'], description: '"on" or "off".' },
        },
      },
    },
  }
}

/** Die Werkzeugliste für den Prompt — knapp, weil das Schema den Rest erzwingt. */
export function toolSystemPrompt(): string {
  const lines = TOOL_CONTRACTS.map((t) => `- ${t.name}(${t.uses.join(', ')}): ${t.description}`)
  return [
    'You map a German request to at most one tool call. You never execute anything.',
    'Answer with the tool name and its arguments. Unused arguments are null.',
    'If no tool clearly fits, answer with "none". Guessing is worse than "none".',
    'Tools:',
    ...lines,
  ].join('\n')
}

export type ParsedProposal = { tool: string; args: ToolArgs }

/** Modellantwort einlesen. Alles, was nicht dem Vertrag entspricht, fällt hier. */
export function readProposal(raw: unknown): ParsedProposal | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>
  const tool = typeof obj.tool === 'string' ? obj.tool.trim() : ''
  if (!tool || tool === 'none') return null
  if (!contractOf(tool)) return null
  const bag = (obj.args && typeof obj.args === 'object' && !Array.isArray(obj.args) ? obj.args : {}) as Record<
    string,
    unknown
  >
  const args = {} as ToolArgs
  for (const key of ARG_NAMES) {
    const value = bag[key]
    args[key] = typeof value === 'string' ? value : typeof value === 'number' ? String(value) : null
  }
  return { tool, args }
}

/** Der deutsche Satz zu einem Vorschlag, oder `null`, wenn er nicht taugt. */
export function utteranceFor(p: ParsedProposal): string | null {
  const contract = contractOf(p.tool)
  if (!contract) return null
  const text = contract.render(p.args)
  if (!text) return null
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Die dritte Schranke: **derselbe** Agent muss den übersetzten Satz
 * beanspruchen, den das Werkzeug verspricht. Sonst passiert nichts.
 *
 * Das fängt auch den geschmuggelten Zweitbefehl ab. Ein Betreff wie „mach den
 * Fernseher an" in einer Erinnerung lässt den Satz beim Fernseher landen
 * statt bei der Erinnerung — die Kennungen weichen ab, der Zug fällt aus. Die
 * Erinnerung bleibt ungesetzt; das ist der richtige Ausgang, denn ausgeführt
 * würde sonst etwas anderes als vorgeschlagen.
 */
export function confirmedUtterance(p: ParsedProposal, route: (text: string) => string | null): string | null {
  const contract = contractOf(p.tool)
  const text = utteranceFor(p)
  if (!contract || !text) return null
  return route(text) === contract.agent ? text : null
}

const DOMAIN =
  /\b(timer|wecker|erinner\w*|termin|kalender|einkaufs?liste|einkaufen|liste|notiz|todo|aufgabe|fernseher|tv|glotze|watchliste|liebling\w*|overlay|folie|einstellungen|settings|lage|kugel|schicht|debug)\b/i

/** Fragewörter am Anfang: „Was ist ein Timer" ist keine Anweisung. */
const QUESTION = /^\s*(was|wie|wer|wen|wem|wann|wo|wohin|woher|warum|wieso|weshalb|welche[rnsm]?|gibt|ist|sind|hast|habe|kenn\w*)\b/i

/** Befehlsformen und die höfliche Umschreibung davon. */
const COMMAND =
  /^\s*(?:und\s+)?(?:bitte\s+)?(?:öffne|zeig|schließ|wechsel|blende|stell|setz|mach|schalt|erinner|weck|trag|leg|schreib|füg|lösch|starte?|plan|notier|richte|nimm|pack|kauf|hol|denk)\w*\b/i
const POLITE = /^\s*(?:und\s+)?(?:bitte\s+)?(?:kannst|kannste|könntest|würdest|magst|willst)\s+du\b|^\s*ich\s+(?:will|möchte|muss|brauche)\b/i

/**
 * Darf dieser Zug einen Modellvorschlag kosten?
 *
 * Der Vorschlagsweg läuft nur, wo er etwas gutmachen kann: bei einer
 * **Anweisung** aus einer Werkzeug-Domäne, die kein Parser erkannt hat.
 * Normaler Smalltalk und Wissensfragen gehen weiter direkt und gestreamt ans
 * Modell — sonst hätte dieser Sprint die Latenz des häufigsten Falls für den
 * seltenen verschlechtert.
 */
export function looksCommandish(text: string): boolean {
  const t = text.trim()
  if (t.length < 6 || t.length > 160) return false
  if (!DOMAIN.test(t)) return false
  const polite = POLITE.test(t)
  if (QUESTION.test(t) && !polite) return false
  return polite || COMMAND.test(t)
}
