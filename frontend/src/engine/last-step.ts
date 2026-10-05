export type LastStep = {
  last_step_tool?: string
  last_step_title?: string
  last_step_when?: string
}

const FOLLOW_UP =
  /^(und\s+)?(lösch(e|en)?(\s+das)?|das\s+löschen|vergiss?\s+das|und\s+um\s+\d{1,2}([:.]\d{2})?(\s+uhr)?|und\s+morgen\??|morgen\s+auch|stattdessen\s+um\s+\d{1,2})\s*[.?!]?$/i

export function isFollowUpPhrase(text: string): boolean {
  return FOLLOW_UP.test(text.trim())
}

/** Wetter-Nachfragen bleiben im Wetter-Handler (`rewrite` → null). */
export function rewriteFollowUp(text: string, step?: LastStep | null): string | null {
  const raw = text.trim()
  if (!FOLLOW_UP.test(raw)) return null
  const tool = (step?.last_step_tool ?? '').trim()
  const title = (step?.last_step_title ?? '').trim()
  const when = (step?.last_step_when ?? '').trim()
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
