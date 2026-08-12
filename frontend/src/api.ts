export type Conversation = {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | string
  content: string
  created_at: string
}

export type Health = {
  ok: boolean
  ollama: boolean
  model: string
  model_ready: boolean
  configured_model?: string
  fallback_model?: string
  using_fallback?: boolean
  warning?: string | null
  version?: string
  memory_count?: number
  error?: string
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

export type MemoryCategory = 'pref' | 'fact' | 'open_loop' | 'boundary'

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data?.detail === 'string') return data.detail
    return JSON.stringify(data)
  } catch {
    return res.statusText || 'Unbekannter Fehler'
  }
}

export async function getHealth(): Promise<Health> {
  const res = await fetch('/api/health')
  return res.json()
}

export async function listMemory(
  category?: MemoryCategory | null,
): Promise<MemoryItem[]> {
  const q =
    category != null && category !== undefined
      ? `?category=${encodeURIComponent(category)}`
      : ''
  const res = await fetch(`/api/memory${q}`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteMemoryItem(id: string): Promise<void> {
  const res = await fetch(`/api/memory/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function clearMemory(): Promise<void> {
  const res = await fetch('/api/memory', { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function listConversations(): Promise<Conversation[]> {
  const res = await fetch('/api/conversations')
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function createConversation(): Promise<Conversation> {
  const res = await fetch('/api/conversations', {
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
  const res = await fetch(`/api/conversations/${id}`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function sendChat(id: string, content: string) {
  const res = await fetch(`/api/conversations/${id}/chat`, {
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
  }>
}

export type StreamHandlers = {
  onMeta?: (meta: {
    user_message: Message
    model: string
    using_fallback: boolean
  }) => void
  onToken?: (token: string) => void
  onReplace?: (content: string) => void
  onRetry?: (attempt: number) => void
  onDone?: (payload: {
    assistant_message: Message
    conversation: Conversation
    guarded?: boolean
  }) => void
  onError?: (detail: string) => void
}

export async function streamChat(
  id: string,
  content: string,
  handlers: StreamHandlers,
): Promise<void> {
  const res = await fetch(`/api/conversations/${id}/chat/stream`, {
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
