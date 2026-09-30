import { loadSettings } from './store.ts'

/** Status, bei denen das Fenster über der Tafel liegt. `leer` ist die ehrliche Absage ohne Zeile. */
export function ablaufWindowOpen(status = loadSettings().ablauf_status): boolean {
  return status === 'schreibt' || status === 'warten' || status === 'überarbeitet' || status === 'läuft' || status === 'fragt' || status === 'leer'
}

export function ablaufWaiting(status = loadSettings().ablauf_status): boolean {
  return status === 'warten' || status === 'überarbeitet'
}
