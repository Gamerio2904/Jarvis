export type LastStep = {
  last_step_tool?: string
  last_step_title?: string
  last_step_when?: string
  last_step_utterance?: string
  last_medium?: string
}

const FOLLOW_UP =
  /^(und\s+)?(lösch(e|en)?(\s+das)?|das\s+löschen|vergiss?\s+das|und\s+um\s+\d{1,2}([:.]\d{2})?(\s+uhr)?|und\s+morgen\??|morgen\s+auch|stattdessen\s+um\s+\d{1,2})\s*[.?!]?$/i

const CONFIRM = /^(ja|jo|yes|ok|okay|mach(?:\s+es|\s+mal)?|bitte|passt)\s*[.!?]?$/i

const HALT = /^(?:stopp(?:e)?(?:\s+das)?|halt|pause)\s*[.!?]?$/i

const VOL = /^(?:und\s+)?(?:das\s+)?(lauter|leiser)\s*[.!?]?$/i

/** Nach TV: OK/D-Pad, nicht „ok“ als Wiederholung des letzten App-Starts. */
const TV_PAD =
  /^(ok|okay|enter|bestätigen|runter|hoch|oben|unten|links|rechts|home|zurück)\s*[.!?]?$/i

const TV_PAD_MAP: Record<string, string> = {
  ok: 'ok',
  okay: 'ok',
  enter: 'ok',
  bestätigen: 'ok',
  runter: 'runter',
  hoch: 'hoch',
  oben: 'hoch',
  unten: 'runter',
  links: 'links',
  rechts: 'rechts',
  home: 'home',
  zurück: 'zurück',
}

export function isFollowUpPhrase(text: string): boolean {
  const raw = text.trim()
  return FOLLOW_UP.test(raw) || CONFIRM.test(raw) || HALT.test(raw) || VOL.test(raw)
}

export function isConfirmPhrase(text: string): boolean {
  return CONFIRM.test(text.trim())
}

/** Wetter-Nachfragen bleiben im Wetter-Handler (`rewrite` → null). */
export function rewriteFollowUp(text: string, step?: LastStep | null): string | null {
  const raw = text.trim()
  const tool = (step?.last_step_tool ?? '').trim()
  const title = (step?.last_step_title ?? '').trim()
  const when = (step?.last_step_when ?? '').trim()
  const medium = (step?.last_medium ?? '').trim()
  const utterance = (step?.last_step_utterance ?? '').trim()

  if (/^(?:call_confirm|sms_confirm|sms_body_ask|sms_ask|phone_ask)$/.test(tool)) return null

  const vol = VOL.exec(raw)
  if (vol) {
    const up = vol[1].toLowerCase() === 'lauter'
    if (tool === 'tv' || medium === 'tv') return up ? 'Fernseher lauter' : 'Fernseher leiser'
    return null
  }

  const pad = TV_PAD.exec(raw)
  if (pad && tool === 'tv') {
    const key = TV_PAD_MAP[pad[1].toLowerCase()]
    return key ? `Fernseher ${key}` : null
  }

  if (HALT.test(raw)) {
    if (medium === 'tv' || tool === 'tv') return 'Fernseher pause'
    if (medium === 'spotify') return 'Spotify Pause'
    if (medium === 'drive' || tool === 'drive' || tool === 'fuel' || tool === 'poi') return 'Fahrmodus aus'
    if (tool === 'timer') return 'Timer aus'
    if (tool === 'alarm') return 'Wecker aus'
    return null
  }

  if (CONFIRM.test(raw)) {
    if (!tool || tool === 'todo' || tool === 'notes' || tool === 'weather') return null
    if (utterance && !CONFIRM.test(utterance) && !HALT.test(utterance)) return utterance
    return null
  }

  if (!FOLLOW_UP.test(raw)) return null
  if (!tool || tool === 'weather') return null

  const timeM = raw.match(/um\s+(\d{1,2})(?:[:.](\d{2}))?/i)
  if (timeM) {
    const hh = timeM[1].padStart(2, '0')
    const mm = (timeM[2] ?? '00').padStart(2, '0')
    const clock = `${hh}:${mm}`
    if (tool === 'alarm') return `Wecker ${clock}`
    if (tool === 'reminder') {
      return title ? `erinner mich um ${clock} an ${title}` : `erinner mich um ${clock} an Erinnerung`
    }
    if (tool === 'calendar') return title ? `Termin um ${clock} ${title}` : `Termin um ${clock} Termin`
  }

  if (/morgen/i.test(raw)) {
    const clock = /\d{1,2}[:.]\d{2}/.exec(when)?.[0] || '10:00'
    if (tool === 'calendar') return title ? `Termin morgen ${clock} ${title}` : 'Termine morgen'
    if (tool === 'alarm') return when ? `Wecker morgen ${when}` : 'Wecker morgen 07:00'
    if (tool === 'reminder') {
      return title ? `erinner mich morgen ${clock} an ${title}` : `erinner mich morgen ${clock} an Erinnerung`
    }
  }

  if (/lösch|vergiss/i.test(raw)) {
    if (tool === 'calendar') return title ? `lösche Termin ${title}` : 'lösche den letzten Termin'
    if (tool === 'alarm') return 'Wecker aus'
    if (tool === 'timer') return 'Timer aus'
    if (tool === 'reminder') return title ? `lösche Erinnerung ${title}` : 'Erinnerung aus'
    if (tool === 'todo') return title ? `lösche Todo ${title}` : 'lösche das letzte Todo'
    if (tool === 'shopping') return title ? `${title} hab ich` : null
    if (tool === 'maps' || tool === 'maps_ask') return title ? `vergiss ${title}` : null
  }

  return null
}
