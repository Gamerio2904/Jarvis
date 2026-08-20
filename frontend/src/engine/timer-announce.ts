/** Titel ohne Füllwörter. Leer = namenloser Timer. */
export function cleanTimerTitle(raw: string): string {
  const t = (raw || '')
    .replace(/^(?:für|zum|zur|zu)\s+/i, '')
    .replace(/^(?:die|der|das|den|dem|meine[nrs]?|ihr[e]?)\s+/i, '')
    .replace(/^[,\s.:;-]+/, '')
    .replace(/[.!?]+$/, '')
    .trim()
  if (!t || /^(timer|test|probe|alarm|wecker)$/i.test(t)) return ''
  return t
}

const PLURAL =
  /^(nudeln|kartoffeln|bohnen|linsen|eier|pommes|spätzle|spaghetti|klöße|semmeln)$/i

/** Jarvis sagt das beim Ablauf — kein Klingeln. */
export function timerDoneLine(title: string): string {
  const t = cleanTimerTitle(title)
  if (!t) return 'Die Zeit ist um.'
  if (PLURAL.test(t)) return `Die ${t} sind fertig.`
  return `${t} ist soweit.`
}

/** Bestätigung beim Stellen. */
export function timerSetLine(title: string, whenLabel: string): string {
  const t = cleanTimerTitle(title)
  const when = (whenLabel || '').replace(/^\s*in\s+/i, '').trim() || whenLabel
  if (t) return `${t}, ${when}. Ich sage Bescheid.`
  const lead = whenLabel.replace(/^\s*in\s+/i, 'In ').trim()
  return `${lead || 'Timer läuft'}. Ich sage Bescheid.`
}

export function timerStopLine(title: string): string {
  const t = cleanTimerTitle(title)
  return t ? `${t} gestoppt.` : 'Timer aus.'
}

export function timerListLabel(title: string): string {
  return cleanTimerTitle(title) || 'Timer'
}

/** Native Alarm: immer sprechen, nie Wecker-Ton. */
export function timerAlarmFields(title: string): {
  title: string
  body: string
  mode: 'speak'
  say: string
} {
  return { title: 'Timer', body: title || 'Timer', mode: 'speak', say: timerDoneLine(title) }
}
