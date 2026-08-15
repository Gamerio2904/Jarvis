import { completeChat, ensureModel, getDownloadProgress, getLlmError, hasCachedModel, isModelReady } from './llm'
import { completeGemini, geminiReady, GEMINI_LABEL, testGemini } from './gemini'
import { HELP_TEXT, isHelpCommand, scrubReply } from './guards'
import { handleMemory, memoryBlock } from './memory'
import { GEMINI_PERSONA, PERSONA } from './persona'
import {
  APP_VERSION,
  DEFAULT_MODEL,
  addMessage,
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
import { handleTools, type ToolMeta } from './tools'
import { handleTv, tvStatusFromSettings } from './tv'

export type StreamHandlers = {
  onMeta?: (meta: {
    user_message: Message
    model: string
    using_fallback: boolean
    research?: null
  }) => void
  onToken?: (token: string) => void
  onReplace?: (content: string) => void
  onRetry?: (attempt: number) => void
  onDone?: (payload: {
    assistant_message: Message
    conversation: Conversation
    guarded?: boolean
    research?: null
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
      ? 'Gemini (Google) — Chat geht ins Netz. Nicht privat.'
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

export { ensureModel, getDownloadProgress, hasCachedModel, isModelReady, testGemini, geminiReady }

export async function streamChat(
  conversationId: string,
  content: string,
  handlers: StreamHandlers,
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

    if (!geminiReady()) {
      if (!isModelReady()) {
        if (await hasCachedModel()) {
          await ensureModel()
        } else {
          throw new Error(
            loadSettings().gemini_enabled
              ? 'Gemini-Key fehlt. Unter Einstellungen eintragen oder das lokale Modell laden.'
              : 'Modell nicht geladen. Unter Einstellungen herunterladen oder Gemini (Google) einschalten.',
          )
        }
      }
    }

    const history = await listMessages(conversationId)
    const mem = await listMemory()
    const system = geminiReady()
      ? [GEMINI_PERSONA, memoryBlock(mem)].filter(Boolean).join('\n\n')
      : [PERSONA, memoryBlock(mem)].filter(Boolean).join('\n\n')
    const llmMessages = [
      { role: 'system', content: system },
      ...history.slice(geminiReady() ? -12 : -4).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ]

    let acc = ''
    const raw = geminiReady()
      ? await completeGemini(llmMessages, (_piece, full) => {
          acc = full
          handlers.onToken?.(_piece)
        })
      : await completeChat(llmMessages, (_piece, full) => {
          acc = full
          handlers.onToken?.(_piece)
        })
    const final = scrubReply(raw || acc)
    if (final !== (raw || acc)) handlers.onReplace?.(final)
    const assistant = await addMessage(conversationId, 'assistant', final)
    const updated = (await touchConversation(conversationId)) || conv
    handlers.onDone?.({
      assistant_message: assistant,
      conversation: updated,
      guarded: final !== (raw || acc),
      tool: null,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Chat fehlgeschlagen'
    handlers.onError?.(detail)
    throw err
  }
}

export const conversations = {
  list: storeListConv,
  create: storeCreate,
  delete: storeDelete,
}
