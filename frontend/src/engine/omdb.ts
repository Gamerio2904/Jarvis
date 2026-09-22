import { getJson } from './http-json.ts'
import { jsonUA } from './ua.ts'
import { loadSettings } from './store.ts'

export type OmdbHit = {
  title: string
  year?: string
  imdb?: string
  imdbId?: string
  tomatoes?: string
  audience?: string
  poster?: string
  genre?: string
  plot?: string
}

/** Folie: Kritiker und Publikum immer, IMDb extra. IMDb nie als „Publikum“. */
export function watchScoreParts(m: {
  critic?: string | null
  audience?: string | null
  imdbScore?: string | null
}): { critic: string; audience: string; imdb: string; source: string } {
  const critic = (m.critic || '').trim() || '—'
  const audience = (m.audience || '').trim() || '—'
  const imdbRaw = (m.imdbScore || '').trim()
  const imdb = imdbRaw ? imdbRaw.replace('.', ',') : ''
  const sources: string[] = []
  if (critic !== '—' || audience !== '—') sources.push('Rotten Tomatoes')
  if (imdb) sources.push('IMDb')
  if (!sources.length) {
    return { critic, audience, imdb, source: 'Keine Note bei OMDb' }
  }
  return {
    critic,
    audience,
    imdb,
    source: `${[...new Set(sources)].join(', ')} über OMDb`,
  }
}

/** Chat und Tests: dieselben Felder in einer Zeile. */
export function watchScoreLine(m: {
  critic?: string | null
  audience?: string | null
  imdbScore?: string | null
}): { scores: string; source: string } {
  const p = watchScoreParts(m)
  const bits = [`Kritiker ${p.critic}`, `Publikum ${p.audience}`]
  if (p.imdb) bits.push(`IMDb ${p.imdb}`)
  return { scores: bits.join(' · '), source: p.source }
}

const KEY_HINT =
  'OMDb-Schlüssel unter Einstellungen → Cloud (omdbapi.com, kostenlos). Rotten Tomatoes hat keine eigene öffentliche API — Noten nur wenn OMDb sie liefert. Ich erfinde keine.'

export function omdbKeyHint(): string {
  return KEY_HINT
}

export function splitFilmTitle(title: string): string {
  return (title || '')
    .replace(/([a-zäöüß])([A-ZÄÖÜ])/g, '$1 $2')
    .replace(/([A-Za-zÄÖÜäöüß])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-zÄÖÜäöüß])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

const FILM_ALIAS: Array<[RegExp, string]> = [
  [/star\s*wars\s*(?:episode\s*)?(?:3|iii|drei)\b/i, 'Star Wars: Episode III'],
  [/star\s*wars\s*(?:episode\s*)?(?:2|ii|zwei)\b/i, 'Star Wars: Episode II'],
  [/star\s*wars\s*(?:episode\s*)?(?:1|i|eins)\b/i, 'Star Wars: Episode I'],
  [/star\s*wars\s*(?:episode\s*)?(?:5|v|fünf|fuenf)\b/i, 'Star Wars: Episode V'],
  [/star\s*wars\s*(?:episode\s*)?(?:6|vi|sechs)\b/i, 'Star Wars: Episode VI'],
  [/inglou?rious\s*bast[ae]rds?\b/i, 'Inglourious Basterds'],
]

export function expandFilmTitle(title: string): string[] {
  const raw = (title || '').trim()
  const spaced = splitFilmTitle(raw)
  const out = [raw, spaced].filter(Boolean)
  const key = spaced.toLowerCase()
  for (const [re, alias] of FILM_ALIAS) {
    if (re.test(key)) out.push(alias)
  }
  return [...new Set(out)]
}

export function filmTitleKeys(title: string): string[] {
  return [
    ...new Set(
      expandFilmTitle(title).map((t) =>
        splitFilmTitle(t)
          .toLowerCase()
          .replace(/[^a-z0-9äöüß]+/g, ' ')
          .trim(),
      ),
    ),
  ].filter(Boolean)
}

/** Gleicher Film, nicht Franchise-Teilmenge (Star Wars ≠ Episode III). */
export function sameFilmTitle(a: string, b: string): boolean {
  const have = new Set(filmTitleKeys(a))
  return filmTitleKeys(b).some((k) => have.has(k))
}

async function omdbBy(params: URLSearchParams): Promise<Record<string, unknown> | null> {
  params.set('_', String(Date.now()))
  const { status, json } = await getJson(`https://www.omdbapi.com/?${params}`, jsonUA)
  if (status === 401 || status === 403) return { __needKey: true }
  if (status < 200 || status >= 300) return null
  return json
}

export async function lookupOmdb(
  title: string,
  year?: number,
): Promise<{ ok: true; hit: OmdbHit } | { ok: false; message: string; needKey?: boolean }> {
  const key = loadSettings().omdb_api_key.trim()
  if (!key) {
    return { ok: false, needKey: true, message: KEY_HINT }
  }
  const names = expandFilmTitle(title)
  try {
    for (const name of names) {
      const q = new URLSearchParams({
        apikey: key,
        t: name.slice(0, 80),
        tomatoes: 'true',
        plot: 'short',
        type: 'movie',
      })
      if (year && year > 1900 && year < 2100) q.set('y', String(year))
      const json = await omdbBy(q)
      if (json && json.__needKey) {
        return { ok: false, needKey: true, message: 'OMDb-Schlüssel ungültig. In den Einstellungen prüfen.' }
      }
      if (json && String(json.Response) === 'False') {
        const err = String(json.Error || '')
        if (/invalid\s+api\s+key/i.test(err)) {
          return { ok: false, needKey: true, message: 'OMDb-Schlüssel ungültig. In den Einstellungen prüfen.' }
        }
        continue
      }
      const hit = json ? fromOmdb(json) : null
      if (hit) return { ok: true, hit }
    }
    const search = new URLSearchParams({
      apikey: key,
      s: names[0].slice(0, 80),
      type: 'movie',
    })
    const found = await omdbBy(search)
    const rows = found && Array.isArray(found.Search) ? found.Search : []
    const first = rows.find((r) => r && typeof r === 'object' && String((r as { imdbID?: string }).imdbID || '').startsWith('tt'))
    const imdbId = first ? String((first as { imdbID?: string }).imdbID) : ''
    if (imdbId) {
      const byId = new URLSearchParams({
        apikey: key,
        i: imdbId,
        tomatoes: 'true',
        plot: 'short',
      })
      const json = await omdbBy(byId)
      const hit = json ? fromOmdb(json) : null
      if (hit) return { ok: true, hit }
    }
    return { ok: false, message: 'Titel bei IMDb/OMDb nicht gefunden. Ich rate keine Bewertung.' }
  } catch {
    return { ok: false, message: 'OMDb nicht erreichbar. Keine erfundenen Noten.' }
  }
}

function fromOmdb(json: Record<string, unknown>): OmdbHit | null {
  const title = String(json.Title || '').trim()
  if (!title) return null
  const ratings = Array.isArray(json.Ratings) ? json.Ratings : []
  let tomatoes = tomatoOf(json.tomatoMeter) || tomatoOf(json.tomatoRating)
  let audience = tomatoOf(json.tomatoUserMeter)
  let imdb = String(json.imdbRating || '').trim()
  if (!imdb || imdb === 'N/A') imdb = ''
  for (const row of ratings) {
    if (!row || typeof row !== 'object') continue
    const src = String((row as Record<string, unknown>).Source || '')
    const val = String((row as Record<string, unknown>).Value || '').trim()
    if (!val || val === 'N/A') continue
    if (/rotten\s*tomatoes/i.test(src) && /audience|popcorn/i.test(src)) {
      audience = tomatoOf(val) || audience
      continue
    }
    if (/rotten\s*tomatoes/i.test(src)) tomatoes = val
    if (!imdb && /imdb|internet movie database/i.test(src)) {
      imdb = val.replace(/\s*\/\s*10\s*$/i, '').trim()
    }
  }
  return {
    title,
    year: String(json.Year || '').trim() || undefined,
    imdb: imdb && imdb !== 'N/A' ? imdb : undefined,
    imdbId: String(json.imdbID || '').trim() || undefined,
    tomatoes: tomatoes && tomatoes !== 'N/A' ? tomatoes : undefined,
    audience,
    poster: posterOf(json.Poster),
    genre: String(json.Genre || '').trim() && String(json.Genre) !== 'N/A' ? String(json.Genre).trim() : undefined,
    plot: String(json.Plot || '').trim() && String(json.Plot) !== 'N/A' ? String(json.Plot).trim() : undefined,
  }
}

function posterOf(v: unknown): string | undefined {
  const s = String(v || '').trim()
  if (!s || s === 'N/A' || !/^https?:\/\//i.test(s)) return undefined
  return s
}

export { fromOmdb }

function tomatoOf(v: unknown): string | undefined {
  const s = String(v || '').trim()
  if (!s || s === 'N/A') return undefined
  return s
}
