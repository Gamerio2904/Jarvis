/** Ein Aufruf füllt Varianten. Ungültiges fällt weg. Leerer Text bleibt ehrlich. */

import { completeGemini, geminiReady } from './gemini.ts'
import { completeGroq, groqReady } from './groq.ts'
import { loadSettings } from './store.ts'
import {
  applyRemembered,
  artFromToken,
  artLabel,
  type Art,
  type Block,
  type Motion,
  type Variant,
} from './entwurf-muster.ts'

export type DraftFill = {
  title: string
  motion: Motion
  variants: Variant[]
}

const SYSTEM = `Du füllst einen stummen Entwurf. Antworte nur mit JSON:
{"title":"","motion":"sofort","variants":[{"name":"","blocks":[{"art":"liste","zeile":""}]}]}
motion ist sofort, gleiten oder aufklappen.
art ist nur leiste, liste, karte, knopf, feld oder tab.
Höchstens 3 Varianten, höchstens 6 Bausteine, Zeile höchstens 42 Zeichen, Titel höchstens 80.
Wörter nur aus dem Arbeitstext. Kein Termin, keine Zahl, kein Foto, keine Route, keine Datei, kein Agent.`

const STOP = new Set([
  'und',
  'mit',
  'oben',
  'unten',
  'ein',
  'eine',
  'einem',
  'einen',
  'der',
  'die',
  'das',
  'für',
  'fuer',
  'zum',
  'zur',
  'auf',
  'im',
  'in',
  'am',
  'an',
  'den',
  'dem',
  'oder',
  'dann',
  'noch',
])

const COUNTS: Record<string, number> = {
  ein: 1,
  eine: 1,
  einen: 1,
  einem: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  funf: 5,
  sechs: 6,
}

function clip(raw: string, max: number): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, max)
}

export function titleFrom(work: string): string {
  const cut = work.split(/\s+mit\s+|,/i)[0] || work
  const title = clip(cut.replace(/[.!?]+$/g, ''), 80)
  return title || 'Entwurf'
}

function clipLine(raw: string): string {
  const line = clip(raw, 42)
  return line || 'Noch leer.'
}

function motionOf(v: unknown): Motion {
  return v === 'gleiten' || v === 'aufklappen' || v === 'sofort' ? v : 'sofort'
}

function extractJson(text: string): unknown {
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)
  const raw = fence ? fence[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(raw.slice(start, end + 1)) as unknown
  } catch {
    return null
  }
}

export function readModelFill(raw: unknown, work: string): DraftFill | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const title = clip(typeof o.title === 'string' && o.title.trim() ? o.title : titleFrom(work), 80) || titleFrom(work)
  const motion = motionOf(o.motion)
  if (!Array.isArray(o.variants)) return null
  const variants: Variant[] = []
  for (const item of o.variants) {
    if (variants.length >= 3) break
    if (!item || typeof item !== 'object') continue
    const v = item as Record<string, unknown>
    const blocks: Block[] = []
    const src = Array.isArray(v.blocks) ? v.blocks : []
    for (const b of src) {
      if (blocks.length >= 6) break
      if (!b || typeof b !== 'object') continue
      const row = b as Record<string, unknown>
      const art = artFromToken(String(row.art || ''))
      if (!art) continue
      blocks.push({ art, zeile: clipLine(String(row.zeile || '')), muster: 0 })
    }
    if (!blocks.length) continue
    const name = clip(typeof v.name === 'string' ? v.name : '', 40)
    variants.push({ name: name || artLabel(blocks[0].art), blocks })
  }
  if (!variants.length) return null
  return { title, motion, variants }
}

function artOf(word: string): Art | null {
  const t = word.toLowerCase()
  if (/^kn(?:o|ö)pf/.test(t)) return 'knopf'
  if (/^karte/.test(t)) return 'karte'
  if (/^liste/.test(t)) return 'liste'
  if (/^leiste/.test(t)) return 'leiste'
  if (/^feld/.test(t)) return 'feld'
  if (/^tab/.test(t)) return 'tab'
  return null
}

function countOf(raw: string | undefined): number {
  if (!raw) return 1
  const word = raw.trim().toLowerCase()
  if (COUNTS[word]) return COUNTS[word]
  const n = Number(word)
  if (Number.isInteger(n) && n > 0 && n <= 6) return n
  return 1
}

function readLabel(after: string, art: Art): string {
  if (art === 'liste' || art === 'karte') return ''
  const m = /^\s+([^\s,.]{1,42})/.exec(after)
  if (!m) return ''
  const word = m[1]
  if (STOP.has(word.toLowerCase())) return ''
  if (artOf(word)) return ''
  return clipLine(word)
}

/** Bausteine nur aus Wörtern, die der Text wirklich nennt. */
export function blocksFromWork(work: string): Block[] {
  const re =
    /(?:^|[^\p{L}\d])((?:ein|eine|einen|einem|zwei|drei|vier|fünf|funf|sechs|\d{1,2})\s+)?(kn(?:o|ö)pf(?:e|en)?|karten|karte|listen|liste|leisten|leiste|felder|feld|tabs?)(?=$|[^\p{L}\d])/giu
  const blocks: Block[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(work))) {
    if (blocks.length >= 6) break
    const art = artOf(m[2] || '')
    if (!art) continue
    const n = Math.min(6 - blocks.length, countOf(m[1]))
    const zeile = readLabel(work.slice(m.index + m[0].length), art) || 'Noch leer.'
    for (let i = 0; i < n; i += 1) blocks.push({ art, zeile, muster: 0 })
  }
  if (blocks.length) return blocks
  const stem: Array<[RegExp, Art]> = [
    [/liste/i, 'liste'],
    [/karte/i, 'karte'],
    [/kn(?:o|ö)pf/i, 'knopf'],
    [/leiste/i, 'leiste'],
    [/feld/i, 'feld'],
    [/\btabs?\b/i, 'tab'],
  ]
  for (const [pattern, art] of stem) {
    if (pattern.test(work)) return [{ art, zeile: 'Noch leer.', muster: 0 }]
  }
  return []
}

export function fallbackFromWork(work: string): DraftFill | null {
  const blocks = blocksFromWork(work)
  if (!blocks.length) return null
  const title = titleFrom(work)
  const arts: Art[] = []
  for (const b of blocks) {
    if (!arts.includes(b.art)) arts.push(b.art)
  }
  const variants: Variant[] = []
  if (arts.length >= 2) {
    for (const art of arts.slice(0, 2)) {
      const focus = blocks.filter((b) => b.art === art)
      const rest = blocks.filter((b) => b.art !== art)
      variants.push({ name: artLabel(art), blocks: [...focus, ...rest].slice(0, 6) })
    }
    variants.push({ name: clip(title, 40) || 'Entwurf', blocks: blocks.slice(0, 6), motion: 'aufklappen' })
  } else {
    variants.push({ name: artLabel(arts[0]), blocks: blocks.slice(0, 6) })
  }
  return { title, motion: 'sofort', variants: variants.slice(0, 3) }
}

async function askModel(work: string): Promise<DraftFill | null> {
  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Arbeitstext:\n${work.slice(0, 2000)}` },
  ]
  const runs: Array<() => Promise<string>> = []
  if (groqReady()) runs.push(() => completeGroq(messages, undefined, 900))
  if (geminiReady()) {
    runs.push(async () => (await completeGemini(messages, undefined, { thinking: false, maxOutputTokens: 1200, timeoutMs: 20_000 })).text)
  }
  try {
    const llm = await import('./llm.ts')
    if (llm.isModelReady()) runs.push(() => llm.completeChat(messages))
  } catch {
    /* 0,5B nicht geladen */
  }
  for (const run of runs) {
    try {
      const text = await run()
      const fill = readModelFill(extractJson(text), work)
      if (fill) return fill
    } catch {
      /* nächster Slot */
    }
  }
  return null
}

export async function fillEntwurf(work: string): Promise<DraftFill | null> {
  const fromModel = await askModel(work)
  const base = fromModel || fallbackFromWork(work)
  if (!base) return null
  return { ...base, variants: applyRemembered(base.variants, loadSettings().entwurf_muster) }
}
