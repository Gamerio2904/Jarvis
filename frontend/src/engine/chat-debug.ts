import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import {
  APP_VERSION,
  isGeminiConfigured,
  listConversations,
  listMemory,
  listMessages,
  listResearchAudits,
  loadSettings,
  type Conversation,
  type Message,
} from './store.ts'
import type { ResearchMeta } from './research-parse.ts'
import type { ToolMeta } from './tools.ts'

export type DebugMeta = {
  route: string
  model: string
  gemini: boolean
  voice?: boolean
  executed?: boolean
  tool_status?: string
  scrubbed?: boolean
  raw?: string
  missed?: string[]
  routes?: string[]
}

const FAKE_ACTION =
  /\b(?:ich\s+habe\s+(?:gerade\s+)?(?:den\s+fernseher|das\s+todo|die\s+notiz)|habe\s+ich\s+(?:gemacht|erledigt|gespeichert|notiert|angeschaltet|ausgeschaltet|gekoppelt)|ich\s+öffne\s+die\s+musik|musik\s+läuft|spotify\s+ist\s+verbunden|car\s*play\s+ist\s+verbunden)\b/i
const FAKE_SEARCH =
  /ich habe (?:das )?internet|das internet (?:nach .+ )?(?:durchsucht|gesucht)|im internet (?:nach .+ )?gesucht/i
const DUZEN = /\b(du|dir|dich|dein|deine)\b/i

export function flagReply(
  user: string,
  assistant: string,
  meta?: Record<string, unknown> | null,
): string[] {
  const flags: string[] = []
  const debug = (meta?.debug && typeof meta.debug === 'object' ? meta.debug : {}) as DebugMeta
  const tool = (meta?.tool && typeof meta.tool === 'object' ? meta.tool : null) as ToolMeta | null
  const research = (meta?.research && typeof meta.research === 'object' ? meta.research : null) as ResearchMeta | null
  const route = debug.route || (tool?.tool ? String(tool.tool) : research ? 'research' : 'unknown')
  const executed = tool?.tool_status === 'executed' || debug.executed === true

  if (FAKE_ACTION.test(assistant) && !executed) flags.push('hallucinated_action')
  if (FAKE_SEARCH.test(assistant) && !research?.used && !(research?.sources || []).length) {
    flags.push('hallucinated_search')
  }
  if (DUZEN.test(assistant)) flags.push('duzen')
  if (debug.scrubbed) flags.push('scrubbed')
  if (tool?.tool_status === 'error') flags.push('tool_error')
  if (executed) flags.push('tool_executed')
  if (route === 'llm' || route === 'unknown') flags.push(route === 'llm' ? 'llm' : 'no_debug_meta')
  if (research && !(research.sources || []).length) flags.push('research_empty')
  if ((research?.sources || []).length) flags.push('research_ok')
  void user
  return flags
}

export type ChatDebugDump = {
  kind: 'jarvis-chat-debug'
  app_version: string
  exported_at: string
  conversation: Conversation
  transcript: string
  runtime: Record<string, unknown>
  turns: Array<{
    id: string
    role: string
    created_at: string
    content: string
    route?: string
    tool?: unknown
    research?: unknown
    debug?: unknown
    flags: string[]
    note?: string
  }>
  summary: {
    user_turns: number
    assistant_turns: number
    tools_executed: string[]
    llm_turns: number
    flags: string[]
  }
  memory_from_this_chat: Array<{ key: string; value: string; category: string }>
}

const SECRET =
  /^(gemini_api_key|groq_api_key|tankerkoenig_api_key|omdb_api_key|tv_token|pc_token|spotify_client_id|spotify_access|spotify_refresh|spotify_expires_at)$/

function runtimeSnapshot(): Record<string, unknown> {
  const s = loadSettings()
  const safe: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(s)) {
    if (SECRET.test(k)) {
      safe[k] = typeof v === 'string' && v.trim() ? '[set]' : ''
      continue
    }
    safe[k] = v
  }
  return {
    gemini_configured: isGeminiConfigured(),
    groq_key: Boolean(s.groq_api_key?.trim()),
    settings: safe,
  }
}

export async function buildChatDebugDump(conversationId: string): Promise<ChatDebugDump> {
  const convs = await listConversations()
  const conversation = convs.find((c) => c.id === conversationId)
  if (!conversation) throw new Error('Gespräch nicht gefunden.')
  const messages = await listMessages(conversationId)
  const mem = await listMemory()
  let audits: Array<{ id: string }> = []
  try {
    audits = await listResearchAudits(200)
  } catch {
    audits = []
  }
  const auditIds = new Set(audits.map((a) => a.id))

  const turns: ChatDebugDump['turns'] = []
  const tools: string[] = []
  const allFlags = new Set<string>()
  let lastUser = ''
  for (const m of messages) {
    if (m.role === 'user') lastUser = m.content
    const meta = (m.meta || {}) as Record<string, unknown>
    const debug = meta.debug as DebugMeta | undefined
    const tool = meta.tool as ToolMeta | undefined
    const research = meta.research as ResearchMeta | undefined
    const flags = m.role === 'assistant' ? flagReply(lastUser, m.content, meta) : []
    for (const f of flags) allFlags.add(f)
    if (tool?.tool && tool.tool_status === 'executed') tools.push(`${tool.tool}:${tool.action || ''}`)
    const noteParts: string[] = []
    if (debug?.route) noteParts.push(`route=${debug.route}`)
    else if (tool?.tool) noteParts.push(`tool=${tool.tool}`)
    else if (m.role === 'assistant') noteParts.push('route unknown')
    if (research?.audit_id && !auditIds.has(research.audit_id)) noteParts.push('audit missing')
    turns.push({
      id: m.id,
      role: m.role,
      created_at: m.created_at,
      content: m.content,
      route: debug?.route || (tool?.tool ? String(tool.tool) : undefined),
      tool: tool || undefined,
      research: research || undefined,
      debug: debug || undefined,
      flags,
      note: noteParts.join('; ') || undefined,
    })
  }

  const transcript = turns
    .map((t) => {
      const head = t.role === 'user' ? 'USER' : 'JARVIS'
      const extra =
        t.role === 'assistant' ? ` [${t.route || '—'}]${t.flags.length ? ` flags=${t.flags.join(',')}` : ''}` : ''
      return `${head}${extra}\n${t.content}`
    })
    .join('\n\n')

  return {
    kind: 'jarvis-chat-debug',
    app_version: APP_VERSION,
    exported_at: new Date().toISOString(),
    conversation,
    transcript,
    runtime: runtimeSnapshot(),
    turns,
    summary: {
      user_turns: turns.filter((t) => t.role === 'user').length,
      assistant_turns: turns.filter((t) => t.role === 'assistant').length,
      tools_executed: [...new Set(tools)],
      llm_turns: turns.filter((t) => t.flags.includes('llm') || t.route === 'llm').length,
      flags: [...allFlags],
    },
    memory_from_this_chat: mem
      .filter((m) => m.source_conversation_id === conversationId)
      .map((m) => ({ key: m.key, value: m.value, category: m.category })),
  }
}

function fileSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9äöüß]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'chat'
  )
}

export function debugFileName(conv: Conversation, at = new Date()): string {
  const day = at.toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `jarvis-debug-${fileSlug(conv.title)}-${day}.json`
}

export function expandPickedMessageIds(messages: Array<Pick<Message, 'id' | 'role'>>, picked: Iterable<string>): string[] {
  const want = new Set(picked)
  const keep = new Set<string>()
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]
    if (!want.has(m.id)) continue
    keep.add(m.id)
    if (m.role === 'user') {
      const next = messages[i + 1]
      if (next?.role === 'assistant') keep.add(next.id)
    } else if (m.role === 'assistant') {
      const prev = messages[i - 1]
      if (prev?.role === 'user') keep.add(prev.id)
    }
  }
  return messages.filter((m) => keep.has(m.id)).map((m) => m.id)
}

export function applyTurnFilter(dump: ChatDebugDump, ids?: string[] | null): ChatDebugDump {
  if (!ids?.length) return dump
  const set = new Set(ids)
  const turns = dump.turns.filter((t) => set.has(t.id))
  const tools: string[] = []
  const allFlags = new Set<string>()
  for (const t of turns) {
    const tool = t.tool as { tool?: string; action?: string; tool_status?: string } | undefined
    if (tool?.tool && tool.tool_status === 'executed') tools.push(`${tool.tool}:${tool.action || ''}`)
    for (const f of t.flags) allFlags.add(f)
  }
  const transcript = turns
    .map((t) => {
      const head = t.role === 'user' ? 'USER' : 'JARVIS'
      const extra =
        t.role === 'assistant' ? ` [${t.route || '—'}]${t.flags.length ? ` flags=${t.flags.join(',')}` : ''}` : ''
      return `${head}${extra}\n${t.content}`
    })
    .join('\n\n')
  return {
    ...dump,
    transcript,
    turns,
    summary: {
      user_turns: turns.filter((t) => t.role === 'user').length,
      assistant_turns: turns.filter((t) => t.role === 'assistant').length,
      tools_executed: [...new Set(tools)],
      llm_turns: turns.filter((t) => t.flags.includes('llm') || t.route === 'llm').length,
      flags: [...allFlags],
    },
  }
}

export async function downloadChatDebug(
  conversationId: string,
  pickedIds?: string[] | null,
): Promise<{ ok: boolean; name: string; message: string }> {
  const full = await buildChatDebugDump(conversationId)
  const ids = pickedIds?.length
    ? expandPickedMessageIds(
        full.turns.map((t) => ({ id: t.id, role: t.role })),
        pickedIds,
      )
    : null
  const dump = applyTurnFilter(full, ids)
  const name = debugFileName(dump.conversation)
  const json = `${JSON.stringify(dump, null, 2)}\n`
  const native = await writeNative(name, json)
  if (native.ok) return { ok: true, name, message: native.message }
  const web = triggerBrowserDownload(name, json)
  if (web) return { ok: true, name, message: 'JSON in Downloads.' }
  return { ok: false, name, message: 'Download blockiert. Kopieren nutzen.' }
}

async function writeNative(name: string, json: string): Promise<{ ok: boolean; message: string }> {
  if (!Capacitor.isNativePlatform()) return { ok: false, message: '' }
  try {
    await Filesystem.writeFile({
      path: name,
      data: json,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    })
    return { ok: true, message: `Gespeichert unter Dokumente/${name}` }
  } catch {
    return { ok: false, message: '' }
  }
}

function triggerBrowserDownload(name: string, json: string): boolean {
  try {
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    return true
  } catch {
    return false
  }
}
