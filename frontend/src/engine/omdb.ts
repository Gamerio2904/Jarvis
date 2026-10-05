import { getJson } from './http-json.ts'
import { loadSettings } from './store.ts'

export type OmdbHit = {
  title: string
  year?: string
  imdb?: string
  imdbId?: string
  tomatoes?: string
  plot?: string
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
    const { status, json } = await getJson(`https://www.omdbapi.com/?${q}`, {
      Accept: 'application/json',
      'User-Agent': 'Jarvis/2.0.1 (local.jarvis.app)',
    })
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
  for (const row of ratings) {
    if (!row || typeof row !== 'object') continue
    const src = String((row as Record<string, unknown>).Source || '')
    const val = String((row as Record<string, unknown>).Value || '').trim()
    if (/rotten\s*tomatoes/i.test(src) && val) tomatoes = val
  }
  const imdb = String(json.imdbRating || '').trim()
  return {
    title,
    year: String(json.Year || '').trim() || undefined,
    imdb: imdb && imdb !== 'N/A' ? imdb : undefined,
    imdbId: String(json.imdbID || '').trim() || undefined,
    tomatoes: tomatoes && tomatoes !== 'N/A' ? tomatoes : undefined,
    plot: String(json.Plot || '').trim() && String(json.Plot) !== 'N/A' ? String(json.Plot).trim() : undefined,
  }
}

function tomatoOf(v: unknown): string | undefined {
  const s = String(v || '').trim()
  if (!s || s === 'N/A') return undefined
  return s
}
