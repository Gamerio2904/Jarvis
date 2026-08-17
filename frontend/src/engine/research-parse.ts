export type ResearchSource = {
  title: string
  url: string
  snippet: string
  provider: string
  retrieved_at: string
}

export type ResearchMeta = {
  used?: boolean
  status?: string
  query?: string
  sources?: ResearchSource[]
  error?: string | null
  diverges?: boolean
  privacy_note?: string | null
  badge?: string | null
  audit_id?: string
  status_label?: string | null
  network_attempted?: boolean
}

export function isLiveLookup(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 240) return false
  if (/\b(suche|recherchier(?:e|en)?|google(?:n)?|im internet|im netz|schau(?:e)? nach)\b/i.test(t)) {
    return true
  }
  if (/\b(wetter|temperatur|nachrichten|news)\b/i.test(t)) return true
  if (/\baktuell(?:e[rs]?)?\b/i.test(t) && /\b(preis|kurs|spielstand|wetter)\b/i.test(t)) return true
  return false
}

export function researchQuery(text: string): string {
  const t = text.trim().replace(/[.!?]+$/g, '')
  const m =
    /^\s*(?:suche(?:\s+(?:im\s+)?(?:internet|netz|web))?(?:\s+nach)?|recherchier(?:e|en)?(?:\s+nach)?|google(?:n)?(?:\s+nach)?|schau(?:e)?\s+nach)\s+(.+?)\s*$/i.exec(
      t,
    )
  if (m) return m[1].replace(/^(?:nach\s+)/i, '').trim() || t
  return t
}

export function researchStatusLabel(r?: ResearchMeta | null): string {
  const n = r?.sources?.filter((s) => s.url).length || 0
  if (n) return `${n} Quellen`
  if (r?.network_attempted) return 'Suche ohne Links'
  if (r?.status && r.status !== 'empty' && r.status !== 'ok') return r.status
  return 'Quellen'
}

export const RESEARCH_OFF_REPLY =
  'Live-Suche ist aus. Unter Einstellungen Internet-Research an — sonst erfinde ich kein Wetter und keine Suche.'

export const RESEARCH_NEEDS_GEMINI =
  'Research braucht Gemini. Unter Einstellungen Gemini an, dann die Suche nochmal.'

export const RESEARCH_EMPTY =
  'Netz hat nicht geantwortet. Ich rate keine Rezepte und keine Fakten aus dem Kopf.'

export function researchHasSources(r?: ResearchMeta | null): boolean {
  return Boolean(r?.sources?.some((s) => Boolean(s.url)))
}

export function mergeResearchSources(
  base: ResearchMeta | undefined,
  extra: ResearchSource[],
  query: string,
): ResearchMeta {
  const now = new Date().toISOString()
  const seen = new Set<string>()
  const sources: ResearchSource[] = []
  for (const s of [...(base?.sources || []), ...extra]) {
    const url = (s.url || '').trim()
    if (!url || seen.has(url)) continue
    seen.add(url)
    sources.push({
      title: s.title || hostOf(url) || 'Quelle',
      url,
      snippet: s.snippet || '',
      provider: s.provider || 'web',
      retrieved_at: s.retrieved_at || now,
    })
  }
  const q = (base?.query || query).trim()
  return {
    used: sources.length > 0,
    status: sources.length ? 'ok' : 'empty',
    status_label: sources.length ? `${sources.length} Quellen` : 'Suche ohne Links',
    badge: sources.length ? 'Quellen' : 'Suche',
    query: q,
    sources,
    network_attempted: true,
    privacy_note: 'Nur die Suchanfrage ging ins Netz. Tippen öffnet die Seite.',
    error: base?.error || null,
    audit_id: base?.audit_id,
  }
}

export function sourcesFromText(text: string, provider = 'answer'): ResearchSource[] {
  const now = new Date().toISOString()
  const found: ResearchSource[] = []
  const seen = new Set<string>()
  const md = /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/g
  let m: RegExpExecArray | null
  while ((m = md.exec(text))) {
    const url = cleanUrl(m[1])
    if (!url || seen.has(url)) continue
    seen.add(url)
    found.push({
      title: hostOf(url) || 'Quelle',
      url,
      snippet: '',
      provider,
      retrieved_at: now,
    })
  }
  const bare = /https?:\/\/[^\s)<>"']+/g
  while ((m = bare.exec(text))) {
    const url = cleanUrl(m[0])
    if (!url || seen.has(url)) continue
    seen.add(url)
    found.push({
      title: hostOf(url) || 'Quelle',
      url,
      snippet: '',
      provider,
      retrieved_at: now,
    })
  }
  return found
}

export function sourcesFromHtml(html: string, provider = 'duckduckgo'): ResearchSource[] {
  const now = new Date().toISOString()
  const out: ResearchSource[] = []
  const seen = new Set<string>()
  const re = /<a[^>]+class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const url = unwrapDdg(m[1])
    if (!url || seen.has(url)) continue
    seen.add(url)
    const title = stripTags(m[2]).trim() || hostOf(url)
    out.push({ title, url, snippet: '', provider, retrieved_at: now })
    if (out.length >= 6) break
  }
  if (!out.length) {
    const hrefs = /href="(https?:\/\/[^"]+)"/gi
    while ((m = hrefs.exec(html))) {
      const url = cleanUrl(m[1])
      if (!url || seen.has(url) || /duckduckgo\.com|google\.com\/aclk/i.test(url)) continue
      seen.add(url)
      out.push({
        title: hostOf(url) || 'Quelle',
        url,
        snippet: '',
        provider,
        retrieved_at: now,
      })
      if (out.length >= 6) break
    }
  }
  return out
}

function unwrapDdg(href: string): string {
  try {
    const u = new URL(href, 'https://html.duckduckgo.com/')
    const uddg = u.searchParams.get('uddg')
    if (uddg) return cleanUrl(uddg)
    return cleanUrl(u.href)
  } catch {
    return cleanUrl(href)
  }
}

function cleanUrl(raw: string): string {
  const url = raw.replace(/[.,;:]+$/g, '').trim()
  if (!/^https?:\/\//i.test(url)) return ''
  if (/vertexaisearch\.cloud\.google\.com/i.test(url)) return url
  return url
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ')
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
