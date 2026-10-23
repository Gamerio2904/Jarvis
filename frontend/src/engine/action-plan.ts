import { parseCalendarIntent } from './calendar-parse.ts'
import { leadReminderMinutes } from './reminders.ts'
import { parseReminderIntent } from './remind-parse.ts'
import { parseShopIntent } from './shopping-parse.ts'
import { promoteSplitPart, splitIntents } from './split-intents.ts'
import { parseToolIntent } from './tools-parse.ts'

export type PlanKind = 'none' | 'placeholder' | 'action'

type Clause = { phrase: string; write: boolean }

const LONG = 60

function clauseOf(phrase: string, write: boolean): Clause {
  return { phrase, write }
}

/** Eine erkennbare Teilaufgabe, sonst null. Die Formulierung steht nach „Ich“. */
export function clausePlan(text: string): Clause | null {
  const t = text.trim()
  if (!t) return null
  const cal = parseCalendarIntent(t)
  if (cal?.kind === 'create' || cal?.kind === 'move' || cal?.kind === 'rename') {
    return clauseOf('trage das in den Kalender ein', true)
  }
  if (cal?.kind === 'delete' || cal?.kind === 'delete_many' || cal?.kind === 'delete_last') {
    return clauseOf('nehme den Termin aus dem Kalender', true)
  }
  if (cal?.kind === 'list' || cal?.kind === 'open') return clauseOf('schaue in den Kalender', false)

  const shop = parseShopIntent(t)
  if (shop?.kind === 'add') return clauseOf('füge alles auf die Einkaufsliste', true)
  if (shop?.kind === 'got' || shop?.kind === 'clear') return clauseOf('streiche das von der Einkaufsliste', true)
  if (shop?.kind === 'list') return clauseOf('schaue auf die Einkaufsliste', false)

  const todo = parseToolIntent(t)
  if (todo?.kind === 'todo_create' || todo?.kind === 'todo_update') return clauseOf('setze das auf die To-do-Liste', true)
  if (todo?.kind === 'todo_delete' || todo?.kind === 'todo_delete_last' || todo?.kind === 'todo_done_first') {
    return clauseOf('hake das auf der To-do-Liste ab', true)
  }
  if (todo?.kind === 'todo_list' || todo?.kind === 'todo_due') return clauseOf('schaue auf die To-do-Liste', false)
  if (todo?.kind === 'note_create' || todo?.kind === 'note_update') return clauseOf('schreibe das auf', true)

  if (leadReminderMinutes(t)) return clauseOf('lege die Erinnerung an', true)
  const remind = parseReminderIntent(t)
  if (remind?.kind === 'create' || remind?.kind === 'ask') return clauseOf('lege die Erinnerung an', true)
  if (remind?.kind === 'list' || remind?.kind === 'agenda' || remind?.kind === 'week') {
    return clauseOf('schaue nach den Erinnerungen', false)
  }
  if (remind && remind.kind.startsWith('delete')) return clauseOf('nehme die Erinnerung raus', true)
  return null
}

function joinPhrases(bits: string[]): string {
  if (bits.length === 1) return `Ich ${bits[0]}.`
  return `Ich ${bits.slice(0, -1).join(', ')} und ${bits[bits.length - 1]}.`
}

export type ActionPlan = { kind: 'placeholder' | 'action'; line: string; writes: boolean }

/**
 * Satz, der sofort in den Chat kommt, bevor die Ausführung läuft.
 * Lange freie Prompts bekommen nur einen Platzhalter, der danach weicht.
 */
export function actionPlan(text: string): ActionPlan | null {
  const raw = text.trim()
  if (!raw) return null
  const parts = splitIntents(raw)
  const promoted = parts.length > 1 ? parts.map(promoteSplitPart) : parts
  const clauses = promoted.map((part) => clausePlan(part)).filter((c): c is Clause => Boolean(c))
  if (!clauses.length) {
    if (raw.length < LONG) return null
    return { kind: 'placeholder', line: 'Ich lese das.', writes: false }
  }
  const bits: string[] = []
  for (const clause of clauses) {
    if (!bits.includes(clause.phrase)) bits.push(clause.phrase)
  }
  return { kind: 'action', line: joinPhrases(bits), writes: clauses.some((c) => c.write) }
}

/** Alle Teile sind lokal erkannt, also laufen sie in diesem Zug, nicht als Kette. */
export function plansEveryPart(parts: string[]): boolean {
  return parts.length > 1 && parts.every((part) => clausePlan(part))
}

export function finishPlan(kind: PlanKind, lead: string, body: string, writes: boolean): string {
  const clean = body.trim()
  if (kind !== 'action' || !lead) return clean
  if (clean === lead || clean.startsWith(`${lead}\n`)) return clean
  if (!writes) return `${lead}\n\n${clean}`
  return `${lead}\n\nErledigt.\n${clean}`
}
