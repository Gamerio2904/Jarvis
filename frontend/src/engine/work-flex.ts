/**
 * Lose Arbeitssätze. Ein Dokument über ein Thema recherchiert, außer die
 * Gewohnheit oder der Satz selbst sagt ohne. „Wie immer“ wiederholt nur,
 * was zweimal schon da war, sonst den letzten Satz.
 */

import { dropHabit, habitAct, habitSpeech, noteHabit, setHabit } from './habits.ts'
import { loadSettings } from './store.ts'
import { frontVerb } from './verb-front.ts'

export type DocumentAsk = { topic: string; research: boolean }

const LEAD =
  /^\s*(?:(?:und\s+)?(?:bitte\s+)?(?:kannst|könntest|würdest|magst)\s+du(?:\s+mir)?(?:\s+bitte)?|ich\s+(?:will|möchte|brauch(?:e|te)?)|bitte)\s+/i

const DOC_WORD = String.raw`(?:dokument|ausarbeitung|bericht|papier)`
const ABOUT = String.raw`(?:über|ueber|zu|zum\s+thema|für|fuer)`

function cleanTopic(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '')
    .replace(/\s+(?:schreiben|erstellen|machen|verfassen|recherchieren)\s*$/i, '')
    .trim()
    .slice(0, 160)
}

function wantsResearch(text: string): boolean {
  if (/\bohne\s+(?:recherche|quellen)\b/i.test(text)) return false
  if (habitAct('dokument') === 'ohne') return false
  return true
}

/** Ein neues Dokument über ein Thema. Lesen und Löschen bleiben, was sie sind. */
export function documentAsk(text: string): DocumentAsk | null {
  let raw = text.replace(/\s+/g, ' ').trim()
  if (!raw || raw.length > 240) return null
  if (/\b(?:lies|lese|lesen|öffne|zeig|lösch)\b/i.test(raw)) return null
  raw = raw.replace(LEAD, '').replace(/^(?:mal|eben|kurz|bitte)\s+/i, '').trim()
  const patterns = [
    new RegExp(
      String.raw`^(?:schreib|erstell|mach|verfass|formulier)(?:e|en|st)?(?:\s+mir)?(?:\s+(?:mal|eben|kurz|bitte))?\s+(?:ein(?:e[nm])?\s+)?${DOC_WORD}\s+${ABOUT}\s+(.+?)\s*$`,
      'i',
    ),
    new RegExp(String.raw`^(?:ein(?:e[nm])?\s+)?${DOC_WORD}\s+${ABOUT}\s+(.+?)\s*$`, 'i'),
    new RegExp(
      String.raw`^(?:ein(?:e[nm])?\s+)?${DOC_WORD}\s+${ABOUT}\s+(.+?)\s+(?:schreiben|erstellen|machen|verfassen)\s*$`,
      'i',
    ),
  ]
  for (const pattern of patterns) {
    const hit = pattern.exec(raw)
    if (!hit) continue
    const topic = cleanTopic(hit[1] || '')
    if (topic.length < 2) return null
    return { topic, research: wantsResearch(raw) }
  }
  return null
}

function isHabitSentence(text: string): boolean {
  return (
    /\bbei\s+dokumenten\b/i.test(text) ||
    /^\s*was\s+(?:sind|habe\s+ich\s+für)\s+(?:meine\s+)?gewohnheiten\b/i.test(text) ||
    /^\s*(?:vergiss|lösche)\s+(?:die\s+)?gewohnheiten\b/i.test(text)
  )
}

export function replyForHabit(text: string): string | null {
  const raw = text.replace(/\s+/g, ' ').trim()
  if (!raw) return null
  if (/\bbei\s+dokumenten\s+(?:immer\s+)?recherchier/i.test(raw)) {
    setHabit('dokument', 'recherche')
    return 'Gewohnheit: Bei einem Dokument recherchiere ich.'
  }
  if (/\bbei\s+dokumenten\s+(?:nicht|nie|kein(?:e)?)\b/i.test(raw) && /\brecherchier/i.test(raw)) {
    setHabit('dokument', 'ohne')
    return 'Gewohnheit: Bei einem Dokument recherchiere ich nicht.'
  }
  if (/^\s*(?:vergiss|lösche)\s+(?:die\s+)?gewohnheiten\s*[.!?]*$/i.test(raw)) {
    dropHabit('dokument')
    return 'Die Gewohnheiten zu Dokumenten sind weg.'
  }
  if (/^\s*was\s+(?:sind|habe\s+ich\s+für)\s+(?:meine\s+)?gewohnheiten\s*[.!?]*$/i.test(raw)) return habitSpeech()
  return null
}

export function documentWithoutResearch(text: string): string | null {
  const doc = documentAsk(text)
  if (!doc || doc.research) return null
  noteHabit('dokument', 'ohne')
  return `Dokument zu ${doc.topic}. Ohne Recherche bleibt nur der Satz.`
}

/** Wiederholung und kurze Nachsätze. Ein klarer Befehl bleibt unangetastet. */
export function flexAsk(text: string): string | null {
  const raw = text.replace(/\s+/g, ' ').trim()
  if (!raw || raw.length > 240) return null
  const step = loadSettings()
  if (/^(?:wie\s+immer|wie\s+letztes\s+mal|nochmal\s+so|dasselbe\s+nochmal)\s*[.!?]*$/i.test(raw)) {
    const tool = (step.last_step_tool || '').trim()
    const title = (step.last_step_title || '').trim()
    const act = tool ? habitAct(`nach:${tool}`) : null
    if (act === 'recherche' && title) return `Recherchiere tief: ${title}`
    if (act === 'download') return 'Lade alle Dateien zur App runter'
    if (act === 'fertig') return 'Fertig'
    const prev = (step.last_step_utterance || '').trim()
    if (prev && prev.toLowerCase() !== raw.toLowerCase() && !/^(?:wie\s+immer|wie\s+letztes\s+mal|nochmal\s+so)/i.test(prev)) {
      return prev
    }
    return null
  }
  if (
    /^(?:und\s+)?(?:recherchier(?:e|en)?(?:\s+(?:das|dazu|mal))?|schau(?:\s+mal)?\s+(?:dazu\s+)?nach|such(?:e)?\s+dazu|deep\s*resear\w*(?:\s+dazu)?)\s*[.!?]*$/i.test(
      raw,
    )
  ) {
    const title = (step.last_step_title || '').trim()
    if (!title) return null
    return `Recherchiere tief: ${title}`
  }
  return null
}

/** Wortstellung und Gewohnheit. Null, wenn der Satz schon klar ist. */
export function looseAsk(text: string): string | null {
  if (isHabitSentence(text) || documentAsk(text)) return null
  const fronted = frontVerb(text) || text
  const flexed = flexAsk(fronted)
  const next = flexed || (fronted !== text ? fronted : '')
  return next && next !== text ? next : null
}

export function noteSequence(prevTool: string, text: string): void {
  const tool = prevTool.trim()
  if (!tool) return
  const act = sequenceAct(text)
  if (!act) return
  noteHabit(`nach:${tool}`, act)
}

function sequenceAct(text: string): string | null {
  if (documentAsk(text)?.research) return 'recherche'
  if (/\b(?:recherchier(?:e|en)?|deep\s*resear)/i.test(text)) return 'recherche'
  if (/^\s*lade\b/i.test(text) && /\b(?:datei|datein|runter|herunter|psp|sprint)/i.test(text)) return 'download'
  if (/^\s*fertig\s*[.!?]*$/i.test(text)) return 'fertig'
  return null
}

export function dressDocument(ask: string, reply: string): string {
  const doc = documentAsk(ask)
  if (!doc?.research) return reply
  noteHabit('dokument', 'recherche')
  if (reply.startsWith('Dokument zu ')) return reply
  return `Dokument zu ${doc.topic}. Die Quellen stehen dabei.\n\n${reply}`
}
