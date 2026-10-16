import { normalizeUtterance } from './utterance.ts'
import { loadSettings } from './store.ts'
import { ablaufWaiting } from './ablauf-state.ts'
import { parsePortfolioIntent } from './portfolio-parse.ts'

export type AblaufIntent =
  | { kind: 'open'; work?: string }
  | { kind: 'session'; work: string }
  | { kind: 'blank' }
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
  const original = text.trim()
  const t = normalizeUtterance(original)
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
  // Ohne Titel: leere Datei, der Name kommt in der nächsten Antwort.
  if (untitledProjectAsk(t)) return { kind: 'blank' }
  if (/^\s*plan(?:e)?\s+(?:mir\s+)?(?:bitte\s+)?(?:mal\s+)?(?:eine?\s+(?:neue\s+|weitere\s+)?app|die\s+app|eine?\s+(?:neue\s+)?anwendung|die\s+anwendung|ein\s+(?:neues\s+)?projekt)\b/i.test(t)) {
    return { kind: 'session', work: sessionWork(t) }
  }

  const named = new RegExp(String.raw`^\s*plan(?:e)?\s+das\s*:\s*([\s\S]+)$`, 'i').exec(t)
  if (named) {
    let work = named[1].trim()
    const rawNamed = /^\s*plan(?:e)?\s+das\s*:\s*([\s\S]+)$/i.exec(original.replace(/\.+\s*$/g, '').trim())
    const rawWork = rawNamed?.[1].trim()
    if (rawWork && rawWork.replace(/!+\s*$/g, '').trim() === work) work = rawWork
    work = work.slice(0, 2000)
    return work ? { kind: 'open', work } : { kind: 'open' }
  }
  if (new RegExp(String.raw`^\s*plan(?:e)?\s+das${END}`, 'i').test(t)) return { kind: 'open' }

  if (new RegExp(String.raw`^\s*(?:plan|fenster)\s+zu${END}`, 'i').test(t)) return { kind: 'close' }
  if (new RegExp(String.raw`^\s*plan\s+aus${END}`, 'i').test(t)) return { kind: 'close' }
  if (/^\s*planungsmodus\s+(?:aus|beenden|zu|stoppen|stopp)\s*[.!?]*$/i.test(t)) return { kind: 'close' }
  if (
    /^\s*(?:planung\s+zu|planung\s+fertig|planung\s+aus|planung\s+beenden|plan\s+beenden|bin\s+fertig)$/i.test(
      t.replace(/[.!?]+$/g, '').trim(),
    )
  ) {
    return { kind: 'close' }
  }
  // „Beende die Planung“ ist derselbe Schluss. „Beende den Scan“ bleibt der Scan.
  if (
    new RegExp(
      String.raw`^\s*(?:beende|beenden|bennede|beenende|stoppe|stopp)(?:\s+bitte)?(?:\s+mal)?\s+(?:die\s+|den\s+|das\s+)?(?:planung|planungsmodus|planungsbildschirm|planen|plan)${END}`,
      'i',
    ).test(t)
  ) {
    return { kind: 'close' }
  }
  if (
    new RegExp(
      String.raw`^\s*(?:planungsmodus|planungsbildschirm|planung)\s+(?:bitte\s+)?(?:beenden|beende|stoppen|stopp)${END}`,
      'i',
    ).test(t)
  ) {
    return { kind: 'close' }
  }
  if (
    new RegExp(
      String.raw`^\s*(?:schließ(?:e)?|schliess(?:e)?)\s+(?:bitte\s+)?(?:die\s+)?planung${END}`,
      'i',
    ).test(t)
  ) {
    return { kind: 'close' }
  }
  if (/^\s*h(?:ö|oe)r(?:e)?\s+auf\s+(?:zu\s+planen|mit\s+(?:der\s+)?planung)$/i.test(t.replace(/[.!?]+$/g, '').trim())) {
    return { kind: 'close' }
  }
  if (planScriptOpen() && /^\s*fertig$/i.test(t.replace(/[.!?]+$/g, '').trim())) return { kind: 'close' }

  const change = new RegExp(String.raw`^\s*änder(?:e)?\s+(?:den|die|das)?\s*(.+?)\s*:\s*(.+)$`, 'i').exec(t)
  if (change && planScriptOpen()) return { kind: 'revise', via: 'name', name: change[1].trim(), text: change[2].trim() }

  const rest = new RegExp(String.raw`^\s*(.+?)\s*,\s*rest\s+so${END}`, 'i').exec(t)
  if (rest && planScriptOpen()) return { kind: 'revise', via: 'rest', name: rest[1].trim(), text: rest[1].trim() }

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
    /^\s*(?:öffne|oeffne|zeig(?:e)?|mach(?:e)?\s+auf)\s+(?:mir\s+)?(?:bitte\s+)?(?:den\s+|die\s+)?(?:planungsbildschirm|planungsmodus|tischplatte)\s*[.!?]*$/i.test(t) ||
    /^\s*(?:planungsbildschirm|planungsmodus)\s*(?:auf|öffnen|oeffnen|an)?\s*[.!?]*$/i.test(t)
  )
}

function untitledProjectAsk(t: string): boolean {
  const bare = t.replace(/[.!?]+$/g, '').trim()
  if (
    /^(?:öffne|oeffne|zeig(?:e)?|mach(?:e)?\s+auf|leg(?:e)?(?:\s+an)?|erstell(?:e)?|starte|anlegen)\s+(?:mir\s+)?(?:bitte\s+)?(?:mal\s+)?(?:eine\s+)?(?:neue\s+|leere\s+)?(?:datei|projektdatei)$/i.test(
      bare,
    )
  ) {
    return true
  }
  if (/^(?:neue|leere)\s+(?:datei|projektdatei)$/i.test(bare)) return true
  if (/^(?:öffne|oeffne)\s+(?:mir\s+)?(?:bitte\s+)?(?:eine\s+)?leere\s+datei$/i.test(bare)) return true
  if (/^(?:plan(?:e)?|starte|erstell(?:e)?|leg(?:e)?\s+an)\s+(?:mir\s+)?(?:bitte\s+)?(?:mal\s+)?(?:ein\s+)?(?:neues\s+)?projekt$/i.test(bare)) {
    return true
  }
  if (/^leg(?:e)?\s+(?:mir\s+)?(?:bitte\s+)?(?:ein\s+)?(?:neues\s+)?projekt\s+an$/i.test(bare)) return true
  if (/^(?:neues\s+projekt|leeres\s+projekt)\s+(?:anlegen|erstellen|planen|starten|aufmachen)$/i.test(bare)) return true
  if (
    /^(?:ich\s+(?:will|möchte|moechte)|lass(?:\s+uns)?)\s+(?:mal\s+)?(?:ein\s+)?(?:neues\s+)?projekt\s+(?:planen|anlegen|erstellen|starten|aufmachen)$/i.test(
      bare,
    )
  ) {
    return true
  }
  return false
}

function planningInvite(t: string): string | null {
  const match = /^\s*(?:lass(?:\s+uns)?|wir\s+wollen|ich\s+will|ich\s+möchte|ich\s+moechte)\s+(?:mal\s+)?(?:zusammen\s+)?(?:eine\s+neue|eine|die|neue)?\s*(?:app|anwendung)(?:\s+(?:für|fuer)\s+(.+?))?\s+(?:planen|entwickeln|bauen|entwerfen)\s*[.!?]*$/i.exec(t)
  if (!match) return null
  const topic = (match[1] || '').replace(/[.!?]+$/g, '').trim()
  return topic ? topic.slice(0, 72) : 'eine neue App'
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
