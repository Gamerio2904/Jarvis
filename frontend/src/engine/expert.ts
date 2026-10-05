import { parseExpertIntent, readExpertTopics, type ExpertIntent } from './expert-parse.ts'
import { slugTopic, titleFromTopic } from './teach-parse.ts'
import { fillDeepResearchLinks } from './web-search.ts'
import {
  deleteKnowledgePack,
  getByTopic,
  listKnowledgePacks,
  retrievePacks,
  teachFromParts,
  type KnowledgePack,
} from './knowledge.ts'
import { isCommNo, isCommYes } from './places-parse.ts'
import { clearPending, getPending, loadSettings, saveSettings, setPending } from './store.ts'
import type { ToolMeta } from './tools.ts'

export { parseExpertIntent } from './expert-parse.ts'

type Hit = { handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }

function tool(action: string): ToolMeta {
  return { tool_status: 'executed', tool: 'expert', action, label: 'Experte' }
}

function persistLast(title: string): void {
  try {
    saveSettings({ last_step_tool: 'expert', last_step_title: title })
  } catch {
    /* */
  }
}

function topicsFromSettings(): string[] {
  try {
    return readExpertTopics(loadSettings().expert_topics_json || '')
  } catch {
    return []
  }
}

function writeTopics(topics: string[]): void {
  const uniq = [...new Set(topics.map((t) => t.trim()).filter(Boolean))].slice(0, 24)
  saveSettings({ expert_topics_json: JSON.stringify(uniq) })
}

async function listExperts(): Promise<KnowledgePack[]> {
  const rows = await listKnowledgePacks()
  return rows.filter((p) => p.origin === 'expert' || p.source_agent === 'expert')
}

function packLine(p: KnowledgePack): string {
  const n = p.claims.filter((c) => c.user_ok).length
  const src = p.sources.find((s) => s.url)?.url
  return `${p.title}: ${n} Sätze${src ? `. Quelle: ${src}` : ''}`
}

async function researchTopic(topic: string): Promise<KnowledgePack | { empty: true; reason: string }> {
  const title = titleFromTopic(slugTopic(topic) || topic)
  const query = `Deep Research ${title}`
  const meta = await fillDeepResearchLinks(query, '')
  const sources = (meta.sources || []).filter((s) => s.url)
  const text = sources
    .map((s) => `${s.title}. ${s.snippet}`.trim())
    .filter((s) => s.length >= 8)
    .join(' ')
  if (text.length < 24 || sources.length < 1) {
    return { empty: true, reason: `Keine belegten Quellen zu «${title}». Experte nicht angelegt.` }
  }
  const pack = await teachFromParts({
    topic: slugTopic(topic) || title.toLowerCase(),
    title,
    text,
    sources,
    origin: 'expert',
    merge: true,
    source_agent: 'expert',
  })
  if ('empty' in pack) return { empty: true, reason: `Nichts Speichbares zu «${title}».` }
  writeTopics([...topicsFromSettings(), pack.topic, title])
  persistLast(pack.topic)
  return pack
}

async function finishCreate(topic: string): Promise<Hit> {
  const pack = await researchTopic(topic)
  if ('empty' in pack) {
    return { handled: true, reply: pack.reason, tool: tool('empty'), lastTool: 'expert' }
  }
  return {
    handled: true,
    reply: `Experte «${pack.title}» steht. ${pack.claims.filter((c) => c.user_ok).length} belegte Sätze. Fragen Sie ihn — ohne Quelle bleibt die Antwort leer.`,
    tool: tool('create'),
    lastTool: 'expert',
  }
}

export async function handleExpert(conversationId: string, text: string): Promise<Hit> {
  const last = (() => {
    try {
      return loadSettings().last_step_tool || ''
    } catch {
      return ''
    }
  })()
  const topicsRaw = (() => {
    try {
      return loadSettings().expert_topics_json || ''
    } catch {
      return ''
    }
  })()

  const pending = await getPending(conversationId)
  if (pending?.tool === 'expert' && pending.action === 'create') {
    const topic = String(pending.args.topic || '')
    if (isCommNo(text)) {
      await clearPending(conversationId)
      return { handled: true, reply: 'Kein Experte angelegt.', tool: tool('cancel'), lastTool: 'expert' }
    }
    if (isCommYes(text) || parseExpertIntent(text, 'expert_offer', topicsRaw)?.kind === 'create') {
      await clearPending(conversationId)
      if (!topic) {
        return { handled: true, reply: 'Welches Thema?', tool: tool('ask'), lastTool: 'expert' }
      }
      return finishCreate(topic)
    }
  }

  const intent: ExpertIntent | null = parseExpertIntent(text, last, topicsRaw)
  if (!intent) return { handled: false }

  if (intent.kind === 'list') {
    const rows = await listExperts()
    persistLast('')
    if (!rows.length) {
      return {
        handled: true,
        reply: 'Kein Experte. Sagen Sie «werde ein Experte in Star Wars».',
        tool: tool('list'),
        lastTool: 'expert',
      }
    }
    return {
      handled: true,
      reply: `Experten: ${rows.map((p) => p.title).join(', ')}.`,
      tool: tool('list'),
      lastTool: 'expert',
    }
  }

  if (intent.kind === 'forget') {
    const pack = await getByTopic(intent.topic)
    if (!pack || (pack.origin !== 'expert' && pack.source_agent !== 'expert')) {
      return {
        handled: true,
        reply: `Kein Experte «${intent.topic}».`,
        tool: tool('forget'),
        lastTool: 'expert',
      }
    }
    await deleteKnowledgePack(pack.id)
    writeTopics(topicsFromSettings().filter((t) => slugTopic(t) !== pack.topic && t.toLowerCase() !== pack.title.toLowerCase()))
    persistLast('')
    return { handled: true, reply: `Experte «${pack.title}» ist weg.`, tool: tool('forget'), lastTool: 'expert' }
  }

  if (intent.kind === 'create' && !intent.confirm) {
    await setPending({
      conversation_id: conversationId,
      tool: 'expert',
      action: 'create',
      args: { topic: intent.topic },
      preview: intent.topic,
      created_at: new Date().toISOString(),
    })
    persistLast(intent.topic)
    return {
      handled: true,
      reply: `Ich lege den Experten «${titleFromTopic(slugTopic(intent.topic) || intent.topic)}» an und recherchiere tief. Nur Quellen, nichts Erfundenes. Ja?`,
      tool: tool('confirm'),
      lastTool: 'expert',
    }
  }

  if (intent.kind === 'create' && intent.confirm) {
    const topic = pending?.args && String(pending.args.topic || '') || last || ''
    const title = (() => {
      try {
        return loadSettings().last_step_title || topic
      } catch {
        return topic
      }
    })()
    if (!title) {
      return { handled: true, reply: 'Welches Thema?', tool: tool('ask'), lastTool: 'expert' }
    }
    return finishCreate(title)
  }

  const q = intent.kind === 'ask' ? intent.topic || text : text
  const packs = (await listExperts()).length ? await listExperts() : await listKnowledgePacks()
  const experts = (await listExperts())
  const pool = experts.length ? experts : packs
  const hits = retrievePacks(q, pool)
  if (!hits.length) {
    persistLast(intent.kind === 'ask' ? intent.topic || '' : '')
    return {
      handled: true,
      reply: 'Dazu steht im Experten-Pack nichts Belegtes. Keine Erfindung.',
      tool: tool('ask'),
      lastTool: 'expert',
    }
  }
  const p = hits[0]
  persistLast(p.topic)
  return {
    handled: true,
    reply: packLine(p) + (p.claims.filter((c) => c.user_ok).length ? `. ${p.claims.filter((c) => c.user_ok).slice(0, 6).map((c) => c.text).join(' ')}` : ''),
    tool: tool('ask'),
    lastTool: 'expert',
  }
}
