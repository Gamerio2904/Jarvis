import { handleImageAsk } from './image-fetch.ts'
import { parseChatSearch } from './search-chat-parse.ts'
import { persistLastList } from './store.ts'
import { formatRecallReply, retrieve } from './retrieve.ts'
import type { ChatBlock } from './chat-blocks.ts'
import type { ToolMeta } from './tools.ts'

export { parseChatSearch } from './search-chat-parse.ts'

export async function handleChatSearch(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string; blocks?: ChatBlock[] }> {
  const image = await handleImageAsk(text)
  if (image) return image
  const q = parseChatSearch(text)
  if (!q) return { handled: false }
  const hits = await retrieve(q)
  if (!hits.length) {
    return { handled: true, reply: `Nichts zu „${q}“ in den Gesprächen.`, lastTool: 'search' }
  }
  persistLastList(
    'search',
    hits.map((h) => h.title),
  )
  return {
    handled: true,
    reply: formatRecallReply(q, hits),
    lastTool: 'search',
  }
}
