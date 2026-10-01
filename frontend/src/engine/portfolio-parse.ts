import { normalizeUtterance } from './utterance.ts'

export type PortfolioIntent =
  | { kind: 'home' }
  | { kind: 'open'; name: string }
  | { kind: 'example'; name: string; image: string }
  | { kind: 'archive'; name: string }
  | { kind: 'restore'; name: string }
  | { kind: 'create'; work: string }

const END = String.raw`\s*[.!?]?$`

function clean(raw: string): string {
  return raw.replace(/\s+/g, ' ').replace(/[?.!]+$/g, '').trim()
}

const DROP = String.raw`l(?:ö|oe)sch(?:e|en)?|entfern(?:e|en)?`

/** Portfolio-Sätze. `Plane das` und `Go` bleiben beim Ablauf. */
export function parsePortfolioIntent(text: string): PortfolioIntent | null {
  const t = normalizeUtterance((text || '').trim())
  if (!t) return null
  const created = parseCreate(t)
  if (created) return created
  if (t.length > 180) return null
  if (new RegExp(String.raw`^\s*(?:portfolio|zeig(?:e)?\s+das\s+portfolio)${END}`, 'i').test(t)) {
    return { kind: 'home' }
  }
  const back = new RegExp(String.raw`^\s*hol\s+projekt\s+(.+?)\s+zur(?:ue|ü)ck${END}`, 'i').exec(t)
  if (back) {
    const name = clean(back[1])
    return name ? { kind: 'restore', name } : null
  }
  const archive = new RegExp(
    String.raw`^\s*(?:schredder|archivier(?:e)?\s+projekt|(?:${DROP})(?:\s+mir)?(?:\s+(?:das|den|die))?\s+projekt)\s+(.+)${END}`,
    'i',
  ).exec(t)
  if (archive) {
    const name = clean(archive[1])
    return name ? { kind: 'archive', name } : null
  }
  const archiveTail = new RegExp(String.raw`^\s*(?:das\s+)?projekt\s+(.+?)\s+(?:${DROP})${END}`, 'i').exec(t)
  if (archiveTail) {
    const name = clean(archiveTail[1])
    return name ? { kind: 'archive', name } : null
  }
  if (new RegExp(String.raw`^\s*(?:${DROP})(?:\s+mir)?(?:\s+(?:das|den|die))?\s+projekt${END}`, 'i').test(t)) {
    return { kind: 'archive', name: '' }
  }
  const open = new RegExp(String.raw`^\s*zeig(?:e)?\s+projekt\s+(.+)${END}`, 'i').exec(t)
  if (open) {
    const name = clean(open[1])
    return name ? { kind: 'open', name } : null
  }
  const example = new RegExp(String.raw`^\s*beispiel\s+zu\s+(.+)${END}`, 'i').exec(t)
  if (example) {
    const body = clean(example[1])
    const cut = body.split(/\s*:\s*/)
    const name = (cut[0] || '').trim()
    const image = cut.slice(1).join(':').trim()
    if (!name) return null
    return { kind: 'example', name, image }
  }
  return null
}

/** „Neues Projekt: …“ legt eine Karte. Der Satz darf länger sein als die anderen. */
function parseCreate(t: string): PortfolioIntent | null {
  if (t.length > 2000) return null
  const made = new RegExp(
    String.raw`^\s*(?:(?:bitte|kannst\s+du(?:\s+mal)?|mach(?:e)?(?:\s+mal)?)\s+)?(?:ein\s+)?neues?\s+projekt\s*:?\s*(.*)$`,
    'i',
  ).exec(t)
  if (!made) return null
  return { kind: 'create', work: clean(made[1] || '') }
}
