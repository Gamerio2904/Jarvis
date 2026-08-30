import { displayFolder, parseFolderIntent } from './folder-parse.ts'
import { listConversations, setConversationFolder } from './store.ts'
import type { ToolMeta } from './tools.ts'

export { parseFolderIntent, displayFolder } from './folder-parse.ts'

export async function handleFolder(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseFolderIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'move') {
    const row = await setConversationFolder(conversationId, intent.folder)
    if (!row) {
      return {
        handled: true,
        reply: 'Kein offenes Gespräch zum Sortieren.',
        tool: { tool_status: 'error', tool: 'chat-folder', action: 'missing', label: 'Ordner' },
        lastTool: 'chat-folder',
      }
    }
    return {
      handled: true,
      reply: `Der Chat liegt unter ${displayFolder(intent.folder)}.`,
      tool: { tool_status: 'executed', tool: 'chat-folder', action: 'move', label: 'Ordner' },
      lastTool: 'chat-folder',
    }
  }
  const convs = await listConversations()
  const wanted = intent.folder
  const rows = wanted ? convs.filter((c) => (c.folder_id || 'sonstiges') === wanted) : convs
  if (!rows.length) {
    return {
      handled: true,
      reply: wanted ? `Unter ${displayFolder(wanted)} liegt kein Chat.` : 'Keine Chats.',
      lastTool: 'chat-folder',
    }
  }
  const lines = rows
    .slice(0, 8)
    .map((c) => `${displayFolder(c.folder_id || 'sonstiges')}: ${c.title}`)
  return {
    handled: true,
    reply: lines.join('\n'),
    tool: { tool_status: 'executed', tool: 'chat-folder', action: 'list', label: 'Ordner' },
    lastTool: 'chat-folder',
  }
}
