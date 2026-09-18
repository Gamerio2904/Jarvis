/** Taste-Profil und Empfehlungen. Keine erfundenen Titel. */

export const FAV_WEIGHT = 3
export const SEEN_WEIGHT = 1
export const ASK_WEIGHT = 2
export const WATCHLIST_NIGHT = 1.5
export const WATCHLIST_BASE = 0.25
export const RECOMMEND_LIMIT = 3

export const WATCHED_PACK_TOPIC = 'filme-gesehen'
export const WATCHED_PACK_TITLE = 'Gesehene Filme'

/** Canonical genre keys. Aliases in film-taste-parse. */
export type GenreKey =
  | 'horror'
  | 'sci-fi'
  | 'thriller'
  | 'comedy'
  | 'drama'
  | 'action'
  | 'romance'
  | 'animation'
  | 'crime'
  | 'adventure'
  | 'fantasy'
  | 'war'
  | 'western'
  | 'mystery'
  | 'documentary'
  | 'family'

export type MovieSeed = {
  title: string
  year?: string
  imdbId?: string
  genres: GenreKey[]
  pool?: 'watchlist' | 'catalog' | 'favorite' | 'watched'
}

export type RecommendAsk = {
  genre?: GenreKey
  occasion?: 'night' | null
  limit: number
}

export type TasteProfile = {
  genreWeight: Partial<Record<GenreKey, number>>
  watchedKeys: Set<string>
  topGenres: GenreKey[]
}

export type RecommendPick = {
  movie: MovieSeed
  score: number
  why: string
}

export type RecommendResult = {
  picks: RecommendPick[]
  emptyReason?: string
}

export function movieKey(m: Pick<MovieSeed, 'imdbId' | 'title' | 'year'>): string {
  const id = (m.imdbId || '').trim().toLowerCase()
  if (id) return `id:${id}`
  const title = (m.title || '').trim().toLowerCase()
  const year = (m.year || '').trim()
  return year ? `t:${title}|${year}` : `t:${title}`
}

export function buildProfile(favorites: MovieSeed[], watched: MovieSeed[]): TasteProfile {
  const genreWeight: Partial<Record<GenreKey, number>> = {}
  const bump = (genres: GenreKey[], w: number) => {
    for (const g of genres) {
      genreWeight[g] = (genreWeight[g] || 0) + w
    }
  }
  for (const m of favorites) bump(m.genres, FAV_WEIGHT)
  for (const m of watched) bump(m.genres, SEEN_WEIGHT)
  const watchedKeys = new Set(watched.map(movieKey).filter((k) => k !== 't:'))
  const topGenres = (Object.entries(genreWeight) as [GenreKey, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g)
  return { genreWeight, watchedKeys, topGenres }
}

export function isWatched(movie: MovieSeed, profile: TasteProfile): boolean {
  return profile.watchedKeys.has(movieKey(movie))
}

export function scoreMovie(movie: MovieSeed, profile: TasteProfile, ask: RecommendAsk): number | null {
  if (isWatched(movie, profile)) return null
  if (ask.genre && !movie.genres.includes(ask.genre)) return null
  let score = 0
  for (const g of movie.genres) {
    score += profile.genreWeight[g] || 0
  }
  if (ask.genre && movie.genres.includes(ask.genre)) score += ASK_WEIGHT
  if (movie.pool === 'watchlist') score += WATCHLIST_BASE
  if (ask.occasion === 'night' && movie.pool === 'watchlist') score += WATCHLIST_NIGHT
  if (score <= 0 && !ask.genre) return null
  if (score <= 0 && ask.genre && movie.genres.includes(ask.genre)) {
    // Genre-Treffer ohne Profil: Watchliste zählt trotzdem, Katalog ohne Geschmack nicht.
    if (movie.pool === 'watchlist') return ASK_WEIGHT
    return null
  }
  if (score <= 0) return null
  return score
}

export function whyLine(movie: MovieSeed, profile: TasteProfile, ask: RecommendAsk): string {
  const bits: string[] = []
  if (movie.pool === 'watchlist') bits.push('liegt auf der Watchliste')
  const shared = movie.genres.filter((g) => (profile.genreWeight[g] || 0) >= FAV_WEIGHT)
  if (shared.length) bits.push(`passt zu den Lieblingen (${labelGenre(shared[0])})`)
  else if (ask.genre && movie.genres.includes(ask.genre)) bits.push(`ist ${labelGenre(ask.genre)}`)
  else {
    const seenHit = movie.genres.filter((g) => (profile.genreWeight[g] || 0) > 0)
    if (seenHit.length) bits.push(`ähnelt Gesehenem (${labelGenre(seenHit[0])})`)
  }
  return bits.join(', ') || 'liegt in der Auswahl'
}

export function recommend(opts: {
  ask: RecommendAsk
  favorites: MovieSeed[]
  watched: MovieSeed[]
  candidates: MovieSeed[]
}): RecommendResult {
  const profile = buildProfile(opts.favorites, opts.watched)
  const limit = Math.max(1, Math.min(opts.ask.limit || RECOMMEND_LIMIT, 8))
  const ranked: RecommendPick[] = []
  const seen = new Set<string>()
  for (const movie of opts.candidates) {
    const key = movieKey(movie)
    if (!movie.title.trim() || seen.has(key)) continue
    const score = scoreMovie(movie, profile, opts.ask)
    if (score == null) continue
    seen.add(key)
    ranked.push({ movie, score, why: whyLine(movie, profile, opts.ask) })
  }
  ranked.sort((a, b) => b.score - a.score || a.movie.title.localeCompare(b.movie.title, 'de'))
  const picks = ranked.slice(0, limit)
  if (picks.length) return { picks }
  return { picks: [], emptyReason: emptyReason(opts.ask, profile) }
}

export function emptyReason(ask: RecommendAsk, profile: TasteProfile): string {
  const top = profile.topGenres[0]
  const taste = top ? `Deine Lieblinge und Gesehenes liegen vor allem bei ${labelGenre(top)}.` : 'Es liegt noch kein Filmgeschmack vor.'
  if (ask.genre) {
    return `Auf der Watchliste ist kein ${labelGenre(ask.genre)}. Ich erfinde keine Titel. ${taste}`
  }
  return `Nichts Passendes auf der Watchliste. Ich erfinde keine Titel. ${taste}`
}

export function formatRecommendReply(result: RecommendResult, ask: RecommendAsk): string {
  if (!result.picks.length) return result.emptyReason || emptyReason(ask, { genreWeight: {}, watchedKeys: new Set(), topGenres: [] })
  const head = ask.occasion === 'night'
    ? ask.genre
      ? `Für den ${labelGenre(ask.genre)}-Filmabend:`
      : 'Für den Filmabend:'
    : ask.genre
      ? `${cap(labelGenre(ask.genre))} zum Anschauen:`
      : 'Zum Anschauen:'
  const lines = result.picks.map((p, i) => {
    const year = p.movie.year ? ` (${p.movie.year})` : ''
    return `${i + 1}. ${p.movie.title}${year} — ${p.why}.`
  })
  return [head, ...lines].join(' ')
}

export function findOnWatchlist(title: string, watchlist: MovieSeed[]): MovieSeed | null {
  const want = normTitle(title)
  if (want.length < 2) return null
  const exact = watchlist.find((m) => normTitle(m.title) === want)
  if (exact) return exact
  return watchlist.find((m) => {
    const have = normTitle(m.title)
    return have.includes(want) || want.includes(have)
  }) || null
}

export function applyWatched(opts: {
  title: string
  watchlist: MovieSeed[]
  watched: MovieSeed[]
}): { movie: MovieSeed; already: boolean } | { missing: true } {
  const hit = findOnWatchlist(opts.title, opts.watchlist)
  if (!hit) return { missing: true }
  const key = movieKey(hit)
  const already = opts.watched.some((m) => movieKey(m) === key)
  return {
    already,
    movie: { ...hit, pool: 'watched' },
  }
}

export type WatchedPackDraft = {
  topic: string
  title: string
  aliases: string[]
  summary: string
  claims: Array<{ text: string; user_ok: true }>
  origin: 'user'
}

/** Internes Wissenszentrum: ein Pack, das alle Agenten per Retrieve sehen. Kein Overlay. */
export function buildWatchedPack(watched: MovieSeed[]): WatchedPackDraft {
  const newest = [...watched].reverse()
  const claims = newest.slice(0, 24).map((m) => {
    const year = m.year ? ` (${m.year})` : ''
    const g = m.genres[0] ? `, ${labelGenre(m.genres[0])}` : ''
    return { text: `Gesehen: ${m.title}${year}${g}.`, user_ok: true as const }
  })
  const bits = newest.slice(0, 12).map((m) => {
    const g = m.genres[0] ? ` (${labelGenre(m.genres[0])})` : ''
    return `${m.title}${g}`
  })
  const summary = watched.length
    ? `Gesehene Filme intern (${watched.length}): ${bits.join(', ')}.`
    : 'Noch keine gesehenen Filme.'
  return {
    topic: WATCHED_PACK_TOPIC,
    title: WATCHED_PACK_TITLE,
    aliases: ['gesehene filme', 'filme gesehen', 'geschaut', WATCHED_PACK_TOPIC],
    summary,
    claims,
    origin: 'user',
  }
}

export function labelGenre(g: GenreKey): string {
  if (g === 'sci-fi') return 'Sci-Fi'
  if (g === 'horror') return 'Horror'
  if (g === 'thriller') return 'Thriller'
  if (g === 'comedy') return 'Komödie'
  if (g === 'drama') return 'Drama'
  if (g === 'action') return 'Action'
  if (g === 'romance') return 'Romantik'
  if (g === 'animation') return 'Animation'
  if (g === 'crime') return 'Krimi'
  if (g === 'adventure') return 'Abenteuer'
  if (g === 'fantasy') return 'Fantasy'
  if (g === 'war') return 'Krieg'
  if (g === 'western') return 'Western'
  if (g === 'mystery') return 'Mystery'
  if (g === 'documentary') return 'Doku'
  return 'Familie'
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s
}

function normTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
