import {
  conversations,
  ensureModel,
  getDownloadProgress,
  getHealth as engineHealth,
  getSettings as engineSettings,
  hasCachedModel,
  isModelReady,
  patchSettings as enginePatch,
  streamChat as engineStream,
  type StreamHandlers,
} from './engine/chat'
import {
  APP_VERSION,
  addMessage,
  clearMemory as storeClearMemory,
  deleteMemory,
  listMemory as storeListMemory,
  listMessages,
  loadSettings,
  type Conversation,
  type MemoryItem,
  type Message,
  type Settings as EngineSettings,
} from './engine/store'

export type { Conversation, MemoryItem, Message, StreamHandlers }
export { APP_VERSION, ensureModel, getDownloadProgress, hasCachedModel, isModelReady }

export type MemoryCategory = 'pref' | 'fact' | 'open_loop' | 'boundary' | 'joke'

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

export type ToolMeta = {
  tool_status?: string
  tool?: string
  action?: string
  preview?: string
  label?: string
  result?: Record<string, unknown>
  error?: string
}

export type Health = {
  ok: boolean
  ollama: boolean
  model: string
  model_ready: boolean
  configured_model?: string
  fallback_model?: string
  model_heavy?: string
  heavy_equals_default?: boolean
  using_fallback?: boolean
  warning?: string | null
  version?: string
  memory_count?: number
  research_opt_in?: boolean
  error?: string
  download_pct?: number
}

export type EasterEgg = { command: string; description: string; example: string }

export type Settings = EngineSettings & {
  research_providers?: string[]
  research_allowlist?: string[]
  research_timeout_sec?: number
  research_max_sources?: number
  owner_token_set?: boolean
  easter_eggs?: EasterEgg[]
  tv_port?: number
  tv_status?: { enabled?: boolean; name?: string; host?: string; mac?: string; paired?: boolean; reachable?: boolean }
}

export type ResearchAudit = {
  id: string
  query: string
  status: string
  sources: ResearchSource[]
  created_at: string
}

export function getApiBase(): string {
  return ''
}
export function setApiBase(_value: string): void {}
export function getOwnerToken(): string {
  return ''
}
export function setOwnerToken(_value: string): void {}
export function isNativeApp(): boolean {
  return false
}
export function needsLanProxySetup(): boolean {
  return false
}

export async function getHealth(): Promise<Health> {
  return engineHealth()
}

export async function getSettings(): Promise<Settings> {
  const s = engineSettings()
  return {
    ...s,
    owner_token_set: false,
    easter_eggs: [
      { command: '/hilfe', description: 'Kurz was Jarvis kann', example: '/hilfe' },
    ],
    tv_status: { enabled: false, paired: false, reachable: false },
  }
}

export async function patchSettings(patch: Partial<Settings>): Promise<Settings> {
  enginePatch(patch as Partial<EngineSettings>)
  return getSettings()
}

export async function listResearchAudits(_limit = 30): Promise<ResearchAudit[]> {
  return []
}

export async function listMemory(category?: MemoryCategory | null): Promise<MemoryItem[]> {
  return storeListMemory(category || null)
}

export async function deleteMemoryItem(id: string): Promise<void> {
  await deleteMemory(id)
}

export async function clearMemory(): Promise<void> {
  await storeClearMemory()
}

export async function listConversations(): Promise<Conversation[]> {
  return conversations.list()
}

export async function createConversation(): Promise<Conversation> {
  return conversations.create()
}

export async function getConversation(
  id: string,
): Promise<Conversation & { messages: Message[] }> {
  const list = await conversations.list()
  const conv = list.find((c) => c.id === id)
  if (!conv) throw new Error('Gespräch nicht gefunden')
  return { ...conv, messages: await listMessages(id) }
}

export async function deleteConversation(id: string): Promise<void> {
  await conversations.delete(id)
}

export async function sendChat(id: string, content: string) {
  let assistant: Message | null = null
  let conv: Conversation | null = null
  await streamChat(id, content, {
    onDone: (p) => {
      assistant = p.assistant_message
      conv = p.conversation
    },
  })
  return {
    conversation: conv,
    user_message: await addMessage(id, 'user', content),
    assistant_message: assistant,
    model: loadSettings().model_default,
  }
}

export async function streamChat(
  id: string,
  content: string,
  handlers: StreamHandlers,
): Promise<void> {
  return engineStream(id, content, handlers)
}

export async function tvDiscover(): Promise<{ items: Array<Record<string, unknown>> }> {
  return { items: [] }
}

export async function tvPair(_body: {
  host?: string
  mac?: string
  name?: string
  port?: number
}): Promise<{ ok: boolean; message: string }> {
  return {
    ok: false,
    message: 'TV ist in 0.13.1 geparkt. Jarvis denkt auf dem Handy; Tizen-Keys kommen später.',
  }
}

export async function tvTest(): Promise<{ ok?: boolean; reply?: string }> {
  return {
    ok: false,
    reply: 'TV-Steuerung nicht im On-Device-Build. Chat läuft lokal.',
  }
}
