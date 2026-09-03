import type { ToolMeta } from './tools.ts'
import { loadSettings, saveSettings } from './store.ts'
import { parseTeachIntent, titleFromTopic, type TeachIntent } from './teach-parse.ts'
import { parsePackAsk, parsePackForget, parsePackRevise } from './pack-parse.ts'
import { harvestTeach } from './knowledge-harvest.ts'
import { knowledgeBlock } from './knowledge-block.ts'
import { retrievePacks } from './knowledge-retrieve.ts'
import {
  claimsFromText,
  deleteKnowledgePack,
  getByTopic,
  listKnowledgePacks,
  mergeClaims,
  putKnowledgePack,
  type KnowledgePack,
} from './knowledge-store.ts'

export { parseTeachIntent } from './teach-parse.ts'
export { parsePackAsk, parsePackForget, parsePackRevise } from './pack-parse.ts'
export { knowledgeBlock } from './knowledge-block.ts'
export { retrievePacks } from './knowledge-retrieve.ts'
export { persistKnowledgeHarvest, harvestFromResearch, readKnowledgeHarvest } from './knowledge-harvest.ts'
export {
  listKnowledgePacks,
  putKnowledgePack,
  deleteKnowledgePack,
  clearKnowledgePacks,
  getByTopic,
  claimsFromText,
  mergeClaims,
  normalizePack,
  prunePackList,
  resetKnowledgeMem,
  PACK_CAP,
  CLAIM_CAP,
} from './knowledge-store.ts'
export type { KnowledgePack } from './knowledge-store.ts'

type Hit = { handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }

function tool(id: string, action: string, label: string, extra?: Record<string, unknown>): ToolMeta {
  return { tool_status: 'executed', tool: id, action, label, result: extra }
}

export async function teachFromParts(opts: {
  topic: string
  title?: string
  text: string
  sources?: KnowledgePack['sources']
  origin: KnowledgePack['origin']
  merge?: boolean
}): Promise<KnowledgePack | { empty: true }> {
  const topic = opts.topic.trim()
  if (!topic || opts.text.trim().length < 8) return { empty: true }
  const urls = (opts.sources || []).map((s) => s.url).filter(Boolean)
  const incoming = claimsFromText(opts.text, urls)
  if (!incoming.length) return { empty: true }
  const prev = await getByTopic(topic)
  if (opts.merge && prev) {
    const { claims } = mergeClaims(prev.claims, incoming)
    return putKnowledgePack({
      ...prev,
      claims,
      sources: [...prev.sources, ...(opts.sources || [])].slice(0, 16),
      origin: opts.origin,
      user_ok: true,
    })
  }
  if (prev && !opts.merge) {
    const { claims } = mergeClaims(prev.claims, incoming)
    return putKnowledgePack({
      ...prev,
      claims,
      sources: [...(opts.sources || []), ...prev.sources].slice(0, 16),
      origin: opts.origin,
      user_ok: true,
    })
  }
  return putKnowledgePack({
    id: topic,
    topic,
    title: opts.title || titleFromTopic(topic),
    aliases: [],
    summary: incoming
      .slice(0, 3)
      .map((c) => c.text)
      .join(' '),
    claims: incoming,
    sources: opts.sources || [],
    origin: opts.origin,
    taught_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_ok: true,
  })
}

export async function handleTeach(_conversationId: string, text: string): Promise<Hit> {
  const last = loadSettingsSafe().last_step_tool
  const intent = parseTeachIntent(text, last)
  if (!intent) return { handled: false }
  return finishTeach(intent)
}

async function finishTeach(intent: TeachIntent): Promise<Hit> {
  const harvested = await harvestTeach(intent)
  if (!harvested.text || harvested.text.length < 8) {
    return {
      handled: true,
      reply: 'Nichts zum Lernen. Text hinter den Doppelpunkt setzen — oder zuerst recherchieren, dann «lern das».',
      tool: tool('teach', 'ask', 'Fachwissen'),
      lastTool: 'teach',
    }
  }
  const pack = await teachFromParts({
    topic: harvested.topic,
    title: harvested.title,
    text: harvested.text,
    sources: harvested.sources,
    origin: harvested.origin,
    merge: intent.kind === 'merge',
  })
  if ('empty' in pack) {
    return {
      handled: true,
      reply: 'Nichts zum Lernen. Kein Satz, den ich als Claim speichern kann.',
      tool: tool('teach', 'ask', 'Fachwissen'),
      lastTool: 'teach',
    }
  }
  persistLast('teach', pack.topic)
  return {
    handled: true,
    reply: `Gelernt: ${pack.title}, ${pack.claims.filter((c) => c.user_ok).length} Sätze.`,
    tool: tool('teach', 'store', 'Fachwissen', { topic: pack.topic, claims: pack.claims.length }),
    lastTool: 'teach',
  }
}

export async function handlePack(_conversationId: string, text: string): Promise<Hit> {
  const last = loadSettingsSafe().last_step_tool
  if (parsePackRevise(text, last)) {
    const topic = (loadSettingsSafe().last_step_title || '').trim()
    const pack = topic ? await getByTopic(topic) : (await listKnowledgePacks())[0]
    if (!pack) {
      return {
        handled: true,
        reply: 'Kein Fachwissen zum Korrigieren.',
        tool: tool('pack', 'revise', 'Fachwissen'),
        lastTool: 'pack',
      }
    }
    const next = {
      ...pack,
      claims: pack.claims.map((c) => ({ ...c, user_ok: false })),
      user_ok: false,
    }
    await putKnowledgePack(next)
    persistLast('pack', pack.topic)
    return {
      handled: true,
      reply: `Fachwissen «${pack.title}» gilt so nicht mehr. Claims bleiben in den Daten, kommen aber nicht mehr in den Prompt.`,
      tool: tool('pack', 'revise', 'Fachwissen', { topic: pack.topic }),
      lastTool: 'pack',
    }
  }

  const forget = parsePackForget(text)
  if (forget) {
    const pack = await getByTopic(forget.topic)
    if (!pack) {
      return {
        handled: true,
        reply: `Kein Fachwissen «${forget.topic}». Prefs bleiben.`,
        tool: tool('pack', 'forget', 'Fachwissen'),
        lastTool: 'pack',
      }
    }
    await deleteKnowledgePack(pack.id)
    persistLast('pack', '')
    return {
      handled: true,
      reply: `Fachwissen «${pack.title}» ist weg.`,
      tool: tool('pack', 'forget', 'Fachwissen', { topic: pack.topic }),
      lastTool: 'pack',
    }
  }

  const ask = parsePackAsk(text)
  if (!ask) return { handled: false }
  const packs = await listKnowledgePacks()
  const q = ask.topic || text
  const hits = retrievePacks(q, packs)
  if (!hits.length) {
    persistLast('pack', ask.topic || '')
    return {
      handled: true,
      reply: ask.topic
        ? `Nichts Belegtes zu «${ask.topic}» in den Fachwissen-Packs.`
        : 'Kein Pack zu dieser Frage. Nach einer Recherche «lern das» sagen.',
      tool: tool('pack', 'ask', 'Fachwissen'),
      lastTool: 'pack',
    }
  }
  const p = hits[0]
  persistLast('pack', p.topic)
  const claims = p.claims.filter((c) => c.user_ok).slice(0, 8)
  const body = claims.map((c) => c.text).join(' ')
  const src = p.sources.find((s) => s.url)?.url
  return {
    handled: true,
    reply: `${p.title}: ${body}${src ? ` Quelle: ${src}` : ''}`,
    tool: tool('pack', 'ask', 'Fachwissen', { topic: p.topic, claims: claims.length }),
    lastTool: 'pack',
  }
}

export function packAskReply(packs: KnowledgePack[], ask: string): string {
  const hits = retrievePacks(ask, packs)
  if (!hits.length) return ''
  return knowledgeBlock(packs, ask)
}

function persistLast(tool: string, title: string): void {
  try {
    saveSettings({ last_step_tool: tool, last_step_title: title })
  } catch {
    /* */
  }
}

function loadSettingsSafe(): { last_step_tool: string; last_step_title: string } {
  try {
    const s = loadSettings()
    return { last_step_tool: s.last_step_tool || '', last_step_title: s.last_step_title || '' }
  } catch {
    return { last_step_tool: '', last_step_title: '' }
  }
}
