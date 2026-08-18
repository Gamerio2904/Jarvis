import { isFuelPlace } from './fuel-parse.ts'
import { normalizeUtterance } from './utterance.ts'

export type DriveTab = 'map' | 'spotify'

export type DriveIntent =
  | { kind: 'on'; dest?: string }
  | { kind: 'off' }
  | { kind: 'dest'; query: string }
  | { kind: 'tab'; tab: DriveTab }
  | { kind: 'eta' }

const SKIP_DEST =
  /^(fuß|fuss|spät|her|mittag|dem|den|der|das|mir|dir|uns|euch|jetzt|mal|bitte|los)$/i
const NOT_PLACE =
  /\b(wetter|wecker|timer|todo|notiz|erinnerung|anrufen|rufe|kaufen|frage|sagst|stunde|minute|woche)\b/i

function destOf(raw?: string): string | undefined {
  const t = (raw || '')
    .trim()
    .replace(/[.!?]+$/g, '')
    .replace(/\s+(?:fahren|navigieren|losfahren|los|bitte)$/i, '')
    .trim()
  if (!t || t.length < 2) return undefined
  if (SKIP_DEST.test(t)) return undefined
  if (/^\d+$/.test(t)) return undefined
  if (t.split(/\s+/).length > 8) return undefined
  if (NOT_PLACE.test(t)) return undefined
  if (isFuelPlace(t)) return undefined
  return t
}

const ON = /^\s*(?:aktivier(?:e)?|start(?:e)?|öffne[n]?|zeig(?:e)?)\s+(?:den\s+)?(?:fahr(?:er)?modus|fahrmodus|carplay)(?:\s+(?:zu(?:r|m)?|nach)\s+(.+))?\s*$/i
const ON2 = /^\s*(?:fahr(?:er)?modus|fahrmodus|carplay)\s+(?:an|aktivieren|starten|öffnen)(?:\s+(?:zu(?:r|m)?|nach)\s+(.+))?\s*$/i
const BARE_ON = /^\s*(?:den\s+)?(?:fahr(?:er)?modus|fahrmodus|carplay)\s*[.!?]*$/i
const OFF =
  /^\s*(?:deaktivier(?:e)?|beend(?:e)?)\s+(?:den\s+)?(?:fahr(?:er)?modus|fahrmodus|carplay)|(?:fahr(?:er)?modus|fahrmodus|carplay)\s+aus\s*[.!?]*$/i
const GO =
  /^\s*(?:fahr(?:e)?(?:\s+mich)?|bring(?:e)?(?:\s+mich)?|navigier(?:e)?|route|carplay)\s+(?:zu(?:r|m)?|nach)\s+(.+?)\s*$/i
const DEST =
  /^\s*(?:nach|zu(?:r|m)?)\s+(?!fuß\b|fuss\b)(.+?)(?:\s+(?:fahren|navigieren|losfahren|los))?\s*[.!?]*$/i
const TAB_MUSIC =
  /^\s*(?:(?:öffne|zeig(?:e)?|mach(?:e)?(?:\s+mal)?|tab)\s+(?:spotify|musik)(?:\s+(?:auf|overlay|tab|an))?|spotify\s+(?:auf|overlay|tab|öffnen)|musik\s+(?:tab|overlay))\s*[.!?]*$/i
const TAB_MAP =
  /^\s*(?:(?:öffne|zeig(?:e)?|mach(?:e)?(?:\s+mal)?|tab)\s+(?:die\s+)?(?:karte|navigation|navi)|(?:karte|navigation|navi)\s+tab)\s*[.!?]*$/i
const BARE_MUSIC = /^\s*(?:spotify|musik)\s*[.!?]*$/i
const BARE_MAP = /^\s*(?:karte|navi|navigation)\s*[.!?]*$/i
const ETA =
  /^\s*(?:wie\s+weit\s+noch|wie\s+lange\s+noch|wann\s+(?:sind\s+wir|bin\s+ich)\s+da|restweg|ankunft|eta|wie\s+weit\s+ist\s+es\s+noch)\s*[.!?]*$/i

function isOverlay(t: string): boolean {
  if (!/\boverlay\b/i.test(t)) return false
  if (/\b(?:aus|zu|schließ|beend)\b/i.test(t)) return false
  return true
}

function isEta(t: string): boolean {
  if (ETA.test(t)) return true
  if (/\b(?:restweg|ankunftszeit)\b/i.test(t) && !/\b(wecker|timer|termin)\b/i.test(t)) return true
  return false
}

export function parseDriveIntent(text: string, inMode = false): DriveIntent | null {
  const t = normalizeUtterance(text.trim())
  if (/\bich\s+fahr(?:e)?\s+gerne\b/i.test(t)) return null
  if (/\bgern(?:e)?\s+(?:auto|fahren|autofahren)\b/i.test(t) && !/\b(zu(?:r|m)?|nach)\s+\S/i.test(t)) {
    return null
  }
  if (/^nachher\b/i.test(t)) return null
  if (OFF.test(t)) return { kind: 'off' }
  if (isOverlay(t) || TAB_MUSIC.test(t) || (inMode && BARE_MUSIC.test(t))) {
    return { kind: 'tab', tab: 'spotify' }
  }
  if (TAB_MAP.test(t) || (inMode && BARE_MAP.test(t))) return { kind: 'tab', tab: 'map' }
  if (/\bspotify\b/i.test(t) && /^\s*(?:spiel(?:e)?|play)\b/i.test(t)) return { kind: 'tab', tab: 'spotify' }
  if (isEta(t)) return { kind: 'eta' }
  if (BARE_ON.test(t)) return { kind: 'on' }
  const on = ON.exec(t) || ON2.exec(t)
  if (on) return { kind: 'on', dest: destOf(on[1]) }
  const go = GO.exec(t)
  if (go) {
    const dest = destOf(go[1])
    if (dest) return inMode ? { kind: 'dest', query: dest } : { kind: 'on', dest }
  }
  const d = DEST.exec(t)
  if (d) {
    const dest = destOf(d[1])
    if (dest) return inMode ? { kind: 'dest', query: dest } : { kind: 'on', dest }
  }
  return null
}
