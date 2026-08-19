import { lookupOmdb, omdbKeyHint, type OmdbHit } from './omdb.ts'
import { parseFilmIntent } from './film-parse.ts'
import { lookupWatch, type FreeWhere, type WatchHit } from './tv-watch.ts'

export { parseFilmIntent } from './film-parse.ts'
export type { FilmIntent } from './film-parse.ts'

type ToolMeta = {
  tool_status?: string
  tool?: string
  action?: string
  preview?: string
  label?: string
  result?: Record<string, unknown>
  error?: string
}

type FilmHit = {
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}

export async function handleFilm(_conversationId: string, text: string): Promise<FilmHit> {
  const intent = parseFilmIntent(text)
  if (!intent) return { handled: false }
  const watch = await lookupWatch(intent.title, { kind: 'movie' })
  const year = watch.year
  const omdb = await lookupOmdb(watch.title || intent.title, year)
  const omdbHit = omdb.ok ? omdb.hit : null
  const keyMissing = !omdb.ok && Boolean(omdb.needKey)
  const reply = formatFilmReply({
    kind: intent.kind,
    asked: intent.title,
    watch,
    omdb: omdbHit,
    omdbNote: omdb.ok ? '' : omdb.message,
    keyMissing,
  })
  return {
    handled: true,
    reply,
    tool: {
      tool_status: 'executed',
      tool: 'film',
      action: intent.kind,
      label: 'Film',
      preview: watch.title || intent.title,
      result: {
        title: watch.title || intent.title,
        imdb: omdbHit?.imdb || '',
        tomatoes: omdbHit?.tomatoes || '',
        free: (watch.freeWhere || []).map((f) => f.name),
      },
    },
    lastTool: 'film',
  }
}

export function formatFilmReply(opts: {
  kind: 'where' | 'rate' | 'about'
  asked: string
  watch: Pick<WatchHit, 'title' | 'year' | 'alsoFree' | 'offers' | 'target' | 'freeWhere'>
  omdb: OmdbHit | null
  omdbNote?: string
  keyMissing?: boolean
}): string {
  const title = opts.omdb?.title || opts.watch.title || opts.asked
  const year = opts.omdb?.year || (opts.watch.year ? String(opts.watch.year) : '')
  const head = year ? `${title} (${year}).` : `${title}.`
  const scores = scoreLine(opts.omdb, opts.keyMissing, opts.omdbNote)
  const free = freeLine(opts.watch)
  const paid = paidLine(opts.watch)
  if (opts.kind === 'rate') {
    return [head, scores, opts.omdb?.plot ? opts.omdb.plot.slice(0, 180) : '', free].filter(Boolean).join(' ')
  }
  if (opts.kind === 'where') {
    return [head, free, paid, scores].filter(Boolean).join(' ')
  }
  return [head, scores, free, paid].filter(Boolean).join(' ')
}

function scoreLine(omdb: OmdbHit | null, keyMissing?: boolean, note?: string): string {
  if (omdb?.imdb || omdb?.tomatoes) {
    const bits: string[] = []
    if (omdb.imdb) bits.push(`IMDb ${omdb.imdb.replace('.', ',')}`)
    if (omdb.tomatoes) bits.push(`Rotten Tomatoes ${omdb.tomatoes} (über OMDb)`)
    else bits.push('Rotten Tomatoes nicht in der Quelle.')
    return `${bits.join('. ')}.`
  }
  if (keyMissing) return omdbKeyHint()
  return note || 'Keine IMDb/RT-Zahl — ich erfinde keine.'
}

function freeLine(watch: Pick<WatchHit, 'freeWhere' | 'alsoFree' | 'target'>): string {
  const names = (watch.freeWhere || [])
    .map((f) => (f.ads ? `${f.name} (Werbung)` : f.name))
    .filter(Boolean)
  const fallback = watch.alsoFree || []
  const list = (names.length ? names : fallback).slice(0, 5)
  if (!list.length) {
    return 'In DE gerade nicht kostenlos bei den bekannten Anbietern. Ich erfinde keine Streams.'
  }
  return `Kostenlos in DE: ${list.join(', ')}. Andere Mediatheken starte ich nicht am Fernseher.`
}

function paidLine(watch: Pick<WatchHit, 'offers'>): string {
  const abo = unique(
    (watch.offers || [])
      .filter((o) => o.monetization === 'flatrate')
      .map((o) => o.provider),
  ).slice(0, 3)
  if (!abo.length) return ''
  return `Abo: ${abo.join(', ')}.`
}

function unique(rows: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of rows) {
    const k = r.trim()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(k)
  }
  return out
}

export type { FreeWhere }
