export type Conversation = {
  id: string
  title: string
  created_at: string
  updated_at: string
}

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

export type Message = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | string
  content: string
  created_at: string
  meta?: {
    research?: ResearchMeta
    tool?: ToolMeta
  } | null
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
}

export type EasterEgg = {
  command: string
  description: string
  example: string
}

export type Settings = {
  research_opt_in: boolean
  research_providers: string[]
  research_allowlist: string[]
  research_timeout_sec: number
  research_max_sources: number
  routing_mode: string
  model_default?: string
  model_heavy?: string
  fallback_model?: string
  delight_moments?: boolean
  delight_moments_per_day?: number
  delight_jokes?: boolean
  delight_joke_frequency?: string
  easter_eggs_enabled?: boolean
  ui_sounds?: boolean
  ui_sound_volume?: 'low' | 'medium' | 'high' | string
  easter_eggs?: EasterEgg[]
  version?: string
}

export type ResearchAudit = {
  id: string
  conversation_id?: string | null
  message_id?: string | null
  query: string
  status: string
  sources: ResearchSource[]
  error?: string | null
  created_at: string
}

export type MemoryItem = {
  id: string
  key: string
  value: string
  category: string
  confidence: number
  source_conversation_id?: string | null
  updated_at: string
  expires_at?: string | null
}

export type MemoryCategory = 'pref' | 'fact' | 'open_loop' | 'boundary' | 'joke'

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data?.detail === 'string') return data.detail
    return JSON.stringify(data)
  } catch {
    return res.statusText || 'Unbekannter Fehler'
  }
}

const API_BASE_KEY = 'jarvis_api_base'

/** Backend origin for Capacitor/APK; empty = same-origin (Vite proxy / reverse-proxy). */
export function getApiBase(): string {
  try {
    const fromLs = localStorage.getItem(API_BASE_KEY)
    if (fromLs != null && fromLs.trim()) return fromLs.trim().replace(/\/$/, '')
  } catch {
    /* ignore */
  }
  const fromEnv = (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE
  if (fromEnv && fromEnv.trim()) return fromEnv.trim().replace(/\/$/, '')
  return ''
}

export function setApiBase(url: string): void {
  const cleaned = (url || '').trim().replace(/\/$/, '')
  try {
    if (!cleaned) localStorage.removeItem(API_BASE_KEY)
    else localStorage.setItem(API_BASE_KEY, cleaned)
  } catch {
    /* ignore */
  }
}

export function apiUrl(path: string): string {
  const base = getApiBase()
  if (!path.startsWith('/')) return `${base}/${path}`
  return `${base}${path}`
}

export async function getHealth(): Promise<Health> {
  const res = await fetch(apiUrl('/api/health'))
  return res.json()
}

export async function getSettings(): Promise<Settings> {
  const res = await fetch(apiUrl('/api/settings'))
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function patchSettings(
  patch: Partial<Settings>,
): Promise<Settings> {
  const res = await fetch(apiUrl('/api/settings'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function listResearchAudits(limit = 30): Promise<ResearchAudit[]> {
  const res = await fetch(apiUrl(`/api/research/audits?limit=${limit}`))
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function listMemory(
  category?: MemoryCategory | null,
): Promise<MemoryItem[]> {
  const q =
    category != null && category !== undefined
      ? `?category=${encodeURIComponent(category)}`
      : ''
  const res = await fetch(apiUrl(`/api/memory${q}`))
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteMemoryItem(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/memory/${id}`), { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function clearMemory(): Promise<void> {
  const res = await fetch(apiUrl('/api/memory'), { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function listConversations(): Promise<Conversation[]> {
  const res = await fetch(apiUrl('/api/conversations'))
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function createConversation(): Promise<Conversation> {
  const res = await fetch(apiUrl('/api/conversations'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Neues Gespräch' }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function getConversation(
  id: string,
): Promise<Conversation & { messages: Message[] }> {
  const res = await fetch(apiUrl(`/api/conversations/${id}`))
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/conversations/${id}`), { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function sendChat(id: string, content: string) {
  const res = await fetch(apiUrl(`/api/conversations/${id}/chat`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<{
    conversation: Conversation
    user_message: Message
    assistant_message: Message
    using_fallback?: boolean
    model?: string
    research?: ResearchMeta | null
  }>
}

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

export async function streamChat(
  id: string,
  content: string,
  handlers: StreamHandlers,
): Promise<void> {
  const res = await fetch(apiUrl(`/api/conversations/${id}/chat/stream`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  if (!res.body) throw new Error('Keine Stream-Antwort vom Server.')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() || ''
    for (const chunk of chunks) {
      const line = chunk
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.startsWith('data:'))
      if (!line) continue
      const raw = line.slice(5).trim()
      let ev: Record<string, unknown>
      try {
        ev = JSON.parse(raw)
      } catch {
        continue
      }
      const type = ev.type
      if (type === 'meta') handlers.onMeta?.(ev as never)
      if (type === 'token') handlers.onToken?.(String(ev.content || ''))
      if (type === 'replace') {
        handlers.onReplace?.(String(ev.content || ''))
      }
      if (type === 'retry') {
        handlers.onRetry?.(Number(ev.attempt || 0))
      }
      if (type === 'done') handlers.onDone?.(ev as never)
      if (type === 'error') {
        handlers.onError?.(String(ev.detail || 'Stream-Fehler'))
        throw new Error(String(ev.detail || 'Stream-Fehler'))
      }
    }
  }
}
