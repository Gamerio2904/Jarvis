import { getText, postJson } from './http-json.ts'
import { sourcesFromHtml } from './research-parse.ts'
import { TV_APP_LABEL, tvAppFromPackage, type TvAppId } from './tv-apps.ts'

const UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Jarvis/1.32'
const JW_URL = 'https://apis.justwatch.com/graphql'
const JW_QUERY = `query GetSearchTitles($searchTitlesFilter: TitleFilter!, $country: Country!, $language: Language!, $first: Int!, $filter: OfferFilter!) {
  popularTitles(country: $country, filter: $searchTitlesFilter, first: $first, sortBy: POPULAR) {
    edges {
      node {
        objectType
        content(country: $country, language: $language) { title originalReleaseYear }
        offers(country: $country, platform: WEB, filter: $filter) {
          monetizationType
          standardWebURL
          package { packageId clearName technicalName shortName }
        }
      }
    }
  }
}`

export type WatchMonetization = 'free' | 'ads' | 'flatrate' | 'rent' | 'buy' | 'other'

export type WatchOffer = {
  app: TvAppId
  monetization: WatchMonetization
  url?: string
  provider: string
}

export type WatchHit = {
  title: string
  year?: number
  objectType?: string
  offers: WatchOffer[]
  alsoFree: string[]
  target: WatchOffer | null
}

export function normalizeMonetization(raw: string | undefined): WatchMonetization {
  const t = String(raw || '').toLowerCase()
  if (t === 'free') return 'free'
  if (t === 'ads' || t === 'flatrate_and_ads') return 'ads'
  if (t === 'flatrate') return 'flatrate'
  if (t === 'rent') return 'rent'
  if (t === 'buy') return 'buy'
  return 'other'
}

export function monetizationRank(m: WatchMonetization): number {
  if (m === 'free') return 0
  if (m === 'ads') return 1
  if (m === 'flatrate') return 2
  if (m === 'rent') return 3
  if (m === 'buy') return 4
  return 9
}

export function parseWatchOffers(raw: unknown[]): WatchOffer[] {
  const out: WatchOffer[] = []
  const seen = new Set<string>()
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const pkg = (o.package && typeof o.package === 'object' ? o.package : {}) as Record<string, unknown>
    const app = tvAppFromPackage({
      packageId: typeof pkg.packageId === 'number' ? pkg.packageId : Number(pkg.packageId) || undefined,
      technicalName: String(pkg.technicalName || ''),
      clearName: String(pkg.clearName || ''),
      shortName: String(pkg.shortName || ''),
    })
    if (!app) continue
    const monetization = normalizeMonetization(String(o.monetizationType || ''))
    const url = String(o.standardWebURL || '').trim() || undefined
    const provider = String(pkg.clearName || TV_APP_LABEL[app])
    const key = `${app}|${monetization}|${url || ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ app, monetization, url, provider })
  }
  return out
}

export function freeElsewhere(raw: unknown[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const m = normalizeMonetization(String(o.monetizationType || ''))
    if (m !== 'free' && m !== 'ads') continue
    const pkg = (o.package && typeof o.package === 'object' ? o.package : {}) as Record<string, unknown>
    const label = String(pkg.clearName || '').trim()
    if (!label || seen.has(label)) continue
    if (
      tvAppFromPackage({
        packageId: typeof pkg.packageId === 'number' ? pkg.packageId : undefined,
        technicalName: String(pkg.technicalName || ''),
        clearName: label,
        shortName: String(pkg.shortName || ''),
      })
    ) {
      continue
    }
    seen.add(label)
    out.push(label)
  }
  return out
}

export function pickWatchTarget(offers: WatchOffer[], prefer?: TvAppId): WatchOffer | null {
  const pool = prefer ? offers.filter((o) => o.app === prefer) : offers
  const stream = pool
    .filter((o) => o.monetization === 'free' || o.monetization === 'ads' || o.monetization === 'flatrate')
    .slice()
    .sort((a, b) => {
      const d = monetizationRank(a.monetization) - monetizationRank(b.monetization)
      if (d) return d
      if (a.app === 'youtube' && b.app !== 'youtube') return -1
      if (b.app === 'youtube' && a.app !== 'youtube') return 1
      return 0
    })
  if (stream[0]) return stream[0]
  if (prefer && pool[0]) return pool[0]
  return null
}

export function youtubeVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (/youtu\.be$/i.test(host)) {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id && /^[\w-]{6,}$/.test(id) ? id : null
    }
    if (!/youtube\.com$/i.test(host)) return null
    const v = u.searchParams.get('v')
    if (v && /^[\w-]{6,}$/.test(v)) return v
    const m = /\/(?:embed|shorts)\/([\w-]{6,})/.exec(u.pathname)
    return m ? m[1] : null
  } catch {
    return null
  }
}

export function youtubeDeepLink(url?: string): string | undefined {
  if (!url) return undefined
  const id = youtubeVideoId(url)
  return id ? `https://www.youtube.com/watch?v=${id}` : undefined
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

async function justWatchSearch(title: string): Promise<WatchHit[]> {
  try {
    const { status, json } = await postJson(
      JW_URL,
      {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': UA,
      },
      {
        query: JW_QUERY,
        variables: {
          searchTitlesFilter: { searchQuery: title.slice(0, 80) },
          country: 'DE',
          language: 'de',
          first: 5,
          filter: { bestOnly: false },
        },
      },
      5_000,
    )
    if (status < 200 || status >= 400) return []
    const data = asRecord(json.data)
    const popular = asRecord(data?.popularTitles)
    const hits: WatchHit[] = []
    for (const edge of asArray(popular?.edges)) {
      const node = asRecord(asRecord(edge)?.node)
      if (!node) continue
      const content = asRecord(node.content)
      const name = String(content?.title || '').trim()
      if (!name) continue
      const rawOffers = asArray(node.offers)
      const offers = parseWatchOffers(rawOffers)
      hits.push({
        title: name,
        year: typeof content?.originalReleaseYear === 'number' ? content.originalReleaseYear : undefined,
        objectType: String(node.objectType || ''),
        offers,
        alsoFree: freeElsewhere(rawOffers),
        target: pickWatchTarget(offers),
      })
    }
    return hits
  } catch {
    return []
  }
}

function pickHit(hits: WatchHit[], preferType?: 'MOVIE' | 'SHOW'): WatchHit | null {
  if (!hits.length) return null
  if (preferType) {
    const typed = hits.find((h) => h.objectType === preferType)
    if (typed) return typed
  }
  return hits[0] || null
}

export async function youtubeSearch(title: string, mode: 'film' | 'video' = 'film'): Promise<string | undefined> {
  const q = encodeURIComponent(
    (mode === 'video' ? `${title} site:youtube.com` : `${title} ganzer Film site:youtube.com`).slice(0, 120),
  )
  try {
    const { status, text } = await getText(`https://html.duckduckgo.com/html/?q=${q}`, {
      Accept: 'text/html',
      'User-Agent': UA,
    })
    if (status < 200 || status >= 400 || !text) return undefined
    const sources = sourcesFromHtml(text)
    const ranked =
      mode === 'video'
        ? sources
        : sources.slice().sort((a, b) => {
            const ta = /trailer|teaser|clip|recap/i.test(`${a.title} ${a.url}`) ? 1 : 0
            const tb = /trailer|teaser|clip|recap/i.test(`${b.title} ${b.url}`) ? 1 : 0
            return ta - tb
          })
    for (const s of ranked) {
      const deep = youtubeDeepLink(s.url)
      if (deep) return deep
    }
  } catch {
    /* lookup failed */
  }
  return undefined
}

export function youtubeSearchLink(title: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(title.slice(0, 80))}`
}

export async function lookupWatch(
  title: string,
  opts?: { app?: TvAppId; kind?: 'movie' | 'show' | 'video' },
): Promise<WatchHit> {
  const preferType = opts?.kind === 'show' ? 'SHOW' : opts?.kind === 'movie' ? 'MOVIE' : undefined
  const hits = await justWatchSearch(title)
  const hit = pickHit(hits, preferType)
  if (hit) {
    const target = pickWatchTarget(hit.offers, opts?.app)
    if (target) return { ...hit, target }
    if (opts?.app) {
      return {
        ...hit,
        target: { app: opts.app, monetization: 'other', provider: TV_APP_LABEL[opts.app] },
      }
    }
    const yt = await youtubeSearch(title)
    if (yt) {
      return {
        ...hit,
        target: { app: 'youtube', monetization: 'free', url: yt, provider: 'YouTube' },
      }
    }
    return { ...hit, target: null }
  }
  if (opts?.app) {
    const url = opts.app === 'youtube' ? await youtubeSearch(title, opts.kind === 'video' ? 'video' : 'film') : undefined
    return {
      title,
      offers: [],
      alsoFree: [],
      target: {
        app: opts.app,
        monetization: url ? 'free' : 'other',
        url,
        provider: TV_APP_LABEL[opts.app],
      },
    }
  }
  const yt = await youtubeSearch(title)
  if (yt) {
    return {
      title,
      offers: [],
      alsoFree: [],
      target: { app: 'youtube', monetization: 'free', url: yt, provider: 'YouTube' },
    }
  }
  return { title, offers: [], alsoFree: [], target: null }
}
