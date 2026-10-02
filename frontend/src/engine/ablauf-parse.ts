import { normalizeUtterance } from './utterance.ts'
import { loadSettings } from './store.ts'
import { ablaufWaiting } from './ablauf-state.ts'
import { parsePortfolioIntent } from './portfolio-parse.ts'

export type AblaufIntent =
  | { kind: 'open'; work?: string }
  | { kind: 'session'; work: string }
  | { kind: 'screen' }
  | { kind: 'close' }
  | { kind: 'clear' }
  | { kind: 'accept' }
  | { kind: 'revise'; via: 'name' | 'rest' | 'plan'; name: string; text: string }

const END = String.raw`\s*[.!?]?$`

function otherWish(): boolean {
  const s = loadSettings()
  return Boolean(
    s.proposal_pending ||
      s.last_clip_json ||
      s.last_comm_json ||
      s.last_pc_json ||
      s.last_taxi_json ||
      s.last_interrupt_json ||
      s.bot_ask_json,
  )
}

/** Parser für den Ablauf. `So` und `Ja` nur, solange eine Zeile wartet. */
export function parseAblaufIntent(text: string): AblaufIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  if (isPlanningScreenAsk(t)) return { kind: 'screen' }
  const invite = planningInvite(t)
  if (invite) return { kind: 'session', work: invite }
  if (
    /^\s*(?:lösch(?:e)?|entfern(?:e)?|streich(?:e)?|nimm\s+weg)\s+(?:bitte\s+)?(?:mir\s+)?(?:den\s+)?(?:aktuellen\s+|angezeigten\s+)?plan\b/i.test(
      t,
    )
  ) {
    return { kind: 'clear' }
  }

  const session = /^\s*plan(?:e)?\s+das\s+projekt\s*:?\s*([\s\S]*)$/i.exec(t)
  if (session) {
    return { kind: 'session', work: sessionWork(session[1] || '') }
  }
  // „Plane eine App …“ ist dieselbe Planung. Der ganze Satz bleibt die Arbeit.
  // „Plane das“ und „Plane das:“ bleiben das live Skript.
  if (/^\s*plan(?:e)?\s+(?:mir\s+)?(?:bitte\s+)?(?:mal\s+)?(?:eine?\s+app|die\s+app|eine?\s+anwendung|die\s+anwendung|ein\s+projekt)\b/i.test(t)) {
    return { kind: 'session', work: sessionWork(t) }
  }

  const named = new RegExp(String.raw`^\s*plan(?:e)?\s+das\s*:\s*([\s\S]+)$`, 'i').exec(t)
  if (named) {
    const work = named[1].trim().slice(0, 2000)
    return work ? { kind: 'open', work } : { kind: 'open' }
  }
  if (new RegExp(String.raw`^\s*plan(?:e)?\s+das${END}`, 'i').test(t)) return { kind: 'open' }

  if (new RegExp(String.raw`^\s*(?:plan|fenster)\s+zu${END}`, 'i').test(t)) return { kind: 'close' }
  if (/^\s*(?:planung\s+zu|planung\s+fertig|bin\s+fertig)$/i.test(t.replace(/[.!?]+$/g, '').trim())) {
    return { kind: 'close' }
  }
  if (planScriptOpen() && /^\s*fertig$/i.test(t.replace(/[.!?]+$/g, '').trim())) return { kind: 'close' }

  const change = new RegExp(String.raw`^\s*änder(?:e)?\s+(?:den|die|das)?\s*(.+?)\s*:\s*(.+)$`, 'i').exec(t)
  if (change) return { kind: 'revise', via: 'name', name: change[1].trim(), text: change[2].trim() }

  const rest = new RegExp(String.raw`^\s*(.+?)\s*,\s*rest\s+so${END}`, 'i').exec(t)
  if (rest) return { kind: 'revise', via: 'rest', name: rest[1].trim(), text: rest[1].trim() }

  const over = new RegExp(String.raw`^\s*(?:überarbeite|ueberarbeite)\s+den\s+plan\s*:\s*(.+)$`, 'i').exec(t)
  if (over) return { kind: 'revise', via: 'plan', name: '', text: over[1].trim() }

  if (new RegExp(String.raw`^\s*übernehmen${END}`, 'i').test(t)) return { kind: 'accept' }

  if (ablaufWaiting()) {
    if (new RegExp(String.raw`^\s*so${END}`, 'i').test(t)) return { kind: 'accept' }
    if (new RegExp(String.raw`^\s*ja${END}`, 'i').test(t) && !otherWish()) return { kind: 'accept' }
    return null
  }
  if (planScriptOpen() && new RegExp(String.raw`^\s*(?:so|go|umsetzen|leg\s+los)${END}`, 'i').test(t)) {
    return { kind: 'accept' }
  }
  return null
}

function sessionWork(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 2000)
}

function isPlanningScreenAsk(t: string): boolean {
  return (
    /^\s*(?:öffne|oeffne|zeig(?:e)?|mach(?:e)?\s+auf)\s+(?:mir\s+)?(?:bitte\s+)?(?:den\s+)?planungsbildschirm\s*[.!?]*$/i.test(t) ||
    /^\s*planungsbildschirm\s*(?:auf|öffnen|oeffnen)?\s*[.!?]*$/i.test(t)
  )
}

function planningInvite(t: string): string | null {
  if (
    !/^\s*(?:lass(?:\s+uns)?|wir\s+wollen|ich\s+will|ich\s+möchte|ich\s+moechte)\s+(?:mal\s+)?(?:zusammen\s+)?(?:eine\s+neue|eine|die|neue)?\s*(?:app|anwendung)\s+(?:planen|entwickeln|bauen|entwerfen)\s*[.!?]*$/i.test(
      t,
    )
  ) {
    return null
  }
  return 'eine neue App'
}

/** Ein Plansatz, den kein Parser angenommen hat. Das Modell darf ihn nicht als Projekt erzählen. */
export function missedPlanSentence(text: string): boolean {
  const t = normalizeUtterance((text || '').trim())
  if (!t || t.length > 2000) return false
  if (/^\s*(?:was|wie|wer|wen|wann|wo|wohin|woher|warum|wieso|weshalb|welche)\b/i.test(t)) return false
  if (parseAblaufIntent(t) || parsePortfolioIntent(t)) return false
  if (/^\s*plan(?:e)?\b/i.test(t)) return true
  if (/\b(?:neues?\s+projekt|projekt\s+(?:anlegen|erstellen)|leg(?:e)?\s+(?:mir\s+)?(?:ein\s+)?projekt\s+an)\b/i.test(t)) return true
  return false
}

function planScriptOpen(): boolean {
  const phase = loadSettings().plan_phase
  return phase === 'live' || phase === 'go'
}
