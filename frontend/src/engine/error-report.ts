/** Ende der lautlosen Fehler: Unerwartete Fehler landen in einem Ring-Puffer
 * (localStorage) und werden zusätzlich als Fenster-Event gemeldet. So sieht
 * man im Nachhinein, was schiefging, statt nur eines schwarzen Lochs. */

export type ErrorReportEntry = {
  at: string
  message: string
  where: string
}

const KEY = 'jarvis-error-log'
const LIMIT = 30
export const ERROR_EVENT = 'jarvis-error'

let installed = false

function load(): ErrorReportEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    const rows = raw ? (JSON.parse(raw) as ErrorReportEntry[]) : []
    return Array.isArray(rows) ? rows.slice(-LIMIT) : []
  } catch {
    return []
  }
}

function push(entry: ErrorReportEntry) {
  try {
    const rows = [...load(), entry].slice(-LIMIT)
    localStorage.setItem(KEY, JSON.stringify(rows))
  } catch {
    // Speicher voll oder blockiert — die Konsole hat es trotzdem.
  }
  try {
    window.dispatchEvent(new CustomEvent(ERROR_EVENT, { detail: entry }))
  } catch {
    // Event darf nie werfen.
  }
}

/** Manuell melden — für catch-Blöcke, die nichts verlieren wollen. */
export function reportError(cause: unknown, where: string) {
  const message = cause instanceof Error ? cause.message : typeof cause === 'string' ? cause : String(cause ?? 'Unbekannter Fehler')
  const entry: ErrorReportEntry = { at: new Date().toISOString(), message, where }
  console.error(`[jarvis] ${where}:`, cause)
  push(entry)
  return entry
}

export function recentErrors(): ErrorReportEntry[] {
  return load().slice().reverse()
}

export function clearErrorLog() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // egal — nichts zu holen.
  }
}

/** Globaler Schutzschild: behandelt ungefangene Promise-Abbrüche und
 * Fenster-Fehler, damit niemand mehr still scheitert. */
export function installErrorReport() {
  if (installed) return
  installed = true
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    // Abgebrochene Netzwerke sind Alltag (Timeouts, Abbruch-Controller) und
    // gehören nicht ins Fehlerbuch — nur echte Überraschungen.
    const name = reason instanceof Error ? reason.name : ''
    if (name === 'AbortError') return
    reportError(reason, 'Hintergrund (Promise ohne catch)')
  })
  window.addEventListener('error', (event) => {
    if (event.error) reportError(event.error, `Fenster (${event.filename || 'inline'})`)
  })
}
