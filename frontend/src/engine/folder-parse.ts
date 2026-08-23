import { normalizeUtterance } from './utterance.ts'

export type FolderIntent =
  | { kind: 'create'; title: string }
  | { kind: 'move'; title: string }
  | { kind: 'list' }
  | { kind: 'open'; title: string }
  | { kind: 'delete'; title: string }

export function parseFolderIntent(text: string): FolderIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null
  const create = /^\s*(?:neuer\s+ordner|ordner\s+(?:anlegen|erstellen))\s+(.+?)\s*$/i.exec(t)
  if (create?.[1]) return { kind: 'create', title: clean(create[1]) }
  const move =
    /^\s*(?:leg(?:e)?|pack(?:e)?|sortier(?:e)?)\s+(?:das\s+)?(?:gespräch|chat)?\s*(?:nach|in(?:to)?|zum?)\s+(?:ordner\s+)?(.+?)\s*$/i.exec(
      t,
    )
  if (move?.[1]) return { kind: 'move', title: clean(move[1]) }
  const del = /^\s*(?:lösch(?:e)?|entferne)\s+(?:den\s+)?ordner\s+(.+?)\s*$/i.exec(t)
  if (del?.[1]) return { kind: 'delete', title: clean(del[1]) }
  const open = /^\s*(?:zeig(?:e)?|öffne)\s+(?:den\s+)?ordner\s+(.+?)\s*$/i.exec(t)
  if (open?.[1]) return { kind: 'open', title: clean(open[1]) }
  if (/^\s*(?:zeig(?:e)?|liste)\s+(?:die\s+)?ordner\s*[.!?]*$/i.test(t) || /^\s*ordner\s*[.!?]*$/i.test(t)) {
    return { kind: 'list' }
  }
  return null
}

function clean(raw: string): string {
  return raw.replace(/[.!?]+$/g, '').replace(/^(?:den|die|das|ordner)\s+/i, '').trim()
}
