import { completeChat, ensureModel, getDownloadProgress, getLlmError, hasCachedModel, isModelReady, releaseModel } from './llm'
import { completeGemini, geminiReady, GEMINI_LABEL, streamGemini, testGemini } from './gemini'
import { groqReady, testGroq } from './groq'
import { userFacingCloudError } from './cloud-errors'
import { HELP_TEXT, isHelpCommand, scrubReply } from './guards'
import { handleMemory, memoryBlock } from './memory'
import { GEMINI_PERSONA, PERSONA, VOICE_HINT } from './persona'
import { isLiveLookup, RESEARCH_NEEDS_GEMINI, RESEARCH_OFF_REPLY, type ResearchMeta } from './research-parse'
import {
  APP_VERSION,
  DEFAULT_MODEL,
  addMessage,
  addResearchAudit,
  createConversation as storeCreate,
  deleteConversation as storeDelete,
  get as storeGet,
  listConversations as storeListConv,
  listMemory,
  listMessages,
  loadSettings,
  saveSettings,
  touchConversation,
  type Conversation,
  type Message,
  type Settings,
} from './store'
import { handleCalendar } from './calendar'
import { handleReminders } from './reminders'
import { handleTimers } from './timers'
import { handleTools, type ToolMeta } from './tools'
import { handleTv, tvStatusFromSettings } from './tv'
import { handleWeather } from './weather'

export type StreamHandlers = {
  onMeta?: (meta: {
    user_message: Message
    model: string
    using_fallback: boolean
    research?: ResearchMeta | null
  }) => void
  onToken?: (token: string) => void
  onReplace?: (content: string) => void
  onRetry?: (attempt: number) => void
  onDone?: (payload: {
    assistant_message: Message
    conversation: Conversation
    guarded?: boolean
    research?: ResearchMeta | null
    tool?: ToolMeta | null
  }) => void
  onError?: (detail: string) => void
}

export async function getHealth() {
  const mem = await listMemory()
  const localReady = isModelReady()
  const cloud = geminiReady()
  const ready = cloud || localReady
  const err = getLlmError()
  const prog = getDownloadProgress()
  const s = loadSettings()
  return {
    ok: ready,
    ollama: false,
    engine: cloud ? 'gemini' : 'on-device',
    model: cloud ? GEMINI_LABEL : DEFAULT_MODEL.label,
    model_ready: localReady,
    gemini_ready: cloud,
    gemini_enabled: s.gemini_enabled,
    configured_model: cloud ? GEMINI_LABEL : DEFAULT_MODEL.label,
    fallback_model: DEFAULT_MODEL.label,
    model_heavy: DEFAULT_MODEL.label,
    heavy_equals_default: !cloud,
    using_fallback: false,
    version: APP_VERSION,
    memory_count: mem.length,
    research_opt_in: s.research_opt_in,
    tv: tvStatusFromSettings(),
    warning: cloud
      ? groqReady()
        ? 'Gemini — bei Limit nächstes Modell, dann Groq. Chat geht ins Netz.'
        : 'Gemini (Google) — bei Limit nächstes Modell. Chat geht ins Netz.'
      : localReady
        ? 'On-Device 0.5B — denkt auf diesem Handy, kein Server.'
        : err || 'Modell noch nicht geladen.',
    error: ready
      ? undefined
      : s.gemini_enabled && !s.gemini_api_key.trim()
        ? 'Gemini an, aber kein API-Key.'
        : err || 'Modell nicht geladen. Unter Einstellungen herunterladen oder Gemini nutzen.',
    download_pct: prog.pct,
  }
}

export function getSettings(): Settings {
  return loadSettings()
}

export function patchSettings(patch: Partial<Settings>): Settings {
  return saveSettings(patch)
}

export { ensureModel, getDownloadProgress, hasCachedModel, isModelReady, releaseModel, testGemini, testGroq, geminiReady }

export async function streamChat(
  conversationId: string,
  content: string,
  handlers: StreamHandlers,
  opts?: { voice?: boolean },
): Promise<void> {
  const conv = await storeGet<Conversation>('conversations', conversationId)
  if (!conv) throw new Error('Gespräch nicht gefunden.')

  const userMessage = await addMessage(conversationId, 'user', content)
  const usingGemini = geminiReady()
  handlers.onMeta?.({
    user_message: userMessage,
    model: usingGemini ? GEMINI_LABEL : DEFAULT_MODEL.label,
    using_fallback: false,
    research: null,
  })

  try {
    if (isHelpCommand(content)) {
      const assistant = await addMessage(conversationId, 'assistant', HELP_TEXT)
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({
        assistant_message: assistant,
        conversation: updated,
        tool: null,
      })
      return
    }

    const tvHit = await handleTv(content)
    if (tvHit.handled && tvHit.reply) {
      const assistant = await addMessage(conversationId, 'assistant', tvHit.reply)
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({
        assistant_message: assistant,
        conversation: updated,
        tool: { tool_status: 'executed', tool: 'tv', action: 'command', label: 'TV' },
      })
      return
    }

    const memHit = await handleMemory(conversationId, content)
    if (memHit.handled && memHit.reply) {
      const assistant = await addMessage(conversationId, 'assistant', memHit.reply)
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({
        assistant_message: assistant,
        conversation: updated,
        tool: null,
      })
      return
    }

    const calHit = await handleCalendar(conversationId, content)
    if (calHit.handled && calHit.reply) {
      const assistant = await addMessage(conversationId, 'assistant', calHit.reply, {
        tool: calHit.tool,
      })
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({
        assistant_message: assistant,
        conversation: updated,
        tool: calHit.tool || null,
      })
      return
    }

    const timerHit = await handleTimers(conversationId, content)
    if (timerHit.handled && timerHit.reply) {
      const assistant = await addMessage(conversationId, 'assistant', timerHit.reply, {
        tool: timerHit.tool,
      })
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({
        assistant_message: assistant,
        conversation: updated,
        tool: timerHit.tool || null,
      })
      return
    }

    const remindHit = await handleReminders(conversationId, content)
    if (remindHit.handled && remindHit.reply) {
      const assistant = await addMessage(conversationId, 'assistant', remindHit.reply, {
        tool: remindHit.tool,
      })
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({
        assistant_message: assistant,
        conversation: updated,
        tool: remindHit.tool || null,
      })
      return
    }

    const toolHit = await handleTools(conversationId, content)
    if (toolHit.handled && toolHit.reply) {
      const assistant = await addMessage(conversationId, 'assistant', toolHit.reply, {
        tool: toolHit.tool,
      })
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({
        assistant_message: assistant,
        conversation: updated,
        tool: toolHit.tool || null,
      })
      return
    }

    const weatherHit = await handleWeather(content)
    if (weatherHit.handled && weatherHit.reply) {
      let research = weatherHit.research
      if (research) {
        const audit = await addResearchAudit({
          id: crypto.randomUUID(),
          query: research.query || content.slice(0, 120),
          status: research.status || (research.used ? 'ok' : 'empty'),
          sources: (research.sources || []).map((s) => ({
            title: s.title,
            url: s.url,
            snippet: s.snippet,
            provider: s.provider,
          })),
          created_at: new Date().toISOString(),
        })
        research = { ...research, audit_id: audit.id }
      }
      const assistant = await addMessage(conversationId, 'assistant', weatherHit.reply, {
        tool: weatherHit.tool,
        research,
      })
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({
        assistant_message: assistant,
        conversation: updated,
        research: research || null,
        tool: weatherHit.tool || null,
      })
      return
    }

    if (!geminiReady()) {
      if (!isModelReady()) {
        throw new Error(
          'Lokales Modell ist aus. Unter Einstellungen starten — oder Gemini einschalten.',
        )
      }
    }

    const s = loadSettings()
    if (isLiveLookup(content)) {
      if (!s.research_opt_in) {
        const assistant = await addMessage(conversationId, 'assistant', RESEARCH_OFF_REPLY)
        const updated = (await touchConversation(conversationId)) || conv
        handlers.onDone?.({ assistant_message: assistant, conversation: updated, tool: null })
        return
      }
      if (!geminiReady()) {
        const assistant = await addMessage(conversationId, 'assistant', RESEARCH_NEEDS_GEMINI)
        const updated = (await touchConversation(conversationId)) || conv
        handlers.onDone?.({ assistant_message: assistant, conversation: updated, tool: null })
        return
      }
    }

    const history = await listMessages(conversationId)
    const mem = await listMemory()
    const system = geminiReady()
      ? [GEMINI_PERSONA, opts?.voice ? VOICE_HINT : '', memoryBlock(mem)].filter(Boolean).join('\n\n')
      : [PERSONA, opts?.voice ? VOICE_HINT : '', memoryBlock(mem)].filter(Boolean).join('\n\n')
    const llmMessages = [
      { role: 'system', content: system },
      ...history.slice(geminiReady() ? -12 : -4).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ]

    let acc = ''
    let research: ResearchMeta | undefined
    const raw = geminiReady()
      ? await (opts?.voice ? streamGemini : completeGemini)(
          llmMessages,
          (_piece, full) => {
            acc = full
            handlers.onToken?.(_piece)
          },
          {
            search: Boolean(s.research_opt_in && isLiveLookup(content)),
            maxOutputTokens: opts?.voice ? 96 : undefined,
          },
        ).then((r) => {
          research = r.research
          return r.text
        })
      : await completeChat(llmMessages, (_piece, full) => {
          acc = full
          handlers.onToken?.(_piece)
        })
    const final = scrubReply(raw || acc, { searched: Boolean(research?.used) })
    if (final !== (raw || acc)) handlers.onReplace?.(final)
    if (research) {
      const audit = await addResearchAudit({
        id: crypto.randomUUID(),
        query: research.query || content.slice(0, 120),
        status: research.status || (research.used ? 'ok' : 'empty'),
        sources: (research.sources || []).map((s) => ({
          title: s.title,
          url: s.url,
          snippet: s.snippet,
          provider: s.provider,
        })),
        created_at: new Date().toISOString(),
      })
      research = { ...research, audit_id: audit.id }
    }
    const assistant = await addMessage(conversationId, 'assistant', final, research ? { research } : undefined)
    const updated = (await touchConversation(conversationId)) || conv
    handlers.onDone?.({
      assistant_message: assistant,
      conversation: updated,
      guarded: final !== (raw || acc),
      research: research || null,
      tool: null,
    })
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Chat fehlgeschlagen'
    const detail = geminiReady() ? userFacingCloudError(raw, groqReady()) : raw
    handlers.onError?.(detail)
    throw new Error(detail)
  }
}

export const conversations = {
  list: storeListConv,
  create: storeCreate,
  delete: storeDelete,
}
