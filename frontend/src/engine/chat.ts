import { completeChat, ensureModel, getDownloadProgress, getLlmError, hasCachedModel, isModelReady } from './llm'
import { ALEXA_PURCHASE_TEXT, HELP_TEXT, isAlexaPurchaseAsk, isHelpCommand, scrubReply } from './guards'
import { handleMemory, memoryBlock } from './memory'
import { PERSONA } from './persona'
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
  const ready = isModelReady()
  const err = getLlmError()
  const prog = getDownloadProgress()
  return {
    ok: ready,
    ollama: ready,
    model: DEFAULT_MODEL.label,
    model_ready: ready,
    configured_model: DEFAULT_MODEL.label,
    fallback_model: DEFAULT_MODEL.label,
    model_heavy: DEFAULT_MODEL.label,
    heavy_equals_default: true,
    using_fallback: false,
    version: APP_VERSION,
    memory_count: mem.length,
    research_opt_in: loadSettings().research_opt_in,
    warning: ready
      ? 'On-Device 0.5B — kleiner als der PC-7b, dafür ohne Server.'
      : err || 'Modell noch nicht geladen.',
    error: ready ? undefined : err || 'Modell nicht geladen',
    download_pct: prog.pct,
  }
}

export function getSettings(): Settings {
  return loadSettings()
}

export function patchSettings(patch: Partial<Settings>): Settings {
  return saveSettings(patch)
}

export { ensureModel, getDownloadProgress, hasCachedModel, isModelReady }

export async function streamChat(
  conversationId: string,
  content: string,
  handlers: StreamHandlers,
): Promise<void> {
  const conv = await storeGet<Conversation>('conversations', conversationId)
  if (!conv) throw new Error('Gespräch nicht gefunden.')

  const userMessage = await addMessage(conversationId, 'user', content)
  handlers.onMeta?.({
    user_message: userMessage,
    model: DEFAULT_MODEL.label,
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

    if (isAlexaPurchaseAsk(content)) {
      const assistant = await addMessage(conversationId, 'assistant', ALEXA_PURCHASE_TEXT)
      const updated = (await touchConversation(conversationId)) || conv
      handlers.onDone?.({
        assistant_message: assistant,
        conversation: updated,
        tool: null,
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

    if (!isModelReady()) {
      if (await hasCachedModel()) {
        await ensureModel()
      } else {
        throw new Error('Modell nicht geladen. Unter Einstellungen einmal herunterladen.')
      }
    }

    const history = await listMessages(conversationId)
    const mem = await listMemory()
    const system = [PERSONA, memoryBlock(mem)].filter(Boolean).join('\n\n')
    const llmMessages = [
      { role: 'system', content: system },
      ...history.slice(-8).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ]

    let acc = ''
    const raw = await completeChat(llmMessages, (_piece, full) => {
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
