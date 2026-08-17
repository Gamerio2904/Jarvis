/** Titel ohne Füllwörter. Leer = namenloser Timer. */
export function cleanTimerTitle(raw: string): string {
  const t = (raw || '')
    .replace(/^(?:für|zum|zur|zu)\s+/i, '')
    .replace(/^(?:die|der|das|den|dem|meine[nrs]?|ihr[e]?)\s+/i, '')
    .replace(/^[,\s.:;-]+/, '')
    .replace(/[.!?]+$/, '')
    .trim()
  if (!t || /^timer$/i.test(t)) return ''
  return t
}

/** Jarvis sagt das beim Ablauf — kein Klingeln. Siezen. */
export function timerDoneLine(title: string): string {
  const t = cleanTimerTitle(title)
  if (!t) return 'Timer abgelaufen, Sie.'
  return `Der Timer für Ihre ${t} ist abgelaufen, Sie.`
}
