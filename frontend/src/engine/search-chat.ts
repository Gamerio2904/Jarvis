import { parseChatSearch } from './search-chat-parse'
import { getAll, persistLastList, type Conversation, type Message } from './store'
import type { ToolMeta } from './tools'

export { parseChatSearch } from './search-chat-parse'

export async function handleChatSearch(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const q = parseChatSearch(text)
  if (!q) return { handled: false }
  const needle = q.toLowerCase()
  const asked = text.trim().toLowerCase()
  const messages = await getAll<Message>('messages')
  const convs = await getAll<Conversation>('conversations')
  const hits = messages
    .filter((m) => m.content.toLowerCase().includes(needle) && m.content.length < 400)
    .filter((m) => m.content.trim().toLowerCase() !== asked)
    .slice(-8)
  if (!hits.length) {
    const titled = convs.filter((c) => c.title.toLowerCase().includes(needle))
    if (!titled.length) {
      return { handled: true, reply: `Nichts zu „${q}“ in den Gesprächen.`, lastTool: 'search' }
    }
    persistLastList('search', titled.map((c) => c.title))
    return {
      handled: true,
      reply: `Gespräche: ${titled.map((c) => c.title).join('; ')}.`,
      lastTool: 'search',
    }
  }
  const lines = hits.map((m) => {
    const conv = convs.find((c) => c.id === m.conversation_id)
    const bit = m.content.replace(/\s+/g, ' ').slice(0, 90)
    return `• ${conv?.title || 'Gespräch'}: ${bit}`
  })
  persistLastList(
    'search',
    hits.map((m) => convs.find((c) => c.id === m.conversation_id)?.title || m.content.slice(0, 40)),
  )
  return {
    handled: true,
    reply: `Gefunden:\n${lines.join('\n')}`,
    lastTool: 'search',
  }
}
