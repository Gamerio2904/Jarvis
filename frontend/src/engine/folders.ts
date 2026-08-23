import { parseFolderIntent } from './folder-parse'
import {
  createFolder,
  deleteFolder,
  listFolders,
  loadSettings,
  moveConversation,
  persistLastList,
  type ChatFolder,
} from './store'
import type { ToolMeta } from './tools'

export { parseFolderIntent } from './folder-parse'
export type { FolderIntent } from './folder-parse'

type FolderHit = {
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}

function folderTool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'folder', action, label }
}

function matchFolder(rows: ChatFolder[], title: string): ChatFolder | undefined {
  const q = title.trim().toLowerCase()
  return rows.find((f) => f.title.toLowerCase() === q) || rows.find((f) => f.title.toLowerCase().includes(q))
}

export async function handleFolders(conversationId: string, text: string): Promise<FolderHit> {
  const intent = parseFolderIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'create') {
    const row = await createFolder(intent.title)
    persistLastList('folder', [row.title])
    return {
      handled: true,
      reply: `Ordner ${row.title} liegt. Lokal, kein Cloud-Sync.`,
      tool: folderTool('create', row.title),
      lastTool: 'folder',
    }
  }

  if (intent.kind === 'list') {
    const rows = await listFolders()
    if (!rows.length) {
      return {
        handled: true,
        reply: 'Noch kein Ordner. Sagen Sie „neuer Ordner Arbeit“.',
        tool: folderTool('list', 'Ordner'),
        lastTool: 'folder',
      }
    }
    persistLastList(
      'folder',
      rows.map((f) => f.title),
    )
    return {
      handled: true,
      reply: `Ordner: ${rows.map((f) => f.title).join(', ')}.`,
      tool: folderTool('list', 'Ordner'),
      lastTool: 'folder',
    }
  }

  if (intent.kind === 'move') {
    const rows = await listFolders()
    let folder = matchFolder(rows, intent.title)
    if (!folder) folder = await createFolder(intent.title)
    await moveConversation(conversationId, folder.id)
    persistLastList('folder', [folder.title])
    return {
      handled: true,
      reply: `Das Gespräch liegt in ${folder.title}.`,
      tool: folderTool('move', folder.title),
      lastTool: 'folder',
    }
  }

  if (intent.kind === 'open') {
    const rows = await listFolders()
    const folder = matchFolder(rows, intent.title)
    if (!folder) {
      return {
        handled: true,
        reply: `Ordner ${intent.title} gibt es nicht. „Neuer Ordner ${intent.title}“ legt ihn an.`,
        tool: folderTool('ask', 'Ordner fehlt'),
        lastTool: 'folder',
      }
    }
    persistLastList('folder', [folder.title])
    return {
      handled: true,
      reply: `Ordner ${folder.title}. In der Liste links.`,
      tool: folderTool('open', folder.title),
      lastTool: 'folder',
    }
  }

  if (intent.kind === 'delete') {
    const rows = await listFolders()
    const folder = matchFolder(rows, intent.title)
    if (!folder) {
      return {
        handled: true,
        reply: `Ordner ${intent.title} ist nicht da.`,
        tool: folderTool('ask', 'Ordner fehlt'),
        lastTool: 'folder',
      }
    }
    if (loadSettings().last_step_tool === 'folder' && /lösch/i.test(text)) {
      await deleteFolder(folder.id, false)
      return {
        handled: true,
        reply: `Ordner ${folder.title} weg. Die Gespräche bleiben.`,
        tool: folderTool('delete', folder.title),
        lastTool: 'folder',
      }
    }
    persistLastList('folder', [folder.title])
    await deleteFolder(folder.id, false)
    return {
      handled: true,
      reply: `Ordner ${folder.title} weg. Die Gespräche bleiben, nichts still mitgelöscht.`,
      tool: folderTool('delete', folder.title),
      lastTool: 'folder',
    }
  }

  return { handled: false }
}
