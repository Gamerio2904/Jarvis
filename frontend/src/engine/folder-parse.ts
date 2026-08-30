import { normalizeUtterance } from './utterance.ts'

export const FOLDER_IDS = ['arbeit', 'privat', 'sonstiges'] as const
export type FolderId = (typeof FOLDER_IDS)[number]

export type FolderIntent =
  | { kind: 'move'; folder: FolderId }
  | { kind: 'list'; folder?: FolderId }

export function normalizeFolder(raw: string): FolderId | null {
  const t = raw.trim().toLowerCase()
  if (/^(arbeit|job|büro|buero|office)$/i.test(t)) return 'arbeit'
  if (/^(privat|privatleben|zuhause|heim)$/i.test(t)) return 'privat'
  if (/^(sonstiges|andere|rest|allgemein)$/i.test(t)) return 'sonstiges'
  return null
}

export function displayFolder(id: string): string {
  if (id === 'arbeit') return 'Arbeit'
  if (id === 'privat') return 'Privat'
  if (id === 'sonstiges') return 'Sonstiges'
  return id
}

export function parseFolderIntent(text: string): FolderIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  const move =
    /^\s*(?:leg(?:e)?|pack(?:e)?|sortier(?:e)?|schieb(?:e)?)\s+(?:den\s+)?(?:chat|gespräch)\s+(?:nach|in(?:to)?|zu)\s+(.+?)\s*$/i.exec(
      t,
    )
  if (move) {
    const folder = normalizeFolder(move[1])
    if (folder) return { kind: 'move', folder }
  }
  const list = /^\s*(?:chats?\s+(?:in|unter)\s+|ordner\s+)(.+?)\s*$/i.exec(t)
  if (list) {
    const folder = normalizeFolder(list[1])
    return { kind: 'list', folder: folder || undefined }
  }
  if (/^\s*(?:chat[- ]?ordner|ordner(?:liste)?)\s*$/i.test(t)) return { kind: 'list' }
  return null
}
