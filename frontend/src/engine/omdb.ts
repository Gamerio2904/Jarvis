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

/** Karte und Chat: RT-Publikum nur wenn OMDb es liefert, sonst IMDb — nie IMDb als „Publikum“. */
export function watchScoreLine(m: {
  critic?: string | null
  audience?: string | null
  imdbScore?: string | null
}): { scores: string; source: string } {
  const critic = (m.critic || '').trim()
  const audience = (m.audience || '').trim()
  const imdb = (m.imdbScore || '').trim()
  const imdbLabel = imdb ? imdb.replace('.', ',') : ''
  const criticBit = `Kritiker ${critic || '—'}`
  let second = 'Publikum —'
  if (audience) second = `Publikum ${audience}`
  else if (imdbLabel) second = `IMDb ${imdbLabel}`
  const sources: string[] = []
  if (critic || audience) sources.push('Rotten Tomatoes')
  if (imdbLabel && !audience) sources.push('IMDb')
  if (!sources.length) sources.push('Rotten Tomatoes')
  return {
    scores: `${criticBit} · ${second}`,
    source: `${[...new Set(sources)].join(', ')} über OMDb`,
  }
}

const KEY_HINT =
  'OMDb-Schlüssel unter Einstellungen → Cloud (omdbapi.com, kostenlos). Rotten Tomatoes hat keine eigene öffentliche API — Noten nur wenn OMDb sie liefert. Ich erfinde keine.'

export function omdbKeyHint(): string {
  return KEY_HINT
}

export async function lookupOmdb(
  title: string,
  year?: number,
): Promise<{ ok: true; hit: OmdbHit } | { ok: false; message: string; needKey?: boolean }> {
  const key = loadSettings().omdb_api_key.trim()
  if (!key) {
    return { ok: false, needKey: true, message: KEY_HINT }
  }
  const q = new URLSearchParams({
    apikey: key,
    t: title.slice(0, 80),
    tomatoes: 'true',
    plot: 'short',
    type: 'movie',
  })
  if (year && year > 1900 && year < 2100) q.set('y', String(year))
  try {
    const { status, json } = await getJson(`https://www.omdbapi.com/?${q}`, jsonUA)
    if (status === 401 || status === 403) {
      return { ok: false, needKey: true, message: 'OMDb-Schlüssel ungültig. In den Einstellungen prüfen.' }
    }
    if (status < 200 || status >= 300) {
      return { ok: false, message: 'OMDb nicht erreichbar. Keine erfundenen Noten.' }
    }
    if (String(json.Response) === 'False') {
      const err = String(json.Error || '')
      if (/invalid\s+api\s+key/i.test(err)) {
        return { ok: false, needKey: true, message: 'OMDb-Schlüssel ungültig. In den Einstellungen prüfen.' }
      }
      return { ok: false, message: 'Titel bei IMDb/OMDb nicht gefunden. Ich rate keine Bewertung.' }
    }
    const hit = fromOmdb(json)
    if (!hit) return { ok: false, message: 'OMDb ohne verwertbare Felder. Ich rate keine Bewertung.' }
    return { ok: true, hit }
  } catch {
    return { ok: false, message: 'OMDb nicht erreichbar. Keine erfundenen Noten.' }
  }
}

function fromOmdb(json: Record<string, unknown>): OmdbHit | null {
  const title = String(json.Title || '').trim()
  if (!title) return null
  const ratings = Array.isArray(json.Ratings) ? json.Ratings : []
  let tomatoes = tomatoOf(json.tomatoMeter) || tomatoOf(json.tomatoRating)
  let imdb = String(json.imdbRating || '').trim()
  if (!imdb || imdb === 'N/A') imdb = ''
  for (const row of ratings) {
    if (!row || typeof row !== 'object') continue
    const src = String((row as Record<string, unknown>).Source || '')
    const val = String((row as Record<string, unknown>).Value || '').trim()
    if (!val || val === 'N/A') continue
    if (/rotten\s*tomatoes/i.test(src) && !/audience|popcorn/i.test(src)) tomatoes = val
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
    audience: tomatoOf(json.tomatoUserMeter),
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
