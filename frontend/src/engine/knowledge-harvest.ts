import { listNotes, listResearchAudits, loadSettings, saveSettings } from './store.ts'
import type { ResearchSource } from './research-parse.ts'
import type { KnowledgeHarvest } from './knowledge-types.ts'
import type { TeachIntent } from './teach-parse.ts'
import { slugTopic, titleFromTopic } from './teach-parse.ts'
import { deepResearchTopic, harvestDeepTitle } from './research-parse.ts'

export function persistKnowledgeHarvest(h: KnowledgeHarvest): void {
  try {
    saveSettings({ last_knowledge_json: JSON.stringify(h) })
  } catch {
    /* Node ohne localStorage */
  }
}

export function readKnowledgeHarvest(): KnowledgeHarvest | null {
  try {
    const raw = loadSettings().last_knowledge_json
    if (!raw) return null
    const o = JSON.parse(raw) as KnowledgeHarvest
    if (!o?.text && !o?.topic) return null
    return o
  } catch {
    return null
  }
}

export function harvestFromResearch(query: string, answer: string, sources: ResearchSource[]): KnowledgeHarvest {
  const topic = slugTopic(deepResearchTopic(query)) || 'recherche'
  const snips = sources
    .map((s) => (s.snippet || s.title || '').trim())
    .filter((s) => s.length >= 12)
    .slice(0, 6)
  const text = [answer.trim(), ...snips].filter(Boolean).join(' ')
  return {
    topic,
    title: harvestDeepTitle(query),
    text: text.slice(0, 2400),
    sources,
    at: Date.now(),
  }
}

export async function harvestTeach(intent: TeachIntent): Promise<{
  topic: string
  title: string
  text: string
  sources: ResearchSource[]
  origin: 'paste' | 'research' | 'doc' | 'note' | 'user'
}> {
  if (intent.body && intent.body.length >= 8) {
    const topic = intent.topic || slugTopic(intent.body.slice(0, 40)) || 'fach'
    return {
      topic,
      title: titleFromTopic(topic),
      text: intent.body,
      sources: [],
      origin: 'paste',
    }
  }

  const pending = readKnowledgeHarvest()
  if (pending?.text && pending.text.length >= 8) {
    return {
      topic: intent.topic || pending.topic || 'recherche',
      title: pending.title || titleFromTopic(intent.topic || pending.topic || 'recherche'),
      text: pending.text,
      sources: pending.sources || [],
      origin: 'research',
    }
  }

  try {
    const audits = await listResearchAudits(1)
    const a = audits[0]
    if (a?.sources?.length) {
      const topic = intent.topic || slugTopic(a.query) || 'recherche'
      const text = a.sources.map((s) => s.snippet || s.title).filter(Boolean).join(' ')
      if (text.length >= 8) {
        return {
          topic,
          title: titleFromTopic(topic),
          text,
          sources: a.sources.map((s) => ({
            title: s.title,
            url: s.url,
            snippet: s.snippet || '',
            provider: s.provider || 'web',
            retrieved_at: a.created_at,
          })),
          origin: 'research',
        }
      }
    }
  } catch {
    /* */
  }

  try {
    const { listDocs } = await import('./doc.ts')
    const docs = await listDocs()
    const d = docs[0]
    if (d?.text && d.text.trim().length >= 8) {
      const topic = intent.topic || slugTopic(d.name) || 'dokument'
      return { topic, title: titleFromTopic(topic), text: d.text.slice(0, 2400), sources: [], origin: 'doc' }
    }
  } catch {
    /* */
  }

  try {
    const notes = await listNotes()
    const n = notes[0]
    if (n?.body && n.body.trim().length >= 8) {
      const topic = intent.topic || slugTopic(n.body.slice(0, 32)) || 'notiz'
      return { topic, title: titleFromTopic(topic), text: n.body, sources: [], origin: 'note' }
    }
  } catch {
    /* */
  }

  return {
    topic: intent.topic || '',
    title: '',
    text: '',
    sources: [],
    origin: 'user',
  }
}
