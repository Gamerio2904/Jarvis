export type TabletIntent = 'on' | 'off'
export type TabletPairIntent = 'pair' | 'reset'

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

export const TABLET_ON_REPLY =
  'Tabletmodus an. Lage läuft im Vollbild, „Ultron“ hört mit, der Hausstand-Server startet.'
export const TABLET_OFF_REPLY = 'Tabletmodus aus. Server und Dauer-Hören sind beendet.'
export const STAND_UPDATED_LINE = 'Hausstand aktualisiert, Sir.'
