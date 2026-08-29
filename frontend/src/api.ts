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
  testGemini as engineTestGemini,
  testGroq as engineTestGroq,
  releaseModel as engineReleaseModel,
  type StreamHandlers,
} from './engine/chat'
import {
  APP_VERSION,
  addMessage,
  clearMemory as storeClearMemory,
  deleteMemory,
  isGeminiConfigured,
  listMemory as storeListMemory,
  listMessages,
  loadSettings,
  listResearchAudits as storeListAudits,
  listReminders as storeListReminders,
  type Conversation,
  type Reminder,
  type MemoryCategory,
  type MemoryItem,
  type Message,
  type Settings as EngineSettings,
} from './engine/store'
import { discoverTvs, pairTv, testFireTv, testTv, tvStatusFromSettings } from './engine/tv'
import {
  discoverFan,
  learnFan,
  pickFan,
  testFan,
} from './engine/fan'
import {
  discoverPlugs,
  probePlug,
  testPlug,
  loadPlugs,
  upsertPlug,
  removePlug,
  emptyPlug,
  type Plug,
} from './engine/plug'
import { testPc as engineTestPc } from './engine/pc'
import type { ResearchMeta, ResearchSource } from './engine/research-parse'

export type { Conversation, MemoryCategory, MemoryItem, Message, Reminder, StreamHandlers, ResearchMeta, ResearchSource }
export { APP_VERSION, ensureModel, getDownloadProgress, hasCachedModel, isModelReady, isGeminiConfigured }

export async function releaseModel(): Promise<void> {
  return engineReleaseModel()
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
  engine?: string
  model: string
  model_ready: boolean
  gemini_ready?: boolean
  gemini_enabled?: boolean
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
    n_threads?: number
    blocked_reason?: string
  tv?: {
    enabled?: boolean
    name?: string
    host?: string
    mac?: string
    port?: number
    paired?: boolean
    reachable?: boolean
  }
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
  tv_token?: string
  tv_paired?: boolean
  tv_status?: {
    enabled?: boolean
    name?: string
    host?: string
    mac?: string
    port?: number
    paired?: boolean
    reachable?: boolean
  }
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
    tv_status: tvStatusFromSettings(),
  }
}

export async function patchSettings(patch: Partial<Settings>): Promise<Settings> {
  enginePatch(patch as Partial<EngineSettings>)
  return getSettings()
}

export async function listReminders() {
  return storeListReminders()
}

export { removeReminder, syncReminderAlarms } from './engine/reminders'
export { readEyeImage, fileToJpegDataUrl } from './engine/eye'
export { checkHomeFence } from './engine/home'

export async function listResearchAudits(limit = 30): Promise<ResearchAudit[]> {
  const rows = await storeListAudits(limit)
  return rows.map((r) => ({
    id: r.id,
    query: r.query,
    status: r.status,
    created_at: r.created_at,
    sources: (r.sources || []).map((s) => ({
      title: s.title,
      url: s.url,
      snippet: s.snippet || '',
      provider: s.provider || 'google_search',
      retrieved_at: r.created_at,
    })),
  }))
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

export async function createConversation(title?: string): Promise<Conversation> {
  return conversations.create(title)
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
  opts?: { voice?: boolean },
): Promise<void> {
  return engineStream(id, content, handlers, opts)
}

export async function tvDiscover(): Promise<{ items: Array<Record<string, unknown>>; message?: string }> {
  return discoverTvs()
}

export async function tvPair(body: {
  host?: string
  mac?: string
  name?: string
  port?: number
}): Promise<{ ok: boolean; message: string }> {
  return pairTv(body)
}

export async function tvTest(): Promise<{ ok?: boolean; reply?: string }> {
  return testTv()
}

export async function tvFireTest(opts?: { host?: string; port?: number }): Promise<{ ok?: boolean; reply?: string }> {
  return testFireTv(opts)
}

export async function fanDiscover(): Promise<{ items: Array<{ host?: string; mac?: string; name?: string }>; message?: string }> {
  return discoverFan()
}

export async function fanTest(opts?: { host?: string }): Promise<{ ok: boolean; reply: string }> {
  return testFan(opts)
}

export async function fanLearn(slot: 'on' | 'off' | 'speed1' | 'speed2' | 'speed3' | 'light'): Promise<{ ok: boolean; reply: string }> {
  return learnFan(slot)
}

export async function fanPick(item: { host?: string; mac?: string; name?: string }): Promise<string> {
  return pickFan(item)
}

export async function plugDiscover(): Promise<{ items: Array<{ host?: string; mac?: string; name?: string; kind?: string; deviceId?: string }>; message?: string }> {
  return discoverPlugs()
}

export async function plugProbe(plug: Partial<Plug>): Promise<{ ok: boolean; reply: string; kind?: string }> {
  return probePlug(plug)
}

export async function plugTest(plug: Partial<Plug>, on: boolean): Promise<{ ok: boolean; reply: string }> {
  return testPlug(plug, on)
}

export { loadPlugs, upsertPlug, removePlug, emptyPlug }
export type { Plug }

export async function testPc(opts?: { host?: string; token?: string; port?: number }): Promise<{
  ok: boolean
  reply: string
}> {
  return engineTestPc(opts)
}

export async function testGemini(): Promise<{ ok: boolean; reply: string }> {
  return engineTestGemini()
}

export async function testGroq(): Promise<{ ok: boolean; reply: string }> {
  return engineTestGroq()
}
