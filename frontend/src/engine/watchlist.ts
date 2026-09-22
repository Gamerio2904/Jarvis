import {
  addWatchMovie,
  addWatchedMovie,
  deleteWatchMovie,
  listWatchMovies,
  listWatchedMovies,
  loadSettings,
  moveWatchMovie,
  persistLastList,
  put,
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
import { lookupOmdb, sameFilmTitle, splitFilmTitle } from './omdb.ts'
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

function lastFilmTitle(): string {
  const s = loadSettings()
  if ((s.last_step_tool || '') === 'watchlist' && s.last_step_title.trim()) return s.last_step_title.trim()
  return (
    readLastList('watch-watch')[0] ||
    readLastList('watch-favorite')[0] ||
    readLastList()[0] ||
    ''
  )
}

function titleMatch(a: string, b: string): boolean {
  if (sameFilmTitle(a, b)) return true
  const x = splitFilmTitle(a).toLowerCase()
  const y = splitFilmTitle(b).toLowerCase()
  return Boolean(x && y && (x === y || x.includes(y) || y.includes(x)))
}

function sameFilm(a: WatchMovie, b: WatchMovie): boolean {
  const idA = (a.imdbId || '').trim().toLowerCase()
  const idB = (b.imdbId || '').trim().toLowerCase()
  if (idA && idB && idA === idB) return true
  return sameFilmTitle(a.title, b.title)
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
  const q = (title || '').trim()
  if (!q) return undefined
  return rows.find((r) => r.lists.includes(list) && titleMatch(r.title, q))
}

async function enrich(row: WatchMovie): Promise<WatchMovie> {
  const at = row.scoresAt ? Date.parse(row.scoresAt) : 0
  const fresh = Boolean(at && Date.now() - at < SCORE_TTL_MS)
  if (fresh && row.imdbScore !== undefined) return row
  const year = row.year ? Number(row.year) : undefined
  const res = await lookupOmdb(row.title, Number.isFinite(year) ? year : undefined)
  if (!res.ok) {
    return {
      ...row,
      critic: row.critic ?? null,
      audience: row.audience ?? null,
      imdbScore: row.imdbScore ?? null,
      poster: row.poster ?? null,
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
    imdbScore: hit.imdb || null,
    poster: hit.poster || null,
    genres: hit.genre ? genresFromOmdb(hit.genre) : row.genres,
    scoresAt: new Date().toISOString(),
  }
  await addWatchMovie(row.title, next.lists[0] || 'watch', next)
  const after = await listWatchMovies()
  return after.find((m) => movieKey(m) === movieKey(next) || titleMatch(m.title, next.title) || m.id === row.id) || next
}

async function mergeGroup(group: WatchMovie[]): Promise<WatchMovie> {
  const keep = [...group].sort((a, b) => {
    const score = (m: WatchMovie) =>
      (m.imdbId ? 8 : 0) + (m.imdbScore ? 2 : 0) + (m.poster ? 1 : 0) + (m.title.length > 12 ? 1 : 0)
    return score(b) - score(a)
  })[0]
  const lists = Array.from(new Set(group.flatMap((m) => m.lists || []))) as WatchListKind[]
  const richest = group.find((m) => m.imdbId && m.title.length >= keep.title.length) || keep
  const next: WatchMovie = {
    ...keep,
    ...richest,
    id: keep.id,
    lists,
    created_at: keep.created_at,
    updated_at: new Date().toISOString(),
  }
  await put('watch_movies', next)
  for (const row of group) {
    if (row.id !== keep.id) await deleteWatchMovie(row.id)
  }
  return next
}

async function dedupeRows(title?: string): Promise<WatchMovie[]> {
  const rows = await listWatchMovies()
  const used = new Set<string>()
  const merged: WatchMovie[] = []
  for (const row of rows) {
    if (used.has(row.id)) continue
    if (title && !titleMatch(row.title, title) && !sameFilmTitle(row.title, title)) continue
    const group = rows.filter((other) => !used.has(other.id) && (other.id === row.id || sameFilm(row, other)))
    if (title && !group.some((m) => titleMatch(m.title, title) || sameFilmTitle(m.title, title))) continue
    if (group.length < 2) continue
    for (const m of group) used.add(m.id)
    merged.push(await mergeGroup(group))
  }
  return merged
}

export async function enrichWatchlist(list?: WatchListKind): Promise<WatchMovie[]> {
  const rows = await listWatchMovies(list)
  return Promise.all(rows.map((r) => enrich(r)))
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
    const reply = await weave(text, formatRecommendReply(result, taste.ask))
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

  if (intent.kind === 'move') {
    const title = (intent.title || lastFilmTitle()).trim()
    const rows = await listWatchMovies()
    const hit =
      (title && rows.find((m) => titleMatch(m.title, title))) ||
      rows.find((m) => m.lists.includes(intent.list === 'favorite' ? 'watch' : 'favorite'))
    if (!hit) {
      return pack('Welchen Film? Sag den Titel — ich rate nicht.', 'move_miss', undefined, {
        result: { focus: intent.list },
      })
    }
    const moved = await moveWatchMovie(hit.id, intent.list)
    const row = moved || hit
    const enriched = await enrich({ ...row, lists: [intent.list] })
    const listKey = intent.list === 'watch' ? 'watch-watch' : 'watch-favorite'
    persistLastList(listKey, titles(await listWatchMovies(intent.list)))
    const line =
      intent.list === 'favorite'
        ? `Zu den Lieblingen, weg von der Watchliste: ${enriched.title}.`
        : `Auf die Watchliste, weg von den Lieblingen: ${enriched.title}.`
    return pack(line, 'move', enriched.title, { result: { focus: intent.list } })
  }

  if (intent.kind === 'add') {
    const before = await listWatchMovies()
    const existed = before.find(
      (m) =>
        m.lists.includes(intent.list) &&
        (m.title.toLowerCase() === intent.title.toLowerCase() ||
          titleMatch(m.title, intent.title) ||
          sameFilmTitle(m.title, intent.title)),
    )
    const other = before.find(
      (m) =>
        (titleMatch(m.title, intent.title) || sameFilmTitle(m.title, intent.title)) &&
        m.lists.includes(intent.list === 'favorite' ? 'watch' : 'favorite') &&
        !m.lists.includes(intent.list),
    )
    if (other && !existed) {
      const moved = await moveWatchMovie(other.id, intent.list)
      const enriched = await enrich(moved || other)
      const listKey = intent.list === 'watch' ? 'watch-watch' : 'watch-favorite'
      persistLastList(listKey, titles(await listWatchMovies(intent.list)))
      const line =
        intent.list === 'favorite'
          ? `Zu den Lieblingen, weg von der Watchliste: ${enriched.title}.`
          : `Auf die Watchliste, weg von den Lieblingen: ${enriched.title}.`
      return pack(line, 'move', enriched.title, { result: { focus: intent.list } })
    }
    const clean = splitFilmTitle(intent.title) || intent.title
    const row = await addWatchMovie(clean, intent.list, { source_conversation_id: conversationId })
    const enriched = await enrich(row)
    await dedupeRows(enriched.title)
    const listKey = intent.list === 'watch' ? 'watch-watch' : 'watch-favorite'
    persistLastList(listKey, titles(await listWatchMovies(intent.list)))
    if (existed) {
      return pack(
        intent.list === 'watch' ? 'War schon auf der Watchliste.' : 'War schon bei den Lieblingen.',
        'add_dup',
        enriched.title,
        { result: { focus: intent.list } },
      )
    }
    const line =
      intent.list === 'watch' ? `Liegt auf der Watchliste: ${enriched.title}.` : `Liegt bei den Lieblingen: ${enriched.title}.`
    return pack(line, 'add', enriched.title, { result: { focus: intent.list } })
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

  if (intent.kind === 'dedupe') {
    const merged = await dedupeRows(intent.title)
    const rows = await listWatchMovies()
    persistLastList('watch-watch', titles(await listWatchMovies('watch')))
    persistLastList('watch-favorite', titles(await listWatchMovies('favorite')))
    if (!merged.length) {
      return pack('Kein doppelter Eintrag auf der Liste.', 'dedupe_miss')
    }
    const names = merged.map((m) => m.title).join(', ')
    return pack(`Doppelte Einträge zusammengelegt: ${names}.`, 'dedupe', merged[0]?.title, {
      result: { focus: rows.some((m) => m.lists.includes('favorite')) ? 'favorite' : 'watch' },
    })
  }

  if (intent.kind === 'remove') {
    const rows = await listWatchMovies()
    const title = (intent.title || lastFilmTitle()).trim()
    let hit = pickFromList(rows, intent.list, title, intent.index)
    let list = intent.list
    if (!hit && title) {
      const other: WatchListKind = intent.list === 'watch' ? 'favorite' : 'watch'
      hit = pickFromList(rows, other, title)
      if (hit) list = other
    }
    if (!hit && !intent.index && !intent.title) {
      hit = rows.find((r) => r.lists.includes(intent.list)) || rows[0]
      if (hit) list = hit.lists.includes(intent.list) ? intent.list : hit.lists[0] || 'watch'
    }
    if (!hit) {
      return pack(list === 'watch' ? 'Der steht nicht auf der Watchliste.' : 'Der steht nicht bei den Lieblingen.', 'miss')
    }
    await removeWatchMovie(hit.id, list)
    const listKey = list === 'watch' ? 'watch-watch' : 'watch-favorite'
    persistLastList(listKey, titles(await listWatchMovies(list)))
    return pack(
      list === 'watch' ? `Weg von der Watchliste: ${hit.title}.` : `Weg von den Lieblingen: ${hit.title}.`,
      'remove',
      hit.title,
    )
  }

  return { handled: false }
}
