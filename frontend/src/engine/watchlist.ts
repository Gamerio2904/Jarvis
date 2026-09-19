import {
  addWatchMovie,
  addWatchedMovie,
  listWatchMovies,
  listWatchedMovies,
  persistLastList,
  readLastList,
  removeWatchMovie,
  type WatchListKind,
  type WatchMovie,
  type WatchedMovie,
} from './store.ts'
import { parseWatchlistIntent } from './watchlist-parse.ts'
import { parseTasteIntent } from './film-taste-parse.ts'
import {
  applyWatched,
  buildWatchedPack,
  formatRecommendReply,
  movieKey,
  recommend,
  type MovieSeed,
} from './film-taste.ts'
import { genresFromOmdb } from './film-taste-parse.ts'
import { lookupOmdb } from './omdb.ts'
import { knowledgeBlock } from './knowledge-block.ts'
import { getByTopic, listKnowledgePacks, putKnowledgePack } from './knowledge-store.ts'
import { WATCHED_PACK_TOPIC } from './film-taste.ts'
import type { ToolMeta } from './tools.ts'

const SCORE_TTL_MS = 24 * 60 * 60 * 1000

function pack(reply: string, action: string, preview?: string, extra?: Partial<ToolMeta>) {
  return {
    handled: true as const,
    reply,
    tool: {
      tool_status: 'executed' as const,
      tool: 'watchlist',
      action,
      label: 'Watchliste / Lieblinge',
      preview,
      ...extra,
    },
  }
}

function seedOf(m: WatchMovie | WatchedMovie, pool: MovieSeed['pool']): MovieSeed {
  return {
    title: m.title,
    year: m.year,
    imdbId: m.imdbId,
    genres: (m.genres || []) as MovieSeed['genres'],
    pool,
  }
}

function titles(rows: WatchMovie[]): string[] {
  return rows.map((r) => r.title)
}

function pickFromList(rows: WatchMovie[], list: WatchListKind, title?: string, index?: number): WatchMovie | undefined {
  if (index && index >= 1) {
    const listed = readLastList(list === 'watch' ? 'watch-watch' : 'watch-favorite')
    const name = listed[index - 1]
    if (name) {
      const hit = rows.find((r) => r.title === name && r.lists.includes(list))
      if (hit) return hit
    }
    return rows.filter((r) => r.lists.includes(list))[index - 1]
  }
  const q = (title || '').trim().toLowerCase()
  if (!q) return undefined
  return rows.find((r) => r.lists.includes(list) && (r.title.toLowerCase() === q || r.title.toLowerCase().includes(q)))
}

async function enrich(row: WatchMovie): Promise<WatchMovie> {
  const at = row.scoresAt ? Date.parse(row.scoresAt) : 0
  if (at && Date.now() - at < SCORE_TTL_MS) return row
  const year = row.year ? Number(row.year) : undefined
  const res = await lookupOmdb(row.title, Number.isFinite(year) ? year : undefined)
  if (!res.ok) {
    return {
      ...row,
      critic: row.critic ?? null,
      audience: row.audience ?? null,
      poster: row.poster ?? null,
      scoresAt: new Date().toISOString(),
    }
  }
  const hit = res.hit
  const next: WatchMovie = {
    ...row,
    title: hit.title || row.title,
    year: hit.year || row.year,
    imdbId: hit.imdbId || row.imdbId,
    critic: hit.tomatoes || null,
    audience: hit.audience || null,
    poster: hit.poster || null,
    genres: hit.genre ? genresFromOmdb(hit.genre) : row.genres,
    scoresAt: new Date().toISOString(),
  }
  await addWatchMovie(next.title, next.lists[0] || 'watch', next)
  return (await listWatchMovies()).find((m) => movieKey(m) === movieKey(next)) || next
}

async function persistWatchedPack(): Promise<void> {
  const watched = await listWatchedMovies()
  const draft = buildWatchedPack(watched.map((m) => seedOf(m, 'watched')))
  const existing = await getByTopic(WATCHED_PACK_TOPIC)
  await putKnowledgePack({
    id: existing?.id || WATCHED_PACK_TOPIC,
    topic: draft.topic,
    title: draft.title,
    aliases: draft.aliases,
    summary: draft.summary,
    claims: draft.claims.map((c, i) => ({
      id: `seen-${i}`,
      text: c.text,
      source_urls: [],
      user_ok: true,
    })),
    sources: existing?.sources || [],
    origin: 'user',
    taught_at: existing?.taught_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_ok: true,
    source_agent: 'watchlist',
    links: existing?.links || [],
  })
}

async function weave(ask: string, reply: string): Promise<string> {
  try {
    const packs = await listKnowledgePacks()
    const block = knowledgeBlock(packs, ask)
    if (!block) return reply
    return `${reply}\n\n${block}`
  } catch {
    return reply
  }
}

export async function handleWatchlist(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta }> {
  const taste = parseTasteIntent(text)
  if (taste?.kind === 'recommend') {
    const watch = await listWatchMovies('watch')
    const favorites = (await listWatchMovies('favorite')).map((m) => seedOf(m, 'favorite'))
    const watched = (await listWatchedMovies()).map((m) => seedOf(m, 'watched'))
    const candidates = watch.map((m) => seedOf(m, 'watchlist'))
    const result = recommend({ ask: taste.ask, favorites, watched, candidates })
    const reply = await weave(text, formatRecommendReply(result))
    persistLastList('watch-watch', titles(watch))
    return pack(reply, 'recommend')
  }

  if (taste?.kind === 'seen') {
    const watch = await listWatchMovies()
    const watched = await listWatchedMovies()
    let title = taste.title
    if (taste.index) {
      const listed = readLastList('watch-watch')
      title = listed[taste.index - 1] || watch.filter((m) => m.lists.includes('watch'))[taste.index - 1]?.title || ''
    }
    const applied = applyWatched({
      title,
      watchlist: watch.filter((m) => m.lists.includes('watch')).map((m) => seedOf(m, 'watchlist')),
      watched: watched.map((m) => seedOf(m, 'watched')),
    })
    if ('missing' in applied) {
      return pack('Der steht nicht auf der Watchliste.', 'seen_miss')
    }
    const row = watch.find((m) => movieKey(m) === movieKey(applied.movie))
    if (row) {
      await removeWatchMovie(row.id, 'watch')
      await addWatchedMovie({
        title: row.title,
        year: row.year,
        imdbId: row.imdbId,
        genres: row.genres,
        from_watchlist: true,
        source_conversation_id: conversationId,
      })
      await persistWatchedPack()
    }
    persistLastList('watch-watch', titles(await listWatchMovies('watch')))
    const reply = await weave(text, `${applied.movie.title} liegt bei Gesehen, weg von der Watchliste.`)
    return pack(reply, 'seen', applied.movie.title)
  }

  const intent = parseWatchlistIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'add') {
    const before = await listWatchMovies()
    const existed = before.find(
      (m) =>
        m.lists.includes(intent.list) &&
        (m.title.toLowerCase() === intent.title.toLowerCase() || (m.imdbId && false)),
    )
    const row = await addWatchMovie(intent.title, intent.list, { source_conversation_id: conversationId })
    const enriched = await enrich(row)
    const listKey = intent.list === 'watch' ? 'watch-watch' : 'watch-favorite'
    persistLastList(listKey, titles(await listWatchMovies(intent.list)))
    if (existed) {
      return pack(
        intent.list === 'watch' ? 'War schon auf der Watchliste.' : 'War schon bei den Lieblingen.',
        'add_dup',
        enriched.title,
      )
    }
    const alreadyOther = before.find((m) => movieKey(m) === movieKey(enriched) && !m.lists.includes(intent.list))
    const line =
      intent.list === 'watch' ? `Liegt auf der Watchliste: ${enriched.title}.` : `Liegt bei den Lieblingen: ${enriched.title}.`
    return pack(alreadyOther ? line : line, 'add', enriched.title)
  }

  if (intent.kind === 'list' || intent.kind === 'show') {
    let rows = await listWatchMovies(intent.list)
    rows = await Promise.all(rows.map((r) => enrich(r)))
    const listKey = intent.list === 'watch' ? 'watch-watch' : 'watch-favorite'
    persistLastList(listKey, titles(rows))
    const empty =
      intent.list === 'watch' ? 'Keine Filme auf der Watchliste.' : 'Keine Lieblingsfilme.'
    const head = intent.list === 'watch' ? 'Watchliste.' : 'Lieblinge.'
    const extra = { result: { focus: intent.list } }
    if (!rows.length) {
      return pack(intent.kind === 'show' ? `${head} ${empty}` : empty, 'open', undefined, extra)
    }
    const lines = rows.map((r, i) => `${i + 1}. ${r.title}${r.year ? ` (${r.year})` : ''}`)
    const body = intent.kind === 'show' ? `${head}\n${lines.join('\n')}` : lines.join('\n')
    return pack(body, 'open', undefined, extra)
  }

  if (intent.kind === 'remove') {
    const rows = await listWatchMovies()
    const hit = pickFromList(rows, intent.list, intent.title, intent.index)
    if (!hit) {
      return pack(intent.list === 'watch' ? 'Der steht nicht auf der Watchliste.' : 'Der steht nicht bei den Lieblingen.', 'miss')
    }
    await removeWatchMovie(hit.id, intent.list)
    const listKey = intent.list === 'watch' ? 'watch-watch' : 'watch-favorite'
    persistLastList(listKey, titles(await listWatchMovies(intent.list)))
    return pack(
      intent.list === 'watch' ? `Weg von der Watchliste: ${hit.title}.` : `Weg von den Lieblingen: ${hit.title}.`,
      'remove',
      hit.title,
    )
  }

  return { handled: false }
}
