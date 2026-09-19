import { normalizeUtterance } from './utterance.ts'
import { parseToolIntent } from './tools-parse.ts'
import { parseTeachIntent } from './teach-parse.ts'
import { isMemoryWrite } from './memory-parse.ts'
import { parseReminderIntent } from './remind-parse.ts'

export type IdeaIntent =
  | { kind: 'create'; title: string; body: string }
  | { kind: 'list'; all?: boolean }
  | { kind: 'park'; query?: string; index?: number }
  | { kind: 'done'; query?: string; index?: number }
  | { kind: 'show_plan'; query?: string; index?: number }
  | { kind: 'fill_plan'; query?: string; index?: number }
  | { kind: 'add_line'; line: string; sprint?: number; query?: string; index?: number }
  | { kind: 'custom'; title: string; ziel: string; query?: string; index?: number }
  | { kind: 'strike'; n: string; query?: string; index?: number }
  | { kind: 'remind'; target: string; due?: Date; whenLabel?: string; query?: string; index?: number }
  | { kind: 'todo_sprint'; n: number }

const SKIP_NOTE = /^\s*(?:notiz|todo|to-?do|aufgabe|ich\s+muss)\b/i
const SKIP_MEM = /^\s*merk(?:e)?\s+dir\s+ich\s+mag\b/i
const SKIP_TEACH = /^\s*(?:lern(?:e)?\s+das|fachwissen)\b/i

function firstSentence(raw: string): { title: string; body: string } {
  const t = raw.replace(/\s+/g, ' ').trim().replace(/^[.:;,\-–—]\s*/, '')
  const cut = t.search(/[.!?]\s+/)
  const title = (cut > 0 ? t.slice(0, cut) : t).slice(0, 80).trim()
  const body = (cut > 0 ? t.slice(cut + 1) : '').trim()
  return { title, body }
}

function indexOf(raw: string): number | undefined {
  const n = Number(raw)
  return n >= 1 && n <= 40 ? n : undefined
}

function refOf(raw: string | undefined): { query?: string; index?: number } {
  const s = (raw || '').trim()
  if (!s) return {}
  if (/^\d{1,2}$/.test(s)) return { index: indexOf(s) }
  return { query: s.replace(/[.!?]+$/, '').trim() }
}

const REL = /^\s*in\s+(\d+)\s+(minuten?|stunden?|tage(?:n)?|tag|wochen?|woche)\s*$/i

export function dueFromRel(raw: string, now = new Date()): { due: Date; whenLabel: string } | null {
  const m = REL.exec(raw.trim())
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n) || n < 1 || n > 400) return null
  const unit = m[2].toLowerCase()
  const d = new Date(now)
  if (unit.startsWith('min')) d.setMinutes(d.getMinutes() + n)
  else if (unit.startsWith('stund')) d.setHours(d.getHours() + n)
  else if (unit.startsWith('woch')) d.setDate(d.getDate() + n * 7)
  else d.setDate(d.getDate() + n)
  const whenLabel = `in ${n} ${m[2]}`
  return { due: d, whenLabel }
}

export function parseIdeaIntent(text: string): IdeaIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  if (SKIP_NOTE.test(t) || SKIP_MEM.test(t) || SKIP_TEACH.test(t)) return null
  if (parseToolIntent(t)) return null
  if (parseTeachIntent(t)) return null
  if (isMemoryWrite(t) && !/\bidee\b/i.test(t)) return null

  const remindIdea = /^\s*erinner(?:e)?\s+mich(?:\s+in\s+(.+?))?\s+an\s+(?:die\s+)?idee\s+(.+)$/i.exec(t)
  if (remindIdea) {
    const rel = remindIdea[1] ? dueFromRel(remindIdea[1]) : null
    const ref = refOf(remindIdea[2])
    if (!remindIdea[1]) return { kind: 'remind', target: 'idea', ...ref }
    if (!rel) return { kind: 'remind', target: 'idea', ...ref }
    return { kind: 'remind', target: 'idea', due: rel.due, whenLabel: rel.whenLabel, ...ref }
  }
  const remindSprint = /^\s*erinner(?:e)?\s+mich(?:\s+in\s+(.+?))?\s+an\s+sprint\s+(c?\d+)\s*(?:für\s+idee\s+(.+))?$/i.exec(t)
  if (remindSprint) {
    const rel = remindSprint[1] ? dueFromRel(remindSprint[1]) : null
    const n = remindSprint[2].toUpperCase()
    const ref = refOf(remindSprint[3])
    if (!remindSprint[1]) return { kind: 'remind', target: `sprint ${n}`, ...ref }
    if (!rel) return { kind: 'remind', target: `sprint ${n}`, ...ref }
    return { kind: 'remind', target: `sprint ${n}`, due: rel.due, whenLabel: rel.whenLabel, ...ref }
  }

  if (parseReminderIntent(t)) return null

  const todoSprint = /^\s*mach(?:e)?\s+sprint\s+(\d+)\s+zum\s+todo\s*$/i.exec(t)
  if (todoSprint) return { kind: 'todo_sprint', n: Number(todoSprint[1]) }

  if (/^\s*(?:zeig(?:e)?(?:\s+mir)?(?:\s+meine)?|meine)\s+ideen\s*$/i.test(t) || /^\s*was\s+liegt\s+an\s+ideen\s*\??\s*$/i.test(t)) {
    return { kind: 'list' }
  }
  if (/^\s*alle\s+ideen\s*$/i.test(t)) return { kind: 'list', all: true }

  const parkN = /^\s*(?:park(?:e)?(?:\s+die)?\s+)?idee\s+(\d+)\s+parken\s*$/i.exec(t)
  if (parkN) return { kind: 'park', index: indexOf(parkN[1]) }
  const parkQ = /^\s*park(?:e)?(?:\s+die)?\s+idee\s+(.+)$/i.exec(t)
  if (parkQ) return { kind: 'park', ...refOf(parkQ[1]) }

  const doneN = /^\s*idee\s+(\d+)\s+(?:ist\s+)?(?:erledigt|weg)\s*$/i.exec(t)
  if (doneN) return { kind: 'done', index: indexOf(doneN[1]) }
  const doneQ = /^\s*idee\s+(.+)\s+(?:ist\s+)?erledigt\s*$/i.exec(t)
  if (doneQ) return { kind: 'done', ...refOf(doneQ[1]) }

  const show = /^\s*zeig(?:e)?(?:\s+mir)?(?:\s+den)?\s+sprintplan(?:\s+für)?(?:\s+idee)?\s*(.*)$/i.exec(t)
  if (show && /\bsprintplan\b/i.test(t) && !/\bmach|\bfüll|\bfuell|\bplane?\b/i.test(t)) {
    return { kind: 'show_plan', ...refOf(show[1]) }
  }
  const planVon = /^\s*plan\s+(?:von|für)\s+idee\s+(.+)$/i.exec(t)
  if (planVon) return { kind: 'show_plan', ...refOf(planVon[1]) }

  const fill =
    /^\s*(?:mach(?:e)?(?:\s+einen)?\s+sprintplan(?:\s+für)?(?:\s+idee)?|füll(?:e)?(?:\s+den)?(?:\s+sprint)?plan(?:\s+für)?(?:\s+idee)?|plan(?:e)?\s+idee)\s+(.+)$/i.exec(
      t,
    )
  if (fill) return { kind: 'fill_plan', ...refOf(fill[1]) }

  const nimm = /^\s*nimm\s+in\s+sprint\s+(\d+)\s+(.+)$/i.exec(t)
  if (nimm) return { kind: 'add_line', sprint: Number(nimm[1]), line: nimm[2].trim() }
  const erg = /^\s*ergänz(?:e)?(?:\s+den)?(?:\s+plan)?(?:\s+um)?\s+(.+)$/i.exec(t)
  if (erg) return { kind: 'add_line', line: erg[1].trim() }

  const extra = /^\s*(?:custom\s+sprint(?:\s+für)?(?:\s+idee)?|extra\s+sprint)\s*[:\s]+(.+)$/i.exec(t)
  if (extra) {
    const rest = extra[1].trim()
    const forIdea = /\s+für\s+idee\s+(.+)$/i.exec(rest)
    const title = (forIdea ? rest.slice(0, forIdea.index) : rest).trim()
    return { kind: 'custom', title, ziel: title, ...refOf(forIdea?.[1]) }
  }

  const strike = /^\s*streich(?:e)?\s+sprint\s+(c?\d+)\s*$/i.exec(t)
  if (strike) return { kind: 'strike', n: strike[1].toUpperCase() }

  const create =
    /^\s*(?:idee[:\s]+|neue\s+idee\s+|merk(?:e)?\s+dir\s+die\s+idee\s+|ich\s+hab(?:e)?(?:\s+da)?(?:\s+ne|\s+eine)?\s+idee[:\s]+)\s*(.+)$/i.exec(
      t,
    )
  if (create) {
    const { title, body } = firstSentence(create[1])
    if (title.length < 2) return null
    return { kind: 'create', title, body }
  }
  return null
}
