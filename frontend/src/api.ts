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
  error?: string
}

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
  }>
}
