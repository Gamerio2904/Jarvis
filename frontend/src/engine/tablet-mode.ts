export type TabletIntent = 'on' | 'off'
export type TabletPairIntent = 'pair' | 'reset'
export type TabletServerIntent = 'start' | 'stop' | 'status'

const MODE =
  /^(?:bitte\s+)?(?:(schalte|mach|starte|beende|stoppe)\s+)?(?:den\s+)?tablet[\s-]*modus(?:\s+(an|aus|ein|ab|beenden|starten))?\s*[.!]?$/

/** „Tabletmodus an/aus“ — nur ein kurzer, eindeutiger Satz. */
export function parseTabletMode(text: string): TabletIntent | null {
  const t = text.trim().toLocaleLowerCase('de-DE')
  if (!t || t.length > 60) return null
  const m = MODE.exec(t)
  if (!m) return null
  if (m[1] === 'beende' || m[1] === 'stoppe') return 'off'
  if (m[2] === 'aus' || m[2] === 'ab' || m[2] === 'beenden') return 'off'
  return 'on'
}

export function parseTabletPair(text: string): TabletPairIntent | null {
  const t = text.trim().toLocaleLowerCase('de-DE')
  if (!t || t.length > 60) return null
  if (/^(?:bitte\s+)?(?:(?:das\s+)?handy|(?:das\s+)?tablet)\s+koppeln\s*[.!]?$/.test(t)) return 'pair'
  if (/^(?:bitte\s+)?kopplung\s+(?:zurücksetzen|zuruecksetzen|löschen|loeschen)\s*[.!]?$/.test(t)) return 'reset'
  return null
}

export type ConflictIntent = 'local' | 'remote'

/** Ausdrückliche Quellenwahl nach einem Sync-Konflikt. */
export function parseConflictChoice(text: string): ConflictIntent | null {
  const t = text.trim().toLocaleLowerCase('de-DE')
  if (!t || t.length > 80) return null
  if (/^(?:bitte\s+)?(?:übernimm|uebernimm|nimm|behalte)\s+(?:den\s+)?(?:stand\s+(?:vom|von\s+dem)\s+)?tablet(?:[\s-]*stand)?\s*[.!]?$/.test(t)) return 'remote'
  if (/^(?:bitte\s+)?(?:übernimm|uebernimm|nimm|behalte)\s+(?:den\s+)?(?:stand\s+(?:vom|von\s+dem)\s+)?handy(?:[\s-]*stand)?\s*[.!]?$/.test(t)) return 'local'
  return null
}

export function parseTabletServer(text: string): TabletServerIntent | null {
  const t = text.trim().toLocaleLowerCase('de-DE')
  if (!t || t.length > 80) return null
  if (/^(?:bitte\s+)?(?:starte|starten|schalte\s+ein)\s+(?:den\s+)?(?:tablet[\s-]*)?server\s*[.!?]*$/.test(t)) return 'start'
  if (/^(?:bitte\s+)?(?:stoppe|beende|anhalten|schalte\s+aus)\s+(?:den\s+)?(?:tablet[\s-]*)?server\s*[.!?]*$/.test(t)) return 'stop'
  if (/^(?:bitte\s+)?(?:serverstatus|status\s+(?:vom\s+)?server|läuft\s+der\s+server)\s*[.!?]*$/.test(t)) return 'status'
  return null
}

export const TABLET_ON_REPLY = 'Tabletmodus an. Lage läuft im Vollbild; der Server bleibt aus, bis Sie „Starte den Server“ sagen.'
export const TABLET_OFF_REPLY = 'Tabletmodus aus. Serverstatus bleibt unverändert; Dauer-Hören ist beendet.'
export const STAND_UPDATED_LINE = 'Hausstand aktualisiert, Sir.'
