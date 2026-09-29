/** GitHub Search nur mit User-Token. Offizielle REST, kein Login-Scraping. */

import { getJson } from './http-json.ts'
import { loadSettings } from './store.ts'
import type { ResearchSource } from './research-parse.ts'

export function githubToken(): string {
  return (loadSettings().github_token || '').trim()
}

export async function searchGithubRepos(query: string): Promise<{
  sources: ResearchSource[]
  note: string
}> {
  const q = query.replace(/\s+/g, ' ').trim().slice(0, 120)
  const token = githubToken()
  if (!token) {
    return {
      sources: [],
      note: 'Ohne GitHub-Key nur öffentliche HTML-Suche, unvollständig.',
    }
  }
  if (!q) return { sources: [], note: 'Keine Suchfrage.' }
  try {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=5`
    const { status, json } = await getJson(url, {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    })
    if (status < 200 || status >= 400) {
      return { sources: [], note: 'GitHub hat nicht geantwortet.' }
    }
    const items = Array.isArray(json.items) ? json.items : []
    const now = new Date().toISOString()
    const sources: ResearchSource[] = []
    for (const row of items.slice(0, 5)) {
      if (!row || typeof row !== 'object') continue
      const o = row as Record<string, unknown>
      const html = String(o.html_url || '')
      if (!/^https:\/\/github\.com\//i.test(html)) continue
      sources.push({
        title: String(o.full_name || o.name || 'repo'),
        url: html,
        snippet: String(o.description || '').slice(0, 220),
        provider: 'github',
        retrieved_at: now,
      })
    }
    return { sources, note: sources.length ? '' : 'GitHub: keine Repos.' }
  } catch {
    return { sources: [], note: 'GitHub hat nicht geantwortet.' }
  }
}
